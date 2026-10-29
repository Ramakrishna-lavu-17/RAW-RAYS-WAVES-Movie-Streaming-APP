package com.raw.backend.repository;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByTitleContainingIgnoreCaseAndActiveTrue(String title);

    List<Movie> findByLanguageIgnoreCaseAndActiveTrue(String language);

    List<Movie> findByStatusAndActiveTrue(MovieStatus status);

    java.util.Optional<Movie> findByTmdbId(Long tmdbId);

    boolean existsByTmdbId(Long tmdbId);

    @Query("SELECT m FROM Movie m JOIN m.genres g WHERE LOWER(g.name) = LOWER(:genreName) AND m.active = true")
    List<Movie> findByGenreName(@Param("genreName") String genreName);

    @Query("SELECT m FROM Movie m WHERE m.active = true AND m.status = 'AVAILABLE' AND (m.rawAvailableDate IS NULL OR m.rawAvailableDate <= :today)")
    List<Movie> findAvailableMovies(@Param("today") LocalDate today);

    @Query("SELECT m FROM Movie m WHERE m.active = true AND (m.status = 'COMING_SOON' OR (m.rawAvailableDate IS NOT NULL AND m.rawAvailableDate > :today))")
    List<Movie> findComingSoonMovies(@Param("today") LocalDate today);

    long countByStatus(MovieStatus status);

    long countByActiveTrue();
}
