package com.raw.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayMovieResponse {
    private Long movieId;
    private String title;
    private String authorizedQuality; // "480p", "720p", "1080p"
    private String userSubscriptionQuality;
    private String hlsManifestUrl; // Authorized quality HLS manifest or master manifest if Premium
    private String videoType; // HLS, DIRECT
    private Integer durationMinutes;
    private Integer durationSeconds;
    private Long startPositionSeconds;
    private boolean authorized;
    private String message;
    private List<MovieVersionDto> availableTiers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieVersionDto {
        private String quality;
        private String resolution;
        private boolean accessible;
    }
}
