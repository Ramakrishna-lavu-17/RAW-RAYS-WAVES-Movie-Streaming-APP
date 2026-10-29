package com.raw.backend.dto;

import com.raw.backend.entity.MovieStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieResponse {

    private Long id;
    private String title;
    private String description;
    private String language;
    private Integer releaseYear;
    private Integer durationMinutes;
    private String posterUrl;
    private String backdropUrl;
    private String trailerUrl;
    private String movieUrl;
    private String movieSourceUrl;
    private String sourceStoragePath;
    private String sourceObjectKey;
    private String hlsMasterUrl;
    private String hlsMasterObjectKey;
    private com.raw.backend.entity.MovieProcessingStatus processingStatus;
    private String processingError;
    private Integer durationSeconds;
    private String ageRating;

    private LocalDate theatricalReleaseDate;
    private LocalDate officialOttReleaseDate;
    private LocalDate rawAvailableDate;

    private MovieStatus status;
    private Boolean isAvailableToWatch; // Backend calculated OTT availability
    private Boolean active;
    private Long tmdbId;
    private String videoType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Set<GenreResponse> genres;

}
