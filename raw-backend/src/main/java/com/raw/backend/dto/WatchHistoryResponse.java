package com.raw.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchHistoryResponse {

    private Long id;
    private MovieResponse movie;
    private Long lastPositionSeconds;
    private Long durationSeconds;
    private LocalDateTime lastWatchedAt;
    private Boolean completed;
}
