package com.raw.backend.controller;

import com.raw.backend.dto.PlaybackProgressRequest;
import com.raw.backend.dto.WatchHistoryResponse;
import com.raw.backend.entity.User;
import com.raw.backend.service.WatchHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WatchHistoryController {

    private final WatchHistoryService watchHistoryService;

    @GetMapping("/history")
    public ResponseEntity<List<WatchHistoryResponse>> getUserWatchHistory(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(watchHistoryService.getUserWatchHistory(currentUser));
    }

    @GetMapping("/history/continue-watching")
    public ResponseEntity<List<WatchHistoryResponse>> getContinueWatching(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(watchHistoryService.getContinueWatching(currentUser));
    }

    @PostMapping("/playback/{movieId}/start")
    public ResponseEntity<Map<String, Object>> startPlayback(@AuthenticationPrincipal User currentUser,
                                                             @PathVariable Long movieId) {
        return ResponseEntity.ok(watchHistoryService.startPlayback(currentUser, movieId));
    }

    @RequestMapping(value = "/playback/{movieId}/stream", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> authorizeStream(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long movieId,
            @RequestParam(value = "quality", defaultValue = "720P") String quality,
            @RequestHeader(value = "X-User-Quality", required = false) String headerQuality) {
        return watchHistoryService.authorizeQualityStream(currentUser, movieId, quality, headerQuality);
    }

    @PostMapping("/playback/{movieId}/progress")
    public ResponseEntity<WatchHistoryResponse> updatePlaybackProgress(@AuthenticationPrincipal User currentUser,
                                                                        @PathVariable Long movieId,
                                                                        @Valid @RequestBody PlaybackProgressRequest request) {
        return ResponseEntity.ok(watchHistoryService.updatePlaybackProgress(currentUser, movieId, request));
    }
}
