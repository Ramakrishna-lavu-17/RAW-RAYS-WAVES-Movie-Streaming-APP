package com.raw.backend.service;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.StorageObject;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.StorageObjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service("localStorageService")
@Slf4j
public class LocalStorageService implements StorageService {

    private final String rootStoragePath;
    private final String defaultBucket;
    private final String tempPath;
    private final StorageObjectRepository storageObjectRepository;
    private final StorageTokenService storageTokenService;
    private final MovieRepository movieRepository;

    public LocalStorageService(
            @Value("${raw.storage.local.root-path:C:/raw-storage}") String rootStoragePath,
            @Value("${raw.storage.bucket-name:raw-movies}") String defaultBucket,
            @Value("${raw.storage.temp-path:C:/raw-storage/temp}") String tempPath,
            StorageObjectRepository storageObjectRepository,
            StorageTokenService storageTokenService,
            @org.springframework.context.annotation.Lazy MovieRepository movieRepository) {
        this.rootStoragePath = rootStoragePath.replace("\\", "/");
        this.defaultBucket = defaultBucket.trim();
        this.tempPath = tempPath.replace("\\", "/");
        this.storageObjectRepository = storageObjectRepository;
        this.storageTokenService = storageTokenService;
        this.movieRepository = movieRepository;

        initStorageDirectories();
    }

    private void initStorageDirectories() {
        File bucketDir = new File(rootStoragePath, "buckets/" + defaultBucket);
        new File(bucketDir, "movies").mkdirs();
        new File(bucketDir, "trailers").mkdirs();
        new File(bucketDir, "images").mkdirs();
        new File(tempPath).mkdirs();
        log.info("Initialized Local S3/R2-style Object Storage at {} for bucket: {}", rootStoragePath, defaultBucket);
    }

    @Override
    public String getBucketName() {
        return defaultBucket;
    }

    @Override
    @Transactional
    public StorageObject storeObject(String bucketName, String objectKey, File file, String contentType) {
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanKey = sanitizeKey(objectKey);

        File destination = getObjectFile(cleanBucket, cleanKey);
        destination.getParentFile().mkdirs();

        try {
            try {
                Files.copy(file.toPath(), destination.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception copyEx) {
                FileUtils.copyFile(file, destination);
            }
            long fileSize = destination.length();
            String etag = Long.toHexString(fileSize) + "-" + Long.toHexString(destination.lastModified());

            String detectedType = (contentType != null && !contentType.isBlank())
                    ? contentType
                    : detectContentType(cleanKey);

            StorageObject obj = storageObjectRepository
                    .findByBucketNameAndObjectKey(cleanBucket, cleanKey)
                    .orElseGet(() -> StorageObject.builder()
                            .bucketName(cleanBucket)
                            .objectKey(cleanKey)
                            .build());

            obj.setFileSize(fileSize);
            obj.setEtag(etag);
            obj.setContentType(detectedType);

            StorageObject saved = storageObjectRepository.save(obj);
            log.debug("Stored object in {}: key={}, size={} bytes, etag={}", cleanBucket, cleanKey, fileSize, etag);
            return saved;
        } catch (IOException e) {
            log.error("Failed to store object {}: {}", cleanKey, e.getMessage(), e);
            throw new RuntimeException("Failed to store object: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public List<StorageObject> storeDirectory(String bucketName, String basePrefix, File directory) {
        if (!directory.exists() || !directory.isDirectory()) {
            log.warn("Directory does not exist for storage: {}", directory.getAbsolutePath());
            return Collections.emptyList();
        }

        long startTime = System.currentTimeMillis();
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanBasePrefix = sanitizeKey(basePrefix);
        File targetBaseDir = new File(rootStoragePath + "/buckets/" + cleanBucket, cleanBasePrefix);
        targetBaseDir.mkdirs();

        List<StorageObject> storedObjects = new ArrayList<>();

        try {
            Path sourceRoot = directory.toPath();
            Path targetRoot = targetBaseDir.toPath();

            List<Path> filePaths;
            try (java.util.stream.Stream<Path> stream = Files.walk(sourceRoot)) {
                filePaths = stream.filter(Files::isRegularFile).collect(Collectors.toList());
            }

            // Clean up any old DB records for this prefix to allow fast batch insert
            storageObjectRepository.deleteByBucketNameAndObjectKeyStartingWith(cleanBucket, cleanBasePrefix);

            for (Path path : filePaths) {
                Path relative = sourceRoot.relativize(path);
                Path destPath = targetRoot.resolve(relative);
                Files.createDirectories(destPath.getParent());

                // Fast move, link, or copy
                try {
                    Files.move(path, destPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                } catch (Exception moveEx) {
                    try {
                        Files.createLink(destPath, path);
                    } catch (Exception linkEx) {
                        Files.copy(path, destPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    }
                }

                File destFile = destPath.toFile();
                long fileSize = destFile.length();
                String objectKey = cleanBasePrefix + "/" + relative.toString().replace("\\", "/");
                String etag = Long.toHexString(fileSize) + "-" + Long.toHexString(destFile.lastModified());
                String detectedType = detectContentType(objectKey);

                StorageObject obj = StorageObject.builder()
                        .bucketName(cleanBucket)
                        .objectKey(objectKey)
                        .fileSize(fileSize)
                        .etag(etag)
                        .contentType(detectedType)
                        .build();

                storedObjects.add(obj);
            }

            // Fast batch persist in PostgreSQL
            storageObjectRepository.saveAll(storedObjects);

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Ultra-fast stored {} objects in bucket '{}' under prefix '{}' in {} ms",
                    storedObjects.size(), cleanBucket, cleanBasePrefix, elapsed);
            return storedObjects;
        } catch (IOException e) {
            log.error("Failed to store directory {} under prefix {}", directory.getAbsolutePath(), cleanBasePrefix, e);
            throw new RuntimeException("Failed to store directory in object storage: " + e.getMessage(), e);
        }
    }

    @Override
    public File getObjectFile(String bucketName, String objectKey) {
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanKey = sanitizeKey(objectKey);
        return new File(rootStoragePath + "/buckets/" + cleanBucket, cleanKey);
    }

    @Override
    public boolean objectExists(String bucketName, String objectKey) {
        File file = getObjectFile(bucketName, objectKey);
        return file.exists() && file.isFile();
    }

    @Override
    @Transactional
    public void deletePrefix(String bucketName, String prefix) {
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanPrefix = sanitizeKey(prefix);

        // Delete from local disk
        File targetDir = new File(rootStoragePath + "/buckets/" + cleanBucket, cleanPrefix);
        if (targetDir.exists()) {
            FileUtils.deleteQuietly(targetDir);
            log.info("Deleted filesystem path for bucket '{}', prefix '{}'", cleanBucket, cleanPrefix);
        }

        // Delete metadata references in PostgreSQL
        storageObjectRepository.deleteByBucketNameAndObjectKeyStartingWith(cleanBucket, cleanPrefix);
        log.info("Deleted database StorageObject entries for prefix '{}'", cleanPrefix);
    }

    @Override
    @Transactional
    public void deleteObject(String bucketName, String objectKey) {
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanKey = sanitizeKey(objectKey);

        File target = getObjectFile(cleanBucket, cleanKey);
        if (target.exists()) {
            target.delete();
        }
        storageObjectRepository.deleteByBucketNameAndObjectKey(cleanBucket, cleanKey);
    }

    @Override
    public String getSignedPlaybackUrl(String bucketName, String objectKey, Long userId, Long movieId, String allowedQuality, long ttlSeconds) {
        String cleanBucket = (bucketName == null || bucketName.isBlank()) ? defaultBucket : bucketName.trim();
        String cleanKey = sanitizeKey(objectKey);
        String token = storageTokenService.generateToken(userId, movieId, allowedQuality, ttlSeconds);
        return "/api/storage/stream/buckets/" + cleanBucket + "/objects/" + cleanKey + "?token=" + token;
    }

    @Override
    public Map<String, Object> getStorageStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        File rootDir = new File(rootStoragePath);
        long totalSpace = rootDir.getTotalSpace();
        long freeSpace = rootDir.getFreeSpace();
        long usableSpace = rootDir.getUsableSpace();

        // Calculate usage from PostgreSQL StorageObject records
        Long movieBytes = storageObjectRepository.sumSizeByBucketAndPrefix(defaultBucket, "movies/");
        Long trailerBytes = storageObjectRepository.sumSizeByBucketAndPrefix(defaultBucket, "trailers/");
        Long imageBytes = storageObjectRepository.sumSizeByBucketAndPrefix(defaultBucket, "images/");
        Long allBucketBytes = storageObjectRepository.sumSizeByBucket(defaultBucket);

        // Temp storage from actual disk folder
        long tempBytes = 0;
        File tempDir = new File(tempPath);
        if (tempDir.exists()) {
            tempBytes = FileUtils.sizeOfDirectory(tempDir);
        }

        long totalUsedBytes = allBucketBytes + tempBytes;

        stats.put("totalStorageBytes", totalSpace);
        stats.put("usedStorageBytes", totalUsedBytes);
        stats.put("freeStorageBytes", freeSpace);
        stats.put("movieStorageBytes", movieBytes);
        stats.put("trailerStorageBytes", trailerBytes);
        stats.put("imageStorageBytes", imageBytes);
        stats.put("tempStorageBytes", tempBytes);

        stats.put("totalStorageFormatted", formatBytes(totalSpace));
        stats.put("usedStorageFormatted", formatBytes(totalUsedBytes));
        stats.put("freeStorageFormatted", formatBytes(freeSpace));
        stats.put("movieStorageFormatted", formatBytes(movieBytes));
        stats.put("trailerStorageFormatted", formatBytes(trailerBytes));
        stats.put("imageStorageFormatted", formatBytes(imageBytes));
        stats.put("tempStorageFormatted", formatBytes(tempBytes));

        // Per-movie storage breakdown
        List<Map<String, Object>> movieBreakdowns = new ArrayList<>();
        List<Movie> movies = movieRepository.findAll();
        for (Movie m : movies) {
            Map<String, Object> movieStats = getMovieStorageStats(m.getId());
            movieStats.put("title", m.getTitle());
            movieBreakdowns.add(movieStats);
        }
        stats.put("movies", movieBreakdowns);

        return stats;
    }

    @Override
    public Map<String, Object> getMovieStorageStats(Long movieId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("movieId", movieId);

        List<StorageObject> objects = storageObjectRepository.findByMovieId(defaultBucket, String.valueOf(movieId));

        long sourceBytes = 0;
        long p480Bytes = 0;
        long p720Bytes = 0;
        long p1080Bytes = 0;
        long totalBytes = 0;

        for (StorageObject obj : objects) {
            long size = obj.getFileSize() != null ? obj.getFileSize() : 0L;
            totalBytes += size;

            String key = obj.getObjectKey();
            if (key.contains("/480p/")) {
                p480Bytes += size;
            } else if (key.contains("/720p/")) {
                p720Bytes += size;
            } else if (key.contains("/1080p/")) {
                p1080Bytes += size;
            } else if (key.endsWith(".mp4") || key.contains("source")) {
                sourceBytes += size;
            }
        }

        stats.put("sourceBytes", sourceBytes);
        stats.put("sourceFormatted", formatBytes(sourceBytes));
        stats.put("p480Bytes", p480Bytes);
        stats.put("p480Formatted", formatBytes(p480Bytes));
        stats.put("p720Bytes", p720Bytes);
        stats.put("p720Formatted", formatBytes(p720Bytes));
        stats.put("p1080Bytes", p1080Bytes);
        stats.put("p1080Formatted", formatBytes(p1080Bytes));
        stats.put("totalBytes", totalBytes);
        stats.put("totalFormatted", formatBytes(totalBytes));

        return stats;
    }

    // Compatibility methods
    @Override
    public String uploadFile(String storageKey, File file, String contentType) {
        storeObject(defaultBucket, storageKey, file, contentType);
        return getPlaybackUrl(storageKey);
    }

    @Override
    public void uploadDirectory(String baseStoragePrefix, File localDirectory) {
        storeDirectory(defaultBucket, baseStoragePrefix, localDirectory);
    }

    @Override
    public String getPlaybackUrl(String storageKey) {
        String cleanKey = sanitizeKey(storageKey);
        return "/api/storage/stream/buckets/" + defaultBucket + "/objects/" + cleanKey;
    }

    @Override
    public void deleteStoragePath(String storagePath) {
        deletePrefix(defaultBucket, storagePath);
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    private String computeEtag(File file) {
        try (FileInputStream fis = new FileInputStream(file)) {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = fis.read(buffer)) != -1) {
                md.update(buffer, 0, read);
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
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

    private String sanitizeKey(String key) {
        if (key == null) return "";
        String normalized = key.replace("\\", "/");
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return new DecimalFormat("#,##0.#").format(bytes / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }
}
