package com.raw.backend.repository;

import com.raw.backend.entity.ContentAsset;
import com.raw.backend.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentAssetRepository extends JpaRepository<ContentAsset, Long> {

    List<ContentAsset> findByMovieAndActiveTrue(Movie movie);

    Optional<ContentAsset> findByMovieAndAssetTypeAndActiveTrue(Movie movie, String assetType);

    void deleteByMovie(Movie movie);
}
