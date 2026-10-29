package com.raw.backend.service;

import com.raw.backend.dto.NotificationResponse;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.Notification;
import com.raw.backend.entity.User;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MovieRepository movieRepository;
    private final MovieService movieService;

    @Transactional
    public NotificationResponse requestNotification(User currentUser, Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (notificationRepository.existsByUserAndMovie(currentUser, movie)) {
            throw new IllegalArgumentException("You have already requested notification for this movie!");
        }

        Notification notification = new Notification();
        notification.setUser(currentUser);
        notification.setMovie(movie);
        notification.setStatus("PENDING");

        return mapToResponse(notificationRepository.save(notification));
    }

    public List<NotificationResponse> getUserNotifications(User currentUser) {
        return notificationRepository.findByUserOrderByRequestedAtDesc(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .movie(movieService.mapToResponse(notification.getMovie()))
                .requestedAt(notification.getRequestedAt())
                .status(notification.getStatus())
                .notifiedAt(notification.getNotifiedAt())
                .build();
    }
}
