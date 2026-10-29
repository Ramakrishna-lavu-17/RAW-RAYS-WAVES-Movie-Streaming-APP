package com.raw.backend.dto;

import com.raw.backend.entity.MovieProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieProcessingStatusResponse {
    private Long movieId;
    private String title;
    private MovieProcessingStatus processingStatus;
    private String processingError;
    private String sourceStoragePath;
    private String sourceObjectKey;
    private String hlsMasterUrl;
    private String hlsMasterObjectKey;
    private Integer durationMinutes;
    private Integer durationSeconds;
}
