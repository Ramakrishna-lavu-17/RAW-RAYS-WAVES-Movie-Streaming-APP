package com.raw.backend.service;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieProcessingStatus;
import com.raw.backend.entity.MovieStatus;
import com.raw.backend.entity.MovieVersion;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.MovieVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MovieProcessingPipeline {

    private final MovieRepository movieRepository;
    private final MovieVersionRepository movieVersionRepository;
    private final MovieIngestionService movieIngestionService;
    private final VideoTranscodingService videoTranscodingService;
    private final StorageService storageService;

    public MovieProcessingPipeline(MovieRepository movieRepository,
                                   MovieVersionRepository movieVersionRepository,
                                   MovieIngestionService movieIngestionService,
                                   VideoTranscodingService videoTranscodingService,
                                   StorageService storageService) {
        this.movieRepository = movieRepository;
        this.movieVersionRepository = movieVersionRepository;
        this.movieIngestionService = movieIngestionService;
        this.videoTranscodingService = videoTranscodingService;
        this.storageService = storageService;
    }

    @Value("${raw.storage.temp-path:C:/raw-storage/temp}")
    private String tempStorageRoot;

    /**
     * Asynchronously processes the authorized movie source URL through the complete lifecycle:
     * UPLOADING -> PROCESSING -> TRANSCODING -> GENERATING_HLS -> UPLOADING_TO_STORAGE -> READY
     */
    @Async("movieProcessingExecutor")
    public void processMovieAsync(Long movieId, String sourceUrl) {
        log.info("Starting background processing pipeline for Movie #{} from {}", movieId, sourceUrl);

        File ingestedSourceFile = null;
        File hlsOutputDir = null;

        try {
            // STEP 1: UPLOADING / Initialized
            updateStatus(movieId, MovieProcessingStatus.UPLOADING, null);

            // STEP 2: PROCESSING (SSRF Validation & Ingestion)
            updateStatus(movieId, MovieProcessingStatus.PROCESSING, null);
            ingestedSourceFile = movieIngestionService.ingestSource(movieId, sourceUrl);

            // STEP 3: DURATION CHECK & TRANSCODING
            updateStatus(movieId, MovieProcessingStatus.TRANSCODING, null);
            int durationSeconds = videoTranscodingService.probeAndValidateDuration(ingestedSourceFile);

            // STEP 4: GENERATING HLS (Multi-bitrate: 480p, 720p, 1080p + master.m3u8)
            updateStatus(movieId, MovieProcessingStatus.GENERATING_HLS, null);
            hlsOutputDir = new File(tempStorageRoot, "movie_" + movieId + "_hls");
            VideoTranscodingService.TranscodeResult transcodeResult =
                    videoTranscodingService.transcodeToHls(ingestedSourceFile, hlsOutputDir, durationSeconds);

            // STEP 5: UPLOADING TO STORAGE
            updateStatus(movieId, MovieProcessingStatus.UPLOADING_TO_STORAGE, null);
            String storagePrefix = "movies/" + movieId;
            storageService.uploadDirectory(storagePrefix, transcodeResult.getOutputDirectory());

            // Build master playback URL and storage paths
            String masterStoragePath = storagePrefix + "/master.m3u8";
            String masterPlaybackUrl = storageService.getPlaybackUrl(masterStoragePath);

            // STEP 6: SAVE METADATA & STORAGE REFERENCES IN POSTGRESQL (NO BINARIES IN DB)
            saveSuccessfulMovieVersions(movieId, masterStoragePath, masterPlaybackUrl,
                    transcodeResult, storagePrefix);

            // STEP 7: READY & AVAILABLE TO USERS
            updateFinalReadyStatus(movieId);
            log.info("Movie #{} successfully processed and is now READY for user streaming!", movieId);

        } catch (Exception e) {
            log.error("Movie processing failed for Movie #{}: {}", movieId, e.getMessage(), e);
            markProcessingFailed(movieId, e.getMessage());
        } finally {
            // Clean up temporary local scratch files
            try {
                movieIngestionService.cleanupTemp(movieId);
                if (hlsOutputDir != null && hlsOutputDir.exists()) {
                    org.apache.commons.io.FileUtils.deleteQuietly(hlsOutputDir);
                }
            } catch (Exception ignored) {}
        }
    }

    /**
     * Asynchronously processes a directly uploaded movie file from the admin dashboard.
     */
    @Async("movieProcessingExecutor")
    public void processUploadedMovieFileAsync(Long movieId, File ingestedSourceFile) {
        log.info("Starting background processing pipeline for uploaded Movie #{} ({})",
                movieId, ingestedSourceFile.getAbsolutePath());

        File hlsOutputDir = null;
        try {
            // STEP 3: DURATION CHECK & TRANSCODING
            updateStatus(movieId, MovieProcessingStatus.TRANSCODING, null);
            int durationSeconds = videoTranscodingService.probeAndValidateDuration(ingestedSourceFile);

            // STEP 4: GENERATING HLS (Multi-bitrate: 480p, 720p, 1080p + master.m3u8)
            updateStatus(movieId, MovieProcessingStatus.GENERATING_HLS, null);
            hlsOutputDir = new File(tempStorageRoot, "movie_" + movieId + "_hls");
            VideoTranscodingService.TranscodeResult transcodeResult =
                    videoTranscodingService.transcodeToHls(ingestedSourceFile, hlsOutputDir, durationSeconds);

            // STEP 5: UPLOADING TO STORAGE
            updateStatus(movieId, MovieProcessingStatus.UPLOADING_TO_STORAGE, null);
            String storagePrefix = "movies/" + movieId;
            storageService.uploadDirectory(storagePrefix, transcodeResult.getOutputDirectory());

            // Build master playback URL and storage paths
            String masterStoragePath = storagePrefix + "/master.m3u8";
            String masterPlaybackUrl = storageService.getPlaybackUrl(masterStoragePath);

            // STEP 6: SAVE METADATA & STORAGE REFERENCES IN POSTGRESQL (NO BINARIES IN DB)
            saveSuccessfulMovieVersions(movieId, masterStoragePath, masterPlaybackUrl,
                    transcodeResult, storagePrefix);

            // STEP 7: READY & AVAILABLE TO USERS
            updateFinalReadyStatus(movieId);
            log.info("Uploaded Movie #{} successfully processed and is now READY for user streaming!", movieId);

        } catch (Exception e) {
            log.error("Movie processing failed for uploaded Movie #{}: {}", movieId, e.getMessage(), e);
            markProcessingFailed(movieId, e.getMessage());
        } finally {
            // Clean up temporary local scratch files
            try {
                movieIngestionService.cleanupTemp(movieId);
                if (hlsOutputDir != null && hlsOutputDir.exists()) {
                    org.apache.commons.io.FileUtils.deleteQuietly(hlsOutputDir);
                }
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void updateStatus(Long movieId, MovieProcessingStatus status, String errorMessage) {
        movieRepository.findById(movieId).ifPresent(movie -> {
            movie.setProcessingStatus(status);
            if (errorMessage != null) {
                movie.setProcessingError(errorMessage);
            }
            // Ensure movie is NOT available while processing
            if (status != MovieProcessingStatus.READY) {
                if (movie.getStatus() == MovieStatus.AVAILABLE) {
                    movie.setStatus(MovieStatus.COMING_SOON);
                }
            }
            movieRepository.save(movie);
            log.info("Movie #{} status updated to: {}", movieId, status);
        });
    }

    @Transactional
    public void saveSuccessfulMovieVersions(Long movieId, String masterStoragePath,
                                           String masterPlaybackUrl,
                                           VideoTranscodingService.TranscodeResult result,
                                           String storagePrefix) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalStateException("Movie not found with id: " + movieId));

        movie.setHlsMasterObjectKey(masterStoragePath);
        movie.setHlsMasterUrl(masterPlaybackUrl);
        movie.setSourceStoragePath(masterStoragePath);
        movie.setSourceObjectKey("movies/" + movieId + "/source.mp4");
        // Retain original stream playback URL for direct players if needed
        movie.setMovieUrl(masterPlaybackUrl);
        movie.setDurationSeconds(result.getDurationSeconds());
        movie.setDurationMinutes(result.getDurationMinutes());
        movie.setVideoType("HLS");
        movie.setProcessingError(null);

        // Clean any existing versions and save new ones
        movieVersionRepository.deleteByMovie(movie);

        List<MovieVersion> versions = new ArrayList<>();
        for (VideoTranscodingService.RenditionInfo r : result.getRenditions()) {
            String renditionStoragePath = storagePrefix + "/" + r.getRelativeManifestPath();
            String renditionPlaybackUrl = storageService.getPlaybackUrl(renditionStoragePath);

            MovieVersion version = new MovieVersion();
            version.setMovie(movie);
            version.setQuality(r.getQuality());
            version.setResolution(r.getResolution());
            version.setStoragePath(renditionStoragePath);
            version.setManifestObjectKey(renditionStoragePath);
            version.setManifestUrl(renditionPlaybackUrl);
            versions.add(version);
        }

        movieVersionRepository.saveAll(versions);
        movieRepository.save(movie);
    }

    @Transactional
    public void updateFinalReadyStatus(Long movieId) {
        movieRepository.findById(movieId).ifPresent(movie -> {
            movie.setProcessingStatus(MovieProcessingStatus.READY);
            movie.setStatus(MovieStatus.AVAILABLE);
            movie.setActive(true);
            movieRepository.save(movie);
        });
    }

    @Transactional
    public void markProcessingFailed(Long movieId, String reason) {
        movieRepository.findById(movieId).ifPresent(movie -> {
            movie.setProcessingStatus(MovieProcessingStatus.PROCESSING_FAILED);
            movie.setProcessingError(reason != null && reason.length() > 950 ? reason.substring(0, 950) : reason);
            movie.setStatus(MovieStatus.COMING_SOON);
            movieRepository.save(movie);
        });
    }
}
