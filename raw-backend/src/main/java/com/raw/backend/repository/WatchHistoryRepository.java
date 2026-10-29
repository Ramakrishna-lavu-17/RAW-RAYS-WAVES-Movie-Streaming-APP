package com.raw.backend.repository;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.User;
import com.raw.backend.entity.WatchHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {

    List<WatchHistory> findByUserOrderByLastWatchedAtDesc(User user);

    Optional<WatchHistory> findByUserAndMovie(User user, Movie movie);

    @Query("SELECT wh FROM WatchHistory wh WHERE wh.user = :user AND wh.completed = false ORDER BY wh.lastWatchedAt DESC")
    List<WatchHistory> findContinueWatching(User user);

    @Query("SELECT wh.movie, COUNT(wh) as watchCount FROM WatchHistory wh GROUP BY wh.movie ORDER BY watchCount DESC")
    List<Object[]> findMostWatchedMovies(Pageable pageable);

    @Query("SELECT wh.movie, COUNT(wh) as recentWatchCount FROM WatchHistory wh WHERE wh.lastWatchedAt >= CURRENT_TIMESTAMP - 7 DAY GROUP BY wh.movie ORDER BY recentWatchCount DESC")
    List<Object[]> findTrendingMovies(Pageable pageable);

    void deleteByMovie(Movie movie);
}
