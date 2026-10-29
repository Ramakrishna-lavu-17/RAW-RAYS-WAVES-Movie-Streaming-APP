package com.raw.backend.controller;

import com.raw.backend.dto.WatchlistResponse;
import com.raw.backend.entity.User;
import com.raw.backend.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<WatchlistResponse>> getUserWatchlist(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(watchlistService.getUserWatchlist(currentUser));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<WatchlistResponse> addToWatchlist(@AuthenticationPrincipal User currentUser,
                                                            @PathVariable Long movieId) {
        WatchlistResponse response = watchlistService.addToWatchlist(currentUser, movieId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeFromWatchlist(@AuthenticationPrincipal User currentUser,
                                                     @PathVariable Long movieId) {
        watchlistService.removeFromWatchlist(currentUser, movieId);
        return ResponseEntity.noContent().build();
    }
}
