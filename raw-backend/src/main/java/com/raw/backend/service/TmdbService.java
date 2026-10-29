package com.raw.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raw.backend.config.TmdbConfig;
import com.raw.backend.dto.MovieResponse;
import com.raw.backend.entity.ContentAsset;
import com.raw.backend.entity.Genre;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieStatus;
import com.raw.backend.repository.ContentAssetRepository;
import com.raw.backend.repository.GenreRepository;
import com.raw.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TmdbService {

    private final TmdbConfig tmdbConfig;
    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final ContentAssetRepository contentAssetRepository;
    private final MovieService movieService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getStatus() {
        boolean configured = tmdbConfig.isConfigured();
        boolean connected = false;
        String message = "TMDB credentials not configured yet.";

        if (configured) {
            try {
                // Test ping to TMDB
                String url = buildUrl("/movie/popular", Map.of("page", "1"));
                HttpHeaders headers = buildHeaders();
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    connected = true;
                    message = "Successfully connected to The Movie Database (TMDB) API!";
                }
            } catch (Exception e) {
                message = "Failed to connect to TMDB: " + e.getMessage();
                log.warn("TMDB connection test failed: {}", e.getMessage());
            }
        }

        Map<String, Object> status = new HashMap<>();
        status.put("configured", configured);
        status.put("connected", connected);
        status.put("hasApiKey", tmdbConfig.getApiKey() != null && !tmdbConfig.getApiKey().isBlank());
        status.put("hasReadAccessToken", tmdbConfig.getReadAccessToken() != null && !tmdbConfig.getReadAccessToken().isBlank());
        status.put("message", message);
        return status;
    }

    public void updateConfig(String apiKey, String readAccessToken) {
        tmdbConfig.updateCredentials(apiKey, readAccessToken);
    }

    public List<Map<String, Object>> getPopularMovies(int page) {
        String url = buildUrl("/movie/popular", Map.of("page", String.valueOf(page)));
        return fetchMovieList(url);
    }

    public List<Map<String, Object>> getTrendingMovies(String timeWindow) {
        String window = (timeWindow != null && timeWindow.equalsIgnoreCase("week")) ? "week" : "day";
        String url = buildUrl("/trending/movie/" + window, Collections.emptyMap());
        return fetchMovieList(url);
    }

    public List<Map<String, Object>> searchMovies(String query) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }
        String url = buildUrl("/search/movie", Map.of("query", query, "include_adult", "false"));
        return fetchMovieList(url);
    }

    public List<Map<String, Object>> discoverByLanguage(String langCode) {
        String url = buildUrl("/discover/movie", Map.of(
                "with_original_language", langCode != null ? langCode : "te",
                "sort_by", "popularity.desc"
        ));
        return fetchMovieList(url);
    }

    private List<Map<String, Object>> fetchMovieList(String url) {
        List<Map<String, Object>> results = new ArrayList<>();
        try {
            HttpEntity<String> entity = new HttpEntity<>(buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode resultsNode = root.path("results");
                if (resultsNode.isArray()) {
                    for (JsonNode node : resultsNode) {
                        results.add(parseMovieSummary(node));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching movies from TMDB URL {}: {}", url, e.getMessage());
        }
        return results;
    }

    private Map<String, Object> parseMovieSummary(JsonNode node) {
        Map<String, Object> movie = new HashMap<>();
        long tmdbId = node.path("id").asLong();
        movie.put("tmdbId", tmdbId);
        movie.put("title", node.path("title").asText(""));
        movie.put("overview", node.path("overview").asText(""));
        String posterPath = node.path("poster_path").asText(null);
        String backdropPath = node.path("backdrop_path").asText(null);
        movie.put("posterUrl", posterPath != null ? "https://image.tmdb.org/t/p/w500" + posterPath : null);
        movie.put("backdropUrl", backdropPath != null ? "https://image.tmdb.org/t/p/original" + backdropPath : null);
        movie.put("releaseDate", node.path("release_date").asText(""));
        movie.put("voteAverage", node.path("vote_average").asDouble(0.0));
        movie.put("language", mapLanguageCode(node.path("original_language").asText("en")));
        movie.put("alreadyImported", movieRepository.existsByTmdbId(tmdbId));
        return movie;
    }

    public Map<String, Object> getMovieVideos(Long tmdbId) {
        String url = buildUrl("/movie/" + tmdbId + "/videos", Collections.emptyMap());
        Map<String, Object> bestVideo = new HashMap<>();
        try {
            HttpEntity<String> entity = new HttpEntity<>(buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode results = root.path("results");
                if (results.isArray()) {
                    JsonNode chosen = null;
                    // Prefer official YouTube Trailer
                    for (JsonNode v : results) {
                        String site = v.path("site").asText("");
                        String type = v.path("type").asText("");
                        if ("YouTube".equalsIgnoreCase(site)) {
                            if ("Trailer".equalsIgnoreCase(type)) {
                                chosen = v;
                                if (v.path("official").asBoolean(false)) {
                                    break;
                                }
                            } else if (chosen == null && "Teaser".equalsIgnoreCase(type)) {
                                chosen = v;
                            }
                        }
                    }
                    if (chosen == null && results.size() > 0) {
                        chosen = results.get(0);
                    }

                    if (chosen != null) {
                        String key = chosen.path("key").asText("").trim();
                        bestVideo.put("key", key);
                        bestVideo.put("site", chosen.path("site").asText("YouTube"));
                        bestVideo.put("type", chosen.path("type").asText("Trailer"));
                        bestVideo.put("name", chosen.path("name").asText(""));
                        bestVideo.put("videoUrl", "https://www.youtube.com/watch?v=" + key);
                        bestVideo.put("embedUrl", "https://www.youtube.com/embed/" + key);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch videos for TMDB ID {}: {}", tmdbId, e.getMessage());
        }
        return bestVideo;
    }

    @Transactional
    public MovieResponse importMovie(Long tmdbId) {
        // Check if movie with tmdbId already exists in database
        Optional<Movie> existingOpt = movieRepository.findByTmdbId(tmdbId);
        if (existingOpt.isPresent()) {
            return movieService.mapToResponse(existingOpt.get());
        }

        // Fetch details from TMDB
        String detailsUrl = buildUrl("/movie/" + tmdbId, Collections.emptyMap());
        try {
            HttpEntity<String> entity = new HttpEntity<>(buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(detailsUrl, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Failed to fetch movie details from TMDB ID: " + tmdbId);
            }

            JsonNode root = objectMapper.readTree(response.getBody());

            Movie movie = new Movie();
            movie.setTmdbId(tmdbId);
            movie.setTitle(root.path("title").asText("Untitled Movie"));
            movie.setDescription(root.path("overview").asText(""));
            movie.setLanguage(mapLanguageCode(root.path("original_language").asText("en")));

            String releaseDateStr = root.path("release_date").asText("");
            LocalDate releaseDate = LocalDate.now();
            int releaseYear = LocalDate.now().getYear();
            if (!releaseDateStr.isBlank()) {
                try {
                    releaseDate = LocalDate.parse(releaseDateStr);
                    releaseYear = releaseDate.getYear();
                } catch (Exception ignored) {}
            }
            movie.setReleaseYear(releaseYear);
            movie.setTheatricalReleaseDate(releaseDate);
            movie.setOfficialOttReleaseDate(releaseDate.plusDays(45));
            movie.setRawAvailableDate(LocalDate.now()); // Available immediately on RAW OTT
            movie.setStatus(MovieStatus.AVAILABLE);
            movie.setActive(true);
            movie.setAgeRating("U/A");

            int runtime = root.path("runtime").asInt(0);
            movie.setDurationMinutes(runtime > 0 ? runtime : 148);

            String posterPath = root.path("poster_path").asText(null);
            if (posterPath != null) {
                movie.setPosterUrl("https://image.tmdb.org/t/p/w500" + posterPath);
            } else {
                movie.setPosterUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80");
            }

            String backdropPath = root.path("backdrop_path").asText(null);
            if (backdropPath != null) {
                movie.setBackdropUrl("https://image.tmdb.org/t/p/original" + backdropPath);
            } else {
                movie.setBackdropUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80");
            }

            // Fetch video/trailer
            Map<String, Object> videoInfo = getMovieVideos(tmdbId);
            String trailerUrl = null;
            if (videoInfo.containsKey("key") && videoInfo.get("key") != null) {
                String key = (String) videoInfo.get("key");
                trailerUrl = "https://www.youtube.com/watch?v=" + key;
                movie.setTrailerUrl(trailerUrl);
                movie.setVideoType("YOUTUBE");
            } else {
                // High quality fallback cinema stream
                trailerUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
                movie.setTrailerUrl(trailerUrl);
                movie.setVideoType("DIRECT");
            }

            // Map and attach genres
            Set<Genre> genres = new HashSet<>();
            JsonNode genresNode = root.path("genres");
            if (genresNode.isArray()) {
                for (JsonNode gNode : genresNode) {
                    String genreName = gNode.path("name").asText("General");
                    Genre genre = genreRepository.findByNameIgnoreCase(genreName)
                            .orElseGet(() -> {
                                Genre newG = new Genre();
                                newG.setName(genreName);
                                newG.setDescription(genreName + " cinema & entertainment");
                                return genreRepository.save(newG);
                            });
                    genres.add(genre);
                }
            }
            if (genres.isEmpty()) {
                Genre defaultGenre = genreRepository.findByNameIgnoreCase("Action")
                        .orElseGet(() -> {
                            Genre g = new Genre();
                            g.setName("Action");
                            g.setDescription("Action films");
                            return genreRepository.save(g);
                        });
                genres.add(defaultGenre);
            }
            movie.setGenres(genres);

            Movie savedMovie = movieRepository.save(movie);

            // Register playable ContentAssets
            ContentAsset videoAsset = new ContentAsset();
            videoAsset.setMovie(savedMovie);
            videoAsset.setAssetType("VIDEO");
            videoAsset.setStorageReference(trailerUrl);
            videoAsset.setContentType(movie.getVideoType().equalsIgnoreCase("YOUTUBE") ? "video/youtube" : "video/mp4");
            videoAsset.setActive(true);
            contentAssetRepository.save(videoAsset);

            return movieService.mapToResponse(savedMovie);

        } catch (Exception e) {
            log.error("Failed to import TMDB movie {}: {}", tmdbId, e.getMessage(), e);
            throw new RuntimeException("Could not import TMDB movie: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<MovieResponse> syncTrendingMovies(int count) {
        List<MovieResponse> imported = new ArrayList<>();
        List<Map<String, Object>> trending = getTrendingMovies("day");
        int target = Math.min(count <= 0 ? 10 : count, trending.size());

        for (int i = 0; i < target; i++) {
            Map<String, Object> summary = trending.get(i);
            Long tmdbId = (Long) summary.get("tmdbId");
            try {
                imported.add(importMovie(tmdbId));
            } catch (Exception e) {
                log.warn("Failed to sync movie tmdbId {}: {}", tmdbId, e.getMessage());
            }
        }
        return imported;
    }

    private String buildUrl(String path, Map<String, String> queryParams) {
        StringBuilder sb = new StringBuilder(tmdbConfig.getBaseUrl()).append(path);
        boolean hasQuery = path.contains("?");

        if (tmdbConfig.getApiKey() != null && !tmdbConfig.getApiKey().isBlank()) {
            sb.append(hasQuery ? "&" : "?").append("api_key=").append(tmdbConfig.getApiKey().trim());
            hasQuery = true;
        }

        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            sb.append(hasQuery ? "&" : "?").append(entry.getKey()).append("=").append(entry.getValue());
            hasQuery = true;
        }

        return sb.toString();
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");
        headers.set("User-Agent", "RAW-OTT-Platform/1.0");

        if (tmdbConfig.getReadAccessToken() != null && !tmdbConfig.getReadAccessToken().isBlank()) {
            String token = tmdbConfig.getReadAccessToken().trim();
            if (!token.startsWith("Bearer ")) {
                token = "Bearer " + token;
            }
            headers.set("Authorization", token);
        }
        return headers;
    }

    private String mapLanguageCode(String code) {
        if (code == null) return "Telugu";
        return switch (code.toLowerCase()) {
            case "te" -> "Telugu";
            case "ta" -> "Tamil";
            case "hi" -> "Hindi";
            case "en" -> "English";
            case "ml" -> "Malayalam";
            case "kn" -> "Kannada";
            case "es" -> "Spanish";
            case "fr" -> "French";
            case "ja" -> "Japanese";
            case "ko" -> "Korean";
            default -> code.substring(0, 1).toUpperCase() + code.substring(1);
        };
    }
}
