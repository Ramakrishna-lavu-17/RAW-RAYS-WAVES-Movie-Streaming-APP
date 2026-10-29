package com.raw.backend.repository;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.User;
import com.raw.backend.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findByUserOrderByAddedAtDesc(User user);

    Optional<Watchlist> findByUserAndMovie(User user, Movie movie);

    boolean existsByUserAndMovie(User user, Movie movie);

    void deleteByUserAndMovie(User user, Movie movie);

    void deleteByMovie(Movie movie);
}
