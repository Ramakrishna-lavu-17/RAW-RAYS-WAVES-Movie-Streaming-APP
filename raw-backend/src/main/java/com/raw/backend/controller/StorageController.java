package com.raw.backend.controller;

import com.raw.backend.service.LocalStorageService;
import com.raw.backend.service.StorageService;
import com.raw.backend.service.StorageTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Slf4j
@CrossOrigin(origins = "*")
public class StorageController {

    private final StorageService storageService;
    private final StorageTokenService storageTokenService;

    public StorageController(StorageService storageService, StorageTokenService storageTokenService) {
        this.storageService = storageService;
        this.storageTokenService = storageTokenService;
    }

    /**
     * Protected media streaming endpoint.
     * Serves HLS playlists and video segments directly from Local Object Storage.
     * Enforces HMAC-SHA256 token verification, subscription quality gating, and HTTP 206 Range requests.
     */
    @GetMapping("/storage/stream/buckets/{bucketName}/objects/**")
    public void streamObject(
            @PathVariable String bucketName,
            @RequestParam(value = "token", required = false) String token,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        // Extract objectKey from request URI after "/objects/"
        String uri = request.getRequestURI();
        String objectsMarker = "/objects/";
        int markerIdx = uri.indexOf(objectsMarker);
        if (markerIdx == -1) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid object streaming URI");
            return;
        }

        String objectKey = uri.substring(markerIdx + objectsMarker.length());
        // Clean path to prevent directory traversal
        objectKey = objectKey.replace("\\", "/");
        if (objectKey.contains("..")) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid object path");
            return;
        }

        // 1. Authorize access via signed token (from query param or Referer)
        if (token == null || token.isBlank()) {
            String referer = request.getHeader(HttpHeaders.REFERER);
            if (referer != null && referer.contains("token=")) {
                int tokenIdx = referer.indexOf("token=");
                int ampIdx = referer.indexOf('&', tokenIdx);
                token = (ampIdx != -1)
                        ? referer.substring(tokenIdx + 6, ampIdx)
                        : referer.substring(tokenIdx + 6);
            }
        }

        if (token == null || token.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Playback token is required for streaming");
            return;
        }

        StorageTokenService.TokenClaims claims = storageTokenService.validateToken(token);
        if (claims == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or expired playback token");
            return;
        }

        // 2. Validate movie ID matches object key
        if (objectKey.startsWith("movies/")) {
            String[] segments = objectKey.split("/");
            if (segments.length >= 2) {
                try {
                    Long requestedMovieId = Long.parseLong(segments[1]);
                    if (!requestedMovieId.equals(claims.getMovieId())) {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Token is not authorized for this movie");
                        return;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        // 3. Subscription Quality Authorization Check
        if (!storageTokenService.isQualityPermitted(claims.getAllowedQuality(), objectKey)) {
            log.warn("Subscription quality violation: user quality [{}] attempted to stream [{}]",
                    claims.getAllowedQuality(), objectKey);
            response.sendError(HttpServletResponse.SC_FORBIDDEN,
                    "Your subscription quality (" + claims.getAllowedQuality() + ") does not permit streaming this resolution.");
            return;
        }

        // 4. Locate object in Local Object Storage
        File file = storageService.getObjectFile(bucketName, objectKey);
        if (!file.exists() || !file.isFile()) {
            log.warn("Storage object not found: bucket={}, key={}", bucketName, objectKey);
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Media object not found");
            return;
        }

        // 5. Special handling for HLS playlists: Rewrite relative segment URLs to append signed token and filter variant streams by subscription tier
        if (objectKey.endsWith(".m3u8")) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            response.setContentType("application/x-mpegURL");

            java.util.List<String> lines = java.nio.file.Files.readAllLines(file.toPath(), java.nio.charset.StandardCharsets.UTF_8);
            StringBuilder rewritten = new StringBuilder();

            boolean isMaster = objectKey.toLowerCase().endsWith("master.m3u8");
            String allowedQuality = claims.getAllowedQuality() != null ? claims.getAllowedQuality().toLowerCase() : "1080p";

            boolean skipNextUri = false;
            for (String line : lines) {
                String trimmed = line.trim();

                // Dynamic master playlist filtering: omit resolutions above user's subscription tier
                if (isMaster) {
                    if (trimmed.startsWith("#EXT-X-STREAM-INF:")) {
                        String streamInfLower = trimmed.toLowerCase();
                        boolean disallowed = false;
                        if ("720p".equals(allowedQuality) && (streamInfLower.contains("1920x1080") || streamInfLower.contains("name=\"1080p\""))) {
                            disallowed = true;
                        } else if ("480p".equals(allowedQuality) && (streamInfLower.contains("1920x1080") || streamInfLower.contains("1280x720")
                                || streamInfLower.contains("name=\"1080p\"") || streamInfLower.contains("name=\"720p\""))) {
                            disallowed = true;
                        }
                        if (disallowed) {
                            skipNextUri = true;
                            continue;
                        } else {
                            skipNextUri = false;
                        }
                    } else if (skipNextUri && !trimmed.startsWith("#")) {
                        skipNextUri = false;
                        continue;
                    }
                }

                if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                    if (!trimmed.contains("token=")) {
                        line = trimmed + (trimmed.contains("?") ? "&token=" : "?token=") + token;
                    }
                }
                rewritten.append(line).append("\n");
            }

            byte[] outputBytes = rewritten.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            response.setContentLength(outputBytes.length);
            try (OutputStream os = response.getOutputStream()) {
                os.write(outputBytes);
                os.flush();
            }
            return;
        }

        long fileLength = file.length();
        String contentType = detectContentType(objectKey);

        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setContentType(contentType);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "public, max-age=86400");

        String rangeHeader = request.getHeader(HttpHeaders.RANGE);

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            // Process HTTP 206 Partial Content (Byte Range Request)
            long rangeStart = 0;
            long rangeEnd = fileLength - 1;

            String rangeValue = rangeHeader.substring(6).trim();
            int dashPos = rangeValue.indexOf('-');
            if (dashPos != -1) {
                String startPart = rangeValue.substring(0, dashPos).trim();
                String endPart = rangeValue.substring(dashPos + 1).trim();

                if (!startPart.isEmpty()) {
                    rangeStart = Long.parseLong(startPart);
                }
                if (!endPart.isEmpty()) {
                    rangeEnd = Long.parseLong(endPart);
                }
            }

            if (rangeEnd >= fileLength) {
                rangeEnd = fileLength - 1;
            }

            if (rangeStart > rangeEnd) {
                response.setStatus(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength);
                return;
            }

            long contentLength = rangeEnd - rangeStart + 1;
            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
            response.setHeader(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileLength));
            response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength));

            try (RandomAccessFile raf = new RandomAccessFile(file, "r");
                 OutputStream os = response.getOutputStream()) {
                raf.seek(rangeStart);
                byte[] buffer = new byte[64 * 1024]; // 64KB buffer
                long remaining = contentLength;
                while (remaining > 0) {
                    int bytesToRead = (int) Math.min(buffer.length, remaining);
                    int read = raf.read(buffer, 0, bytesToRead);
                    if (read == -1) break;
                    os.write(buffer, 0, read);
                    remaining -= read;
                }
                os.flush();
            }

        } else {
            // Full content delivery
            response.setStatus(HttpServletResponse.SC_OK);
            response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength));

            try (RandomAccessFile raf = new RandomAccessFile(file, "r");
                 OutputStream os = response.getOutputStream()) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = raf.read(buffer)) != -1) {
                    os.write(buffer, 0, read);
                }
                os.flush();
            }
        }
    }

    /**
     * Admin Storage Metrics Dashboard endpoint.
     * Returns total disk space, used, free, breakdown by category, and per-movie storage.
     */
    @GetMapping("/admin/storage/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminStorageStats() {
        return ResponseEntity.ok(storageService.getStorageStats());
    }

    private String detectContentType(String key) {
        String lower = key.toLowerCase();
        if (lower.endsWith(".m3u8")) return "application/x-mpegURL";
        if (lower.endsWith(".ts")) return "video/mp2t";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
