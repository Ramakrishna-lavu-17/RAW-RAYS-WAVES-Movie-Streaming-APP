package com.raw.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service("r2StorageService")
@Slf4j
public class R2StorageService implements StorageService {

    private final String accountId;
    private final String accessKeyId;
    private final String secretAccessKey;
    private final String bucketName;
    private final String publicUrl;
    private S3Client s3Client;

    public R2StorageService(
            @Value("${raw.storage.r2.account-id:}") String accountId,
            @Value("${raw.storage.r2.access-key-id:}") String accessKeyId,
            @Value("${raw.storage.r2.secret-access-key:}") String secretAccessKey,
            @Value("${raw.storage.r2.bucket-name:raw-movies}") String bucketName,
            @Value("${raw.storage.r2.public-url:}") String publicUrl) {
        this.accountId = accountId != null ? accountId.trim() : "";
        this.accessKeyId = accessKeyId != null ? accessKeyId.trim() : "";
        this.secretAccessKey = secretAccessKey != null ? secretAccessKey.trim() : "";
        this.bucketName = bucketName != null ? bucketName.trim() : "raw-movies";
        this.publicUrl = publicUrl != null ? publicUrl.trim() : "";

        if (isConfigured()) {
            initClient();
        } else {
            log.info("Cloudflare R2 credentials not fully provided; storage service will use local external storage fallback.");
        }
    }

    private void initClient() {
        try {
            String endpoint = "https://" + accountId + ".r2.cloudflarestorage.com";
            this.s3Client = S3Client.builder()
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                    .region(Region.of("auto"))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                    .build();
            log.info("Initialized Cloudflare R2 S3 client with endpoint: {} and bucket: {}", endpoint, bucketName);
        } catch (Exception e) {
            log.error("Failed to initialize Cloudflare R2 client: {}", e.getMessage(), e);
            this.s3Client = null;
        }
    }

    @Override
    public String uploadFile(String storageKey, File file, String contentType) {
        if (!isConfigured() || s3Client == null) {
            throw new IllegalStateException("Cloudflare R2 is not configured.");
        }

        String cleanKey = sanitizeKey(storageKey);
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(cleanKey)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromFile(file));
            log.debug("Uploaded file to Cloudflare R2: s3://{}/{}", bucketName, cleanKey);
            return getPlaybackUrl(cleanKey);
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudflare R2: {}", cleanKey, e);
            throw new RuntimeException("Failed to upload to Cloudflare R2: " + e.getMessage(), e);
        }
    }

    @Override
    public void uploadDirectory(String baseStoragePrefix, File localDirectory) {
        if (!localDirectory.exists() || !localDirectory.isDirectory()) {
            return;
        }

        String cleanPrefix = sanitizeKey(baseStoragePrefix);
        try {
            Files.walk(localDirectory.toPath())
                    .filter(path -> Files.isRegularFile(path))
                    .forEach(path -> {
                        File file = path.toFile();
                        String relative = localDirectory.toPath().relativize(path).toString().replace("\\", "/");
                        String fileKey = cleanPrefix + "/" + relative;
                        String mimeType = determineMimeType(file.getName());
                        uploadFile(fileKey, file, mimeType);
                    });
            log.info("Completed recursive upload of {} to Cloudflare R2 prefix: {}",
                    localDirectory.getName(), cleanPrefix);
        } catch (Exception e) {
            log.error("Error during directory upload to Cloudflare R2: {}", e.getMessage(), e);
            throw new RuntimeException("Directory upload to R2 failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getPlaybackUrl(String storageKey) {
        String cleanKey = sanitizeKey(storageKey);
        if (publicUrl != null && !publicUrl.isBlank()) {
            String base = publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
            return base + "/" + cleanKey;
        }
        // Fallback to R2 standard endpoint
        return "https://" + accountId + ".r2.cloudflarestorage.com/" + bucketName + "/" + cleanKey;
    }

    @Override
    public void deleteStoragePath(String storagePath) {
        if (!isConfigured() || s3Client == null) return;
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(sanitizeKey(storagePath))
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete object from R2: {}", storagePath);
        }
    }

    @Override
    public String getBucketName() {
        return bucketName;
    }

    @Override
    public com.raw.backend.entity.StorageObject storeObject(String bucketName, String objectKey, File file, String contentType) {
        uploadFile(objectKey, file, contentType);
        return null;
    }

    @Override
    public List<com.raw.backend.entity.StorageObject> storeDirectory(String bucketName, String basePrefix, File directory) {
        uploadDirectory(basePrefix, directory);
        return Collections.emptyList();
    }

    @Override
    public File getObjectFile(String bucketName, String objectKey) {
        return null;
    }

    @Override
    public boolean objectExists(String bucketName, String objectKey) {
        return false;
    }

    @Override
    public void deletePrefix(String bucketName, String prefix) {
        deleteStoragePath(prefix);
    }

    @Override
    public void deleteObject(String bucketName, String objectKey) {
        deleteStoragePath(objectKey);
    }

    @Override
    public String getSignedPlaybackUrl(String bucketName, String objectKey, Long userId, Long movieId, String allowedQuality, long ttlSeconds) {
        return getPlaybackUrl(objectKey);
    }

    @Override
    public Map<String, Object> getStorageStats() {
        return Collections.emptyMap();
    }

    @Override
    public Map<String, Object> getMovieStorageStats(Long movieId) {
        return Collections.emptyMap();
    }

    @Override
    public boolean isConfigured() {
        return !accountId.isBlank() && !accessKeyId.isBlank() && !secretAccessKey.isBlank();
    }

    private String sanitizeKey(String key) {
        if (key == null) return "";
        String normalized = key.replace("\\", "/");
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }

    private String determineMimeType(String filename) {
        if (filename.endsWith(".m3u8")) return "application/x-mpegURL";
        if (filename.endsWith(".ts")) return "video/mp2t";
        if (filename.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }
}
