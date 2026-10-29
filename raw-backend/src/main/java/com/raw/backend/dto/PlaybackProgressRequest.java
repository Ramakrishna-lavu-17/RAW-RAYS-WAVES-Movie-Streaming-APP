package com.raw.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PlaybackProgressRequest {

    @NotNull(message = "Last position is required")
    @Min(value = 0, message = "Playback position cannot be negative")
    private Long lastPositionSeconds;

    private Long durationSeconds;
}
