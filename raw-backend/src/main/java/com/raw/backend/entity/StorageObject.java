package com.raw.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "storage_objects", indexes = {
    @Index(name = "idx_storage_bucket_key", columnList = "bucket_name, object_key", unique = true),
    @Index(name = "idx_storage_bucket", columnList = "bucket_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageObject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bucket_name", nullable = false, length = 100)
    private String bucketName; // e.g. "raw-movies"

    @Column(name = "object_key", nullable = false, length = 1000)
    private String objectKey; // e.g. "movies/24/master.m3u8", "movies/24/720p/index.m3u8"

    @Column(name = "content_type", length = 100)
    private String contentType; // e.g. "application/x-mpegURL", "video/mp2t", "video/mp4"

    @Column(name = "file_size")
    private Long fileSize; // Size in bytes

    @Column(length = 64)
    private String etag; // MD5 checksum / ETag

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
