package com.raw.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String language;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "poster_url")
    private String posterUrl;

    @Column(name = "backdrop_url")
    private String backdropUrl;

    @Column(name = "trailer_url", length = 1000)
    private String trailerUrl;

    @Column(name = "movie_url", length = 1000)
    private String movieUrl;

    @Column(name = "movie_source_url", length = 1000)
    private String movieSourceUrl;

    @Column(name = "source_storage_path", length = 1000)
    private String sourceStoragePath;

    @Column(name = "source_object_key", length = 1000)
    private String sourceObjectKey;

    @Column(name = "hls_master_url", length = 1000)
    private String hlsMasterUrl;

    @Column(name = "hls_master_object_key", length = 1000)
    private String hlsMasterObjectKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status")
    private MovieProcessingStatus processingStatus = MovieProcessingStatus.READY;

    @Column(name = "processing_error", length = 1000)
    private String processingError;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "age_rating")
    private String ageRating;

    @Column(name = "theatrical_release_date")
    private LocalDate theatricalReleaseDate;

    @Column(name = "official_ott_release_date")
    private LocalDate officialOttReleaseDate;

    @Column(name = "raw_available_date")
    private LocalDate rawAvailableDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovieStatus status = MovieStatus.COMING_SOON;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "tmdb_id")
    private Long tmdbId;

    @Column(name = "video_type")
    private String videoType; // YOUTUBE, DIRECT, EMBED

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "movie_genres",
        joinColumns = @JoinColumn(name = "movie_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<MovieVersion> versions = new HashSet<>();
}
