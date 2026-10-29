package com.raw.backend.dto;

import com.raw.backend.entity.MovieStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovieStatusUpdateRequest {

    @NotNull(message = "Movie status is required")
    private MovieStatus status;
}
