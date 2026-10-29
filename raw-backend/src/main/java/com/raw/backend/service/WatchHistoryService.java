package com.raw.backend.service;

import com.raw.backend.dto.PlaybackProgressRequest;
import com.raw.backend.dto.WatchHistoryResponse;
import com.raw.backend.entity.ContentAsset;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.User;
import com.raw.backend.entity.WatchHistory;
import com.raw.backend.repository.ContentAssetRepository;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.WatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchHistoryService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final MovieRepository movieRepository;
    private final ContentAssetRepository contentAssetRepository;
    private final AvailabilityService availabilityService;
    private final MovieService movieService;

    public List<WatchHistoryResponse> getUserWatchHistory(User currentUser) {
        return watchHistoryRepository.findByUserOrderByLastWatchedAtDesc(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<WatchHistoryResponse> getContinueWatching(User currentUser) {
        return watchHistoryRepository.findContinueWatching(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> startPlayback(User currentUser, Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        String streamUrl = null;
        if (movie.getHlsMasterUrl() != null && !movie.getHlsMasterUrl().isBlank()) {
            streamUrl = movie.getHlsMasterUrl().trim();
        } else if (movie.getMovieUrl() != null && !movie.getMovieUrl().isBlank()) {
            streamUrl = movie.getMovieUrl().trim();
        } else {
            Optional<ContentAsset> assetOpt = contentAssetRepository.findByMovieAndAssetTypeAndActiveTrue(movie, "VIDEO");
            if (assetOpt.isPresent() && assetOpt.get().getStorageReference() != null && !assetOpt.get().getStorageReference().isBlank()) {
                String ref = assetOpt.get().getStorageReference().trim();
                if (movie.getTrailerUrl() == null || !ref.equalsIgnoreCase(movie.getTrailerUrl().trim())) {
                    streamUrl = ref;
                }
            }
        }

        boolean hasStream = (streamUrl != null && !streamUrl.isBlank());
        if (!hasStream || !availabilityService.isMovieAvailableToWatch(movie)) {
            Map<String, Object> response = new HashMap<>();
            response.put("movieId", movie.getId());
            response.put("title", movie.getTitle());
            response.put("movieUrl", "");
            response.put("streamUrl", "");
            response.put("trailerUrl", movie.getTrailerUrl() != null ? movie.getTrailerUrl() : "");
            response.put("videoType", movie.getVideoType() != null ? movie.getVideoType() : "DIRECT");
            response.put("backdropUrl", movie.getBackdropUrl() != null ? movie.getBackdropUrl() : "");
            response.put("posterUrl", movie.getPosterUrl() != null ? movie.getPosterUrl() : "");
            response.put("startPositionSeconds", 0L);
            response.put("authorized", false);
            response.put("isAvailable", false);
            response.put("status", "COMING_SOON");
            response.put("message", "Movie is coming soon. The streaming source is not yet available.");
            return response;
        }

        String trailerUrl = movie.getTrailerUrl() != null ? movie.getTrailerUrl() : "";

        String videoType = movie.getVideoType();
        if (videoType == null || videoType.isBlank()) {
            if (streamUrl != null && (streamUrl.contains("youtube.com") || streamUrl.contains("youtu.be"))) {
                videoType = "YOUTUBE";
            } else {
                videoType = "DIRECT";
            }
        }

        Optional<WatchHistory> historyOpt = watchHistoryRepository.findByUserAndMovie(currentUser, movie);
        Long startPosition = historyOpt.map(WatchHistory::getLastPositionSeconds).orElse(0L);

        Map<String, Object> response = new HashMap<>();
        response.put("movieId", movie.getId());
        response.put("title", movie.getTitle());
        response.put("movieUrl", movie.getMovieUrl() != null ? movie.getMovieUrl() : "");
        response.put("streamUrl", streamUrl);
        response.put("trailerUrl", trailerUrl);
        response.put("videoType", videoType);
        response.put("backdropUrl", movie.getBackdropUrl() != null ? movie.getBackdropUrl() : "");
        response.put("posterUrl", movie.getPosterUrl() != null ? movie.getPosterUrl() : "");
        response.put("startPositionSeconds", startPosition);
        response.put("authorized", true);
        response.put("isAvailable", true);

        return response;
    }

    @Transactional
    public WatchHistoryResponse updatePlaybackProgress(User currentUser, Long movieId, PlaybackProgressRequest request) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (!availabilityService.isMovieAvailableToWatch(movie)) {
            throw new IllegalArgumentException("This movie is not available for streaming.");
        }

        WatchHistory history = watchHistoryRepository.findByUserAndMovie(currentUser, movie)
                .orElseGet(() -> {
                    WatchHistory newHistory = new WatchHistory();
                    newHistory.setUser(currentUser);
                    newHistory.setMovie(movie);
                    return newHistory;
                });

        history.setLastPositionSeconds(request.getLastPositionSeconds());

        if (request.getDurationSeconds() != null && request.getDurationSeconds() > 0) {
            history.setDurationSeconds(request.getDurationSeconds());
            // Mark completed if watched > 90%
            if ((double) request.getLastPositionSeconds() / request.getDurationSeconds() >= 0.90) {
                history.setCompleted(true);
            }
        }

        return mapToResponse(watchHistoryRepository.save(history));
    }

    public ResponseEntity<?> authorizeQualityStream(User currentUser, Long movieId, String quality, String headerQuality) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (!availabilityService.isMovieAvailableToWatch(movie) || movie.getMovieUrl() == null || movie.getMovieUrl().isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "MOVIE_COMING_SOON");
            err.put("message", "Movie is coming soon. The streaming link is not yet available.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        try {
            com.raw.backend.dto.PlayMovieResponse playResp = movieService.getPlayManifestForUser(movieId, currentUser, quality, headerQuality);
            Map<String, Object> response = new HashMap<>();
            response.put("authorized", true);
            response.put("movieId", movie.getId());
            response.put("title", movie.getTitle());
            response.put("quality", playResp.getAuthorizedQuality());
            response.put("userMaxQuality", playResp.getUserSubscriptionQuality());
            response.put("streamUrl", playResp.getHlsManifestUrl());
            response.put("hlsManifestUrl", playResp.getHlsManifestUrl());
            response.put("videoType", playResp.getVideoType());
            response.put("clarity", quality.equalsIgnoreCase("1080P") ? "Full HD 1080p60 Cinematic Bitrate" : quality + " High Definition");
            return ResponseEntity.ok(response);
        } catch (SecurityException se) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", "UPGRADE_REQUIRED");
            errorBody.put("message", se.getMessage());
            errorBody.put("requiredQuality", quality);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody);
        }
    }

    private WatchHistoryResponse mapToResponse(WatchHistory history) {
        return WatchHistoryResponse.builder()
                .id(history.getId())
                .movie(movieService.mapToResponse(history.getMovie()))
                .lastPositionSeconds(history.getLastPositionSeconds())
                .durationSeconds(history.getDurationSeconds())
                .lastWatchedAt(history.getLastWatchedAt())
                .completed(history.getCompleted())
                .build();
    }
}
