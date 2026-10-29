package com.raw.backend.dto;

import com.raw.backend.entity.MovieStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class MovieRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Language is required")
    private String language;

    private Integer releaseYear;
    private Integer durationMinutes;
    private String posterUrl;
    private String backdropUrl;
    private String trailerUrl;
    private String movieUrl;
    private String movieSourceUrl;
    private String ageRating;

    private LocalDate theatricalReleaseDate;
    private LocalDate officialOttReleaseDate;
    private LocalDate rawAvailableDate;

    @NotNull(message = "Status is required")
    private MovieStatus status;

    private Long tmdbId;
    private String videoType;

    private Set<Long> genreIds;

}
