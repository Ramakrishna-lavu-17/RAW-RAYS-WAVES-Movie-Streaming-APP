package com.raw.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

@Service
@Slf4j
public class MovieIngestionService {

    private final UrlSecurityValidator urlSecurityValidator;

    public MovieIngestionService(UrlSecurityValidator urlSecurityValidator) {
        this.urlSecurityValidator = urlSecurityValidator;
    }

    @Value("${raw.storage.temp-path:C:/raw-storage/temp}")
    private String tempStorageRoot;

    /**
     * Ingests authorized movie source URL into a temporary scratch file for processing.
     * @param movieId Movie ID
     * @param sourceUrl Authorized movie source URL
     * @return Local downloaded temporary file
     */
    public File ingestSource(Long movieId, String sourceUrl) {
        log.info("Starting ingestion for Movie #{} from source: {}", movieId, sourceUrl);

        if (sourceUrl == null || sourceUrl.isBlank()) {
            throw new IllegalArgumentException("Movie source URL or local path cannot be empty.");
        }

        // Clean surrounding quotes or whitespace (e.g. from Windows 'Copy as path')
        String cleaned = sourceUrl.trim();
        if ((cleaned.startsWith("\"") && cleaned.endsWith("\"")) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }

        // Prepare temp working folder
        File tempDir = new File(tempStorageRoot, "movie_" + movieId);
        if (!tempDir.exists()) {
            tempDir.mkdirs();
        }

        File targetFile = new File(tempDir, "source.mp4");
        if (targetFile.exists()) {
            FileUtils.deleteQuietly(targetFile);
        }

        // Check if input is a local file path (e.g. C:\Users\... or file:///... or /home/...)
        String localPath = cleaned;
        if (localPath.toLowerCase().startsWith("file:///")) {
            localPath = localPath.substring(8);
        } else if (localPath.toLowerCase().startsWith("file://")) {
            localPath = localPath.substring(7);
        }

        File candidateFile = new File(localPath);
        if (candidateFile.exists() && candidateFile.isFile()) {
            log.info("Local file detected for Movie #{}: {}", movieId, candidateFile.getAbsolutePath());
            try {
                FileUtils.copyFile(candidateFile, targetFile);
                log.info("Successfully copied local movie file ({} MB) to {}",
                        targetFile.length() / (1024 * 1024), targetFile.getAbsolutePath());
                return targetFile;
            } catch (Exception e) {
                log.error("Failed to copy local file: {}", e.getMessage(), e);
                FileUtils.deleteQuietly(targetFile);
                throw new RuntimeException("Failed to copy local movie file: " + e.getMessage(), e);
            }
        }

        // 1. Validate security and SSRF constraints for remote URLs
        urlSecurityValidator.validateSourceUrl(cleaned);

        // 2. Download stream to scratch file
        HttpURLConnection connection = null;
        try {
            URL url = URI.create(cleaned).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(60000);
            connection.setRequestProperty("User-Agent", "RAW-OTT-MediaIngest/1.0");

            int responseCode = connection.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                throw new IllegalStateException("Failed to download source file. HTTP response: " + responseCode);
            }

            long contentLength = connection.getContentLengthLong();
            log.info("Downloading movie source #{} (Reported Content-Length: {} bytes)", movieId, contentLength);

            try (InputStream in = connection.getInputStream();
                 FileOutputStream out = new FileOutputStream(targetFile)) {
                byte[] buffer = new byte[65536]; // 64 KB buffer
                int bytesRead;
                long totalBytes = 0;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalBytes += bytesRead;
                }
                log.info("Successfully ingested Movie #{} (Total downloaded: {} MB) to {}",
                        movieId, totalBytes / (1024 * 1024), targetFile.getAbsolutePath());
            }

            return targetFile;
        } catch (Exception e) {
            log.error("Failed to ingest movie from source URL: {}", sourceUrl, e);
            FileUtils.deleteQuietly(targetFile);
            throw new RuntimeException("Movie ingestion failed: " + e.getMessage(), e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * Cleans up temporary movie scratch directory after processing completes or fails.
     */
    public void cleanupTemp(Long movieId) {
        File tempDir = new File(tempStorageRoot, "movie_" + movieId);
        if (tempDir.exists()) {
            FileUtils.deleteQuietly(tempDir);
            log.debug("Cleaned up temp ingest directory: {}", tempDir.getAbsolutePath());
        }
    }
}
