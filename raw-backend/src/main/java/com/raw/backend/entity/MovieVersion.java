package com.raw.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "movie_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MovieVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    @JsonIgnore
    private Movie movie;

    @Column(nullable = false, length = 20)
    private String quality; // "480p", "720p", "1080p"

    @Column(nullable = false, length = 20)
    private String resolution; // "854x480", "1280x720", "1920x1080"

    @Column(name = "manifest_url", nullable = false, length = 1000)
    private String manifestUrl;

    @Column(name = "manifest_object_key", length = 1000)
    private String manifestObjectKey;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
