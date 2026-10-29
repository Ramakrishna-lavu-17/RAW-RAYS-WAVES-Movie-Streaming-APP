package com.raw.backend.controller;

import com.raw.backend.dto.NotificationResponse;
import com.raw.backend.entity.User;
import com.raw.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/movies/{movieId}")
    public ResponseEntity<NotificationResponse> requestNotification(@AuthenticationPrincipal User currentUser,
                                                                    @PathVariable Long movieId) {
        NotificationResponse response = notificationService.requestNotification(currentUser, movieId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser));
    }
}
