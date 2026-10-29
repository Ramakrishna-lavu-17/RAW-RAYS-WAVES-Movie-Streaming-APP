package com.raw.backend.service;

import com.raw.backend.dto.GenreResponse;
import com.raw.backend.dto.MovieRequest;
import com.raw.backend.dto.MovieResponse;
import com.raw.backend.entity.ContentAsset;
import com.raw.backend.entity.Genre;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieStatus;
import com.raw.backend.repository.ContentAssetRepository;
import com.raw.backend.repository.GenreRepository;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.NotificationRepository;
import com.raw.backend.repository.WatchHistoryRepository;
import com.raw.backend.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import com.raw.backend.dto.MovieProcessingStatusResponse;
import com.raw.backend.dto.PlayMovieResponse;
import com.raw.backend.entity.MovieProcessingStatus;
import com.raw.backend.entity.MovieVersion;
import com.raw.backend.entity.User;
import com.raw.backend.repository.MovieVersionRepository;
import java.util.stream.Collectors;

@Service
@lombok.extern.slf4j.Slf4j
public class MovieService {

    @org.springframework.beans.factory.annotation.Value("${raw.storage.temp-path:C:/raw-storage/temp}")
    private String tempStorageRoot;

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final AvailabilityService availabilityService;
    private final WatchlistRepository watchlistRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final ContentAssetRepository contentAssetRepository;
    private final MovieVersionRepository movieVersionRepository;
    private final MovieProcessingPipeline movieProcessingPipeline;
    private final StorageService storageService;
    private final StorageTokenService storageTokenService;

    public MovieService(MovieRepository movieRepository,
                        GenreRepository genreRepository,
                        AvailabilityService availabilityService,
                        WatchlistRepository watchlistRepository,
                        WatchHistoryRepository watchHistoryRepository,
                        NotificationRepository notificationRepository,
                        ContentAssetRepository contentAssetRepository,
                        MovieVersionRepository movieVersionRepository,
                        MovieProcessingPipeline movieProcessingPipeline,
                        StorageService storageService,
                        StorageTokenService storageTokenService) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
        this.availabilityService = availabilityService;
        this.watchlistRepository = watchlistRepository;
        this.watchHistoryRepository = watchHistoryRepository;
        this.notificationRepository = notificationRepository;
        this.contentAssetRepository = contentAssetRepository;
        this.movieVersionRepository = movieVersionRepository;
        this.movieProcessingPipeline = movieProcessingPipeline;
        this.storageService = storageService;
        this.storageTokenService = storageTokenService;
    }

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll().stream()
                .filter(m -> m.getActive() == null || m.getActive())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        return mapToResponse(movie);
    }

    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = new Movie();
        copyFields(request, movie);
        movie.setActive(true);

        boolean hasSourceUrl = request.getMovieSourceUrl() != null && !request.getMovieSourceUrl().trim().isEmpty();
        if (hasSourceUrl) {
            movie.setMovieSourceUrl(request.getMovieSourceUrl().trim());
            movie.setProcessingStatus(MovieProcessingStatus.UPLOADING);
            movie.setStatus(MovieStatus.COMING_SOON); // Only ready after processing
        } else {
            movie.setProcessingStatus(MovieProcessingStatus.READY);
        }

        Movie saved = movieRepository.save(movie);

        // Trigger async ingestion, transcoding, and HLS storage pipeline
        if (hasSourceUrl) {
            movieProcessingPipeline.processMovieAsync(saved.getId(), saved.getMovieSourceUrl());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        copyFields(request, movie);

        // Sync or clean up ContentAsset
        Optional<ContentAsset> assetOpt = contentAssetRepository.findByMovieAndAssetTypeAndActiveTrue(movie, "VIDEO");
        if (movie.getMovieUrl() != null && !movie.getMovieUrl().isBlank()) {
            ContentAsset asset = assetOpt.orElseGet(() -> {
                ContentAsset a = new ContentAsset();
                a.setMovie(movie);
                a.setAssetType("VIDEO");
                a.setActive(true);
                return a;
            });
            asset.setStorageReference(movie.getMovieUrl());
            asset.setContentType(movie.getMovieUrl().contains("youtube") ? "video/youtube" : "video/mp4");
            contentAssetRepository.save(asset);
        } else {
            // movieUrl removed: clean up any legacy video asset
            assetOpt.ifPresent(contentAssetRepository::delete);
        }

        return mapToResponse(movieRepository.save(movie));
    }

    @Transactional
    public MovieResponse updateMovieStatus(Long id, MovieStatus status) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        movie.setStatus(status);
        return mapToResponse(movieRepository.save(movie));
    }

    @Transactional
    public MovieResponse deactivateMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        movie.setActive(false);
        movie.setStatus(MovieStatus.INACTIVE);
        return mapToResponse(movieRepository.save(movie));
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));

        // 1. Delete associated storage objects and disk files from Local Object Storage
        try {
            storageService.deletePrefix(storageService.getBucketName(), "movies/" + id + "/");
        } catch (Exception ignored) {}

        // 2. Delete database relations
        movieVersionRepository.deleteByMovie(movie);
        watchlistRepository.deleteByMovie(movie);
        watchHistoryRepository.deleteByMovie(movie);
        notificationRepository.deleteByMovie(movie);
        contentAssetRepository.deleteByMovie(movie);
        if (movie.getGenres() != null) {
            movie.getGenres().clear();
        }
        movieRepository.delete(movie);
    }

    public List<MovieResponse> searchMovies(String query) {
        return movieRepository.findByTitleContainingIgnoreCaseAndActiveTrue(query).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MovieResponse> getMoviesByLanguage(String language) {
        return movieRepository.findByLanguageIgnoreCaseAndActiveTrue(language).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MovieResponse> getMoviesByGenre(String genreName) {
        return movieRepository.findByGenreName(genreName).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MovieResponse> getAvailableMovies() {
        return movieRepository.findAvailableMovies(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MovieResponse> getComingSoonMovies() {
        return movieRepository.findComingSoonMovies(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MovieResponse updateTrailer(Long id, String trailerUrl) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        movie.setTrailerUrl(trailerUrl);
        return mapToResponse(movieRepository.save(movie));
    }

    @Transactional
    public MovieResponse updateMovieUrl(Long id, String movieUrl) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        String cleanUrl = (movieUrl != null && !movieUrl.trim().isEmpty()) ? movieUrl.trim() : null;
        movie.setMovieUrl(cleanUrl);

        Optional<ContentAsset> assetOpt = contentAssetRepository.findByMovieAndAssetTypeAndActiveTrue(movie, "VIDEO");
        if (cleanUrl != null) {
            ContentAsset asset = assetOpt.orElseGet(() -> {
                ContentAsset a = new ContentAsset();
                a.setMovie(movie);
                a.setAssetType("VIDEO");
                a.setActive(true);
                return a;
            });
            asset.setStorageReference(cleanUrl);
            asset.setContentType(cleanUrl.contains("youtube") ? "video/youtube" : "video/mp4");
            contentAssetRepository.save(asset);
        } else {
            assetOpt.ifPresent(contentAssetRepository::delete);
        }

        return mapToResponse(movieRepository.save(movie));
    }

    private void copyFields(MovieRequest request, Movie movie) {
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setLanguage(request.getLanguage());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setBackdropUrl(request.getBackdropUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        if (request.getMovieUrl() != null && !request.getMovieUrl().trim().isEmpty()) {
            movie.setMovieUrl(request.getMovieUrl().trim());
        } else {
            movie.setMovieUrl(null);
        }
        if (request.getMovieSourceUrl() != null && !request.getMovieSourceUrl().trim().isEmpty()) {
            movie.setMovieSourceUrl(request.getMovieSourceUrl().trim());
        }
        movie.setAgeRating(request.getAgeRating());
        movie.setTheatricalReleaseDate(request.getTheatricalReleaseDate());
        movie.setOfficialOttReleaseDate(request.getOfficialOttReleaseDate());
        movie.setRawAvailableDate(request.getRawAvailableDate());
        movie.setStatus(request.getStatus());
        movie.setTmdbId(request.getTmdbId());
        movie.setVideoType(request.getVideoType());

        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            Set<Genre> genres = new HashSet<>(genreRepository.findAllById(request.getGenreIds()));
            movie.setGenres(genres);
        }
    }

    public MovieResponse mapToResponse(Movie movie) {
        boolean available = availabilityService.isMovieAvailableToWatch(movie);

        Set<GenreResponse> genreResponses = movie.getGenres() != null
                ? movie.getGenres().stream()
                .map(g -> GenreResponse.builder().id(g.getId()).name(g.getName()).description(g.getDescription()).build())
                .collect(Collectors.toSet())
                : Set.of();

        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .language(movie.getLanguage())
                .releaseYear(movie.getReleaseYear())
                .durationMinutes(movie.getDurationMinutes())
                .durationSeconds(movie.getDurationSeconds())
                .posterUrl(movie.getPosterUrl())
                .backdropUrl(movie.getBackdropUrl())
                .trailerUrl(movie.getTrailerUrl())
                .movieUrl(movie.getMovieUrl())
                .movieSourceUrl(movie.getMovieSourceUrl())
                .sourceStoragePath(movie.getSourceStoragePath())
                .sourceObjectKey(movie.getSourceObjectKey())
                .hlsMasterUrl(movie.getHlsMasterUrl())
                .hlsMasterObjectKey(movie.getHlsMasterObjectKey())
                .processingStatus(movie.getProcessingStatus())
                .processingError(movie.getProcessingError())
                .ageRating(movie.getAgeRating())
                .theatricalReleaseDate(movie.getTheatricalReleaseDate())
                .officialOttReleaseDate(movie.getOfficialOttReleaseDate())
                .rawAvailableDate(movie.getRawAvailableDate())
                .status(movie.getStatus())
                .isAvailableToWatch(available)
                .active(movie.getActive())
                .tmdbId(movie.getTmdbId())
                .videoType(movie.getVideoType())
                .createdAt(movie.getCreatedAt())
                .updatedAt(movie.getUpdatedAt())
                .genres(genreResponses)
                .build();
    }

    public MovieProcessingStatusResponse getProcessingStatus(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        return MovieProcessingStatusResponse.builder()
                .movieId(movie.getId())
                .title(movie.getTitle())
                .processingStatus(movie.getProcessingStatus() != null ? movie.getProcessingStatus() : MovieProcessingStatus.READY)
                .processingError(movie.getProcessingError())
                .sourceStoragePath(movie.getSourceStoragePath())
                .sourceObjectKey(movie.getSourceObjectKey())
                .hlsMasterUrl(movie.getHlsMasterUrl())
                .hlsMasterObjectKey(movie.getHlsMasterObjectKey())
                .durationMinutes(movie.getDurationMinutes())
                .durationSeconds(movie.getDurationSeconds())
                .build();
    }

    @Transactional
    public MovieProcessingStatusResponse reprocessMovie(Long movieId, String sourceUrl) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        String urlToUse = (sourceUrl != null && !sourceUrl.isBlank()) ? sourceUrl.trim() : movie.getMovieSourceUrl();
        if (urlToUse == null || urlToUse.isBlank()) {
            throw new IllegalArgumentException("No authorized movie source URL available to process.");
        }

        movie.setMovieSourceUrl(urlToUse);
        movie.setProcessingStatus(MovieProcessingStatus.UPLOADING);
        movie.setProcessingError(null);
        movie.setStatus(MovieStatus.COMING_SOON);
        movieRepository.save(movie);

        movieProcessingPipeline.processMovieAsync(movie.getId(), urlToUse);

        return getProcessingStatus(movieId);
    }

    @Transactional
    public MovieProcessingStatusResponse uploadAndProcessMovieSource(Long movieId, org.springframework.web.multipart.MultipartFile file) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "movie.mp4";
        }

        java.io.File tempDir = new java.io.File(tempStorageRoot, "movie_" + movieId);
        if (!tempDir.exists()) {
            tempDir.mkdirs();
        }

        java.io.File targetFile = new java.io.File(tempDir, "source.mp4");
        if (targetFile.exists()) {
            org.apache.commons.io.FileUtils.deleteQuietly(targetFile);
        }

        try {
            file.transferTo(targetFile);
            log.info("Uploaded video file saved for Movie #{} to {} (Size: {} MB)",
                    movieId, targetFile.getAbsolutePath(), targetFile.length() / (1024 * 1024));
        } catch (Exception e) {
            log.error("Failed to save uploaded movie file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save uploaded movie file: " + e.getMessage(), e);
        }

        movie.setMovieSourceUrl("uploaded://" + filename);
        movie.setProcessingStatus(MovieProcessingStatus.TRANSCODING);
        movie.setProcessingError(null);
        movie.setStatus(MovieStatus.COMING_SOON);
        movieRepository.save(movie);

        // Asynchronously transcode and store in Local Object Storage
        movieProcessingPipeline.processUploadedMovieFileAsync(movieId, targetFile);

        return getProcessingStatus(movieId);
    }

    public PlayMovieResponse getPlayManifestForUser(Long movieId, User currentUser) {
        return getPlayManifestForUser(movieId, currentUser, null, null);
    }

    public PlayMovieResponse getPlayManifestForUser(Long movieId, User currentUser, String requestedQuality, String headerQuality) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        String subStatus = currentUser != null ? currentUser.getSubscriptionStatus() : "ACTIVE";
        String userQuality = "720P";
        if (currentUser != null && currentUser.getSubscriptionQuality() != null && !currentUser.getSubscriptionQuality().isBlank()) {
            userQuality = currentUser.getSubscriptionQuality();
        }
        if (headerQuality != null && !headerQuality.isBlank()) {
            int headerRes = SubscriptionPlanService.parseQuality(headerQuality);
            int dbRes = SubscriptionPlanService.parseQuality(userQuality);
            if (headerRes > dbRes) {
                userQuality = headerQuality;
            }
        }

        if ("INACTIVE".equalsIgnoreCase(subStatus) || "NONE".equalsIgnoreCase(userQuality)) {
            throw new SecurityException("An active subscription plan is required to watch movies on RAW.");
        }

        // Movie must be READY before streaming
        if (movie.getProcessingStatus() != null && movie.getProcessingStatus() != MovieProcessingStatus.READY) {
            throw new IllegalStateException("Movie is currently being processed. Current status: " + movie.getProcessingStatus());
        }

        // Determine maximum allowed quality according to active subscription plan:
        // BASIC -> max 480p, STANDARD -> max 720p, PREMIUM -> max 1080p
        String maxQuality;
        if (userQuality.toUpperCase().contains("1080")) {
            maxQuality = "1080p";
        } else if (userQuality.toUpperCase().contains("480")) {
            maxQuality = "480p";
        } else {
            maxQuality = "720p";
        }

        String chosenQuality = maxQuality;
        if (requestedQuality != null && !requestedQuality.isBlank()) {
            String cleanReq = requestedQuality.toLowerCase().trim();
            int reqRes = SubscriptionPlanService.parseQuality(cleanReq);
            int allowedRes = SubscriptionPlanService.parseQuality(maxQuality);
            if (reqRes > allowedRes) {
                throw new SecurityException("Requested quality (" + requestedQuality + ") requires an upgraded subscription plan.");
            }
            chosenQuality = cleanReq.contains("1080") ? "1080p" : cleanReq.contains("480") ? "480p" : "720p";
        }

        final String effectiveQuality = chosenQuality;

        // Look for corresponding MovieVersion or master
        List<MovieVersion> versions = movieVersionRepository.findByMovie(movie);
        String targetObjectKey = null;

        if (!versions.isEmpty()) {
            if ("1080p".equalsIgnoreCase(effectiveQuality) && movie.getHlsMasterObjectKey() != null) {
                targetObjectKey = movie.getHlsMasterObjectKey();
            } else {
                Optional<MovieVersion> targetVersion = versions.stream()
                        .filter(v -> v.getQuality().equalsIgnoreCase(effectiveQuality))
                        .findFirst();

                if (targetVersion.isPresent()) {
                    targetObjectKey = targetVersion.get().getManifestObjectKey();
                    if (targetObjectKey == null || targetObjectKey.isBlank()) {
                        targetObjectKey = targetVersion.get().getStoragePath();
                    }
                } else if ("720p".equalsIgnoreCase(effectiveQuality)) {
                    targetObjectKey = versions.stream()
                            .filter(v -> "720p".equalsIgnoreCase(v.getQuality()) || "480p".equalsIgnoreCase(v.getQuality()))
                            .findFirst()
                            .map(v -> v.getManifestObjectKey() != null ? v.getManifestObjectKey() : v.getStoragePath())
                            .orElse(versions.get(0).getStoragePath());
                } else {
                    targetObjectKey = versions.stream()
                            .filter(v -> "480p".equalsIgnoreCase(v.getQuality()))
                            .findFirst()
                            .map(v -> v.getManifestObjectKey() != null ? v.getManifestObjectKey() : v.getStoragePath())
                            .orElse(versions.get(0).getStoragePath());
                }
            }
        } else if (movie.getHlsMasterObjectKey() != null) {
            targetObjectKey = movie.getHlsMasterObjectKey();
        }

        String manifestUrl = null;
        if (targetObjectKey != null) {
            manifestUrl = storageService.getSignedPlaybackUrl(
                    storageService.getBucketName(),
                    targetObjectKey,
                    currentUser != null ? currentUser.getId() : 1L,
                    movie.getId(),
                    chosenQuality,
                    86400 // 24 hours
            );
        } else if (movie.getMovieUrl() != null && !movie.getMovieUrl().isBlank()) {
            manifestUrl = movie.getMovieUrl();
        } else {
            throw new IllegalStateException("Movie playback is not available yet. Please check back soon.");
        }

        // Available tiers summary for UI
        List<PlayMovieResponse.MovieVersionDto> tierDtos = List.of(
                PlayMovieResponse.MovieVersionDto.builder().quality("480p").resolution("854x480").accessible(true).build(),
                PlayMovieResponse.MovieVersionDto.builder().quality("720p").resolution("1280x720")
                        .accessible(!"480p".equalsIgnoreCase(maxQuality)).build(),
                PlayMovieResponse.MovieVersionDto.builder().quality("1080p").resolution("1920x1080")
                        .accessible("1080p".equalsIgnoreCase(maxQuality)).build()
        );

        Long lastPosition = (currentUser != null)
                ? watchHistoryRepository.findByUserAndMovie(currentUser, movie)
                        .map(com.raw.backend.entity.WatchHistory::getLastPositionSeconds)
                        .orElse(0L)
                : 0L;

        return PlayMovieResponse.builder()
                .movieId(movie.getId())
                .title(movie.getTitle())
                .authorizedQuality(chosenQuality)
                .userSubscriptionQuality(userQuality)
                .hlsManifestUrl(manifestUrl)
                .videoType(movie.getVideoType() != null ? movie.getVideoType() : "HLS")
                .durationMinutes(movie.getDurationMinutes())
                .durationSeconds(movie.getDurationSeconds())
                .startPositionSeconds(lastPosition)
                .authorized(true)
                .message("Authorized for " + chosenQuality + " streaming.")
                .availableTiers(tierDtos)
                .build();
    }
}
