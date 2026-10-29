package com.raw.backend.repository;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.Notification;
import com.raw.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByRequestedAtDesc(User user);

    Optional<Notification> findByUserAndMovie(User user, Movie movie);

    boolean existsByUserAndMovie(User user, Movie movie);

    List<Notification> findByMovieAndStatus(Movie movie, String status);

    void deleteByMovie(Movie movie);
}
