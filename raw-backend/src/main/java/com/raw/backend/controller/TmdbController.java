package com.raw.backend.controller;

import com.raw.backend.dto.MovieResponse;
import com.raw.backend.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tmdb")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(tmdbService.getStatus());
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody Map<String, String> body) {
        String apiKey = body.get("apiKey");
        String readAccessToken = body.get("readAccessToken");
        tmdbService.updateConfig(apiKey, readAccessToken);
        return ResponseEntity.ok(tmdbService.getStatus());
    }

    @GetMapping("/popular")
    public ResponseEntity<List<Map<String, Object>>> getPopularMovies(
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(tmdbService.getPopularMovies(page));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Map<String, Object>>> getTrendingMovies(
            @RequestParam(defaultValue = "day") String window) {
        return ResponseEntity.ok(tmdbService.getTrendingMovies(window));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchMovies(
            @RequestParam String q) {
        return ResponseEntity.ok(tmdbService.searchMovies(q));
    }

    @GetMapping("/discover")
    public ResponseEntity<List<Map<String, Object>>> discoverByLanguage(
            @RequestParam(defaultValue = "te") String lang) {
        return ResponseEntity.ok(tmdbService.discoverByLanguage(lang));
    }

    @GetMapping("/videos/{tmdbId}")
    public ResponseEntity<Map<String, Object>> getVideos(@PathVariable Long tmdbId) {
        return ResponseEntity.ok(tmdbService.getMovieVideos(tmdbId));
    }

    @PostMapping("/import/{tmdbId}")
    public ResponseEntity<MovieResponse> importMovie(@PathVariable Long tmdbId) {
        return ResponseEntity.ok(tmdbService.importMovie(tmdbId));
    }

    @PostMapping("/sync")
    public ResponseEntity<List<MovieResponse>> syncTrending(
            @RequestParam(defaultValue = "10") int count) {
        return ResponseEntity.ok(tmdbService.syncTrendingMovies(count));
    }
}
