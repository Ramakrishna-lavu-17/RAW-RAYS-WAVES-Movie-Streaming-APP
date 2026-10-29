package com.raw.backend.controller;

import com.raw.backend.dto.MovieRequest;
import com.raw.backend.dto.MovieResponse;
import com.raw.backend.dto.MovieStatusUpdateRequest;
import com.raw.backend.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    // --- PUBLIC USER ENDPOINTS ---

    @GetMapping("/movies")
    public ResponseEntity<List<MovieResponse>> getAllMovies() {
        return ResponseEntity.ok(movieService.getAllMovies());
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @GetMapping("/movies/search")
    public ResponseEntity<List<MovieResponse>> searchMovies(@RequestParam String q) {
        return ResponseEntity.ok(movieService.searchMovies(q));
    }

    @GetMapping("/movies/language/{language}")
    public ResponseEntity<List<MovieResponse>> getMoviesByLanguage(@PathVariable String language) {
        return ResponseEntity.ok(movieService.getMoviesByLanguage(language));
    }

    @GetMapping("/movies/genre/{genreName}")
    public ResponseEntity<List<MovieResponse>> getMoviesByGenre(@PathVariable String genreName) {
        return ResponseEntity.ok(movieService.getMoviesByGenre(genreName));
    }

    @GetMapping("/movies/coming-soon")
    public ResponseEntity<List<MovieResponse>> getComingSoonMovies() {
        return ResponseEntity.ok(movieService.getComingSoonMovies());
    }

    @GetMapping("/movies/available")
    public ResponseEntity<List<MovieResponse>> getAvailableMovies() {
        return ResponseEntity.ok(movieService.getAvailableMovies());
    }

    // --- ADMIN MANAGEMENT ENDPOINTS ---

    @PostMapping("/admin/movies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        MovieResponse response = movieService.createMovie(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/admin/movies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> updateMovie(@PathVariable Long id, @Valid @RequestBody MovieRequest request) {
        return ResponseEntity.ok(movieService.updateMovie(id, request));
    }

    @PatchMapping("/admin/movies/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> updateMovieStatus(@PathVariable Long id,
                                                           @Valid @RequestBody MovieStatusUpdateRequest request) {
        return ResponseEntity.ok(movieService.updateMovieStatus(id, request.getStatus()));
    }

    @PutMapping("/admin/movies/{id}/trailer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> updateTrailer(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String trailerUrl = payload.get("trailerUrl");
        return ResponseEntity.ok(movieService.updateTrailer(id, trailerUrl));
    }

    @PutMapping("/admin/movies/{id}/movie-url")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> updateMovieUrl(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String movieUrl = payload.get("movieUrl");
        return ResponseEntity.ok(movieService.updateMovieUrl(id, movieUrl));
    }

    @GetMapping("/admin/movies/{id}/processing-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.raw.backend.dto.MovieProcessingStatusResponse> getMovieProcessingStatus(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getProcessingStatus(id));
    }

    @PostMapping("/admin/movies/{id}/reprocess")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.raw.backend.dto.MovieProcessingStatusResponse> reprocessMovie(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        String sourceUrl = payload != null ? payload.get("movieSourceUrl") : null;
        return ResponseEntity.ok(movieService.reprocessMovie(id, sourceUrl));
    }

    @PostMapping(value = "/admin/movies/{id}/upload-source", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.raw.backend.dto.MovieProcessingStatusResponse> uploadMovieSource(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(movieService.uploadAndProcessMovieSource(id, file));
    }

    // --- SUBSCRIPTION-GATED MOVIE PLAYBACK ---

    @GetMapping("/movies/{id}/play")
    public ResponseEntity<com.raw.backend.dto.PlayMovieResponse> playMovie(
            @PathVariable Long id,
            @RequestParam(value = "quality", required = false) String quality,
            @RequestHeader(value = "X-User-Quality", required = false) String headerQuality,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.raw.backend.entity.User currentUser) {
        return ResponseEntity.ok(movieService.getPlayManifestForUser(id, currentUser, quality, headerQuality));
    }

    @DeleteMapping("/admin/movies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAdminMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/movies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMoviePublic(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}
