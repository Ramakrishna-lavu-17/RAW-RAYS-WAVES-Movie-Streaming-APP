package com.raw.backend.service;

import com.raw.backend.entity.StorageObject;

import java.io.File;
import java.util.List;
import java.util.Map;

public interface StorageService {

    String getBucketName();

    /**
     * Stores a single object in the specified bucket and records its metadata in PostgreSQL.
     */
    StorageObject storeObject(String bucketName, String objectKey, File file, String contentType);

    /**
     * Recursively stores all files in a directory into the specified bucket prefix
     * and records every object in PostgreSQL.
     */
    List<StorageObject> storeDirectory(String bucketName, String basePrefix, File directory);

    /**
     * Locates the physical file for an object.
     */
    File getObjectFile(String bucketName, String objectKey);

    /**
     * Checks if an object exists.
     */
    boolean objectExists(String bucketName, String objectKey);

    /**
     * Deletes all objects matching bucket and prefix from storage and PostgreSQL.
     */
    void deletePrefix(String bucketName, String prefix);

    /**
     * Deletes a single object.
     */
    void deleteObject(String bucketName, String objectKey);

    /**
     * Generates a signed playback/streaming access URL.
     */
    String getSignedPlaybackUrl(String bucketName, String objectKey, Long userId, Long movieId, String allowedQuality, long ttlSeconds);

    /**
     * Global storage metrics for admin dashboard.
     */
    Map<String, Object> getStorageStats();

    /**
     * Storage breakdown for an individual movie.
     */
    Map<String, Object> getMovieStorageStats(Long movieId);

    // Compatibility methods for existing pipeline
    String uploadFile(String storageKey, File file, String contentType);
    void uploadDirectory(String baseStoragePrefix, File localDirectory);
    String getPlaybackUrl(String storageKey);
    void deleteStoragePath(String storagePath);
    boolean isConfigured();
}
