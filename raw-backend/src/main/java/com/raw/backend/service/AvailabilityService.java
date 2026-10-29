package com.raw.backend.service;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AvailabilityService {

    public boolean isMovieAvailableToWatch(Movie movie) {
        if (movie == null || !Boolean.TRUE.equals(movie.getActive())) {
            return false;
        }

        if (movie.getMovieUrl() == null || movie.getMovieUrl().isBlank()) {
            return false;
        }

        if (movie.getStatus() != MovieStatus.AVAILABLE) {
            return false;
        }

        if (movie.getProcessingStatus() != null && movie.getProcessingStatus() != com.raw.backend.entity.MovieProcessingStatus.READY) {
            return false;
        }

        LocalDate today = LocalDate.now();

        if (movie.getRawAvailableDate() != null && movie.getRawAvailableDate().isAfter(today)) {
            return false;
        }

        if (movie.getOfficialOttReleaseDate() != null && movie.getOfficialOttReleaseDate().isAfter(today)) {
            return false;
        }

        return true;
    }
}
