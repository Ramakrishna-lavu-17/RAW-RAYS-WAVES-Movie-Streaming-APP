package com.raw.backend.repository;

import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovieVersionRepository extends JpaRepository<MovieVersion, Long> {

    List<MovieVersion> findByMovie(Movie movie);

    Optional<MovieVersion> findByMovieAndQualityIgnoreCase(Movie movie, String quality);

    void deleteByMovie(Movie movie);
}
