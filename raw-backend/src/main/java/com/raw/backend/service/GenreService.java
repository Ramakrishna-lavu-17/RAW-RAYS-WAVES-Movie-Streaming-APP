package com.raw.backend.service;

import com.raw.backend.dto.GenreRequest;
import com.raw.backend.dto.GenreResponse;
import com.raw.backend.entity.Genre;
import com.raw.backend.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;

    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GenreResponse getGenreById(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Genre not found with id: " + id));
        return mapToResponse(genre);
    }

    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        if (genreRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Genre with name '" + request.getName() + "' already exists!");
        }

        Genre genre = new Genre();
        genre.setName(request.getName());
        genre.setDescription(request.getDescription());

        return mapToResponse(genreRepository.save(genre));
    }

    @Transactional
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Genre not found with id: " + id));

        genre.setName(request.getName());
        genre.setDescription(request.getDescription());

        return mapToResponse(genreRepository.save(genre));
    }

    @Transactional
    public void deleteGenre(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Genre not found with id: " + id));
        genreRepository.delete(genre);
    }

    public GenreResponse mapToResponse(Genre genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .build();
    }
}
