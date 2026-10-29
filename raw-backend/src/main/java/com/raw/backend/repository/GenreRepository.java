package com.raw.backend.repository;

import com.raw.backend.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
    
    Optional<Genre> findByNameIgnoreCase(String name);
    
    boolean existsByNameIgnoreCase(String name);
}
