package com.raw.backend.service;

import com.raw.backend.dto.WatchlistResponse;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.User;
import com.raw.backend.entity.Watchlist;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final MovieRepository movieRepository;
    private final MovieService movieService;

    public List<WatchlistResponse> getUserWatchlist(User currentUser) {
        return watchlistRepository.findByUserOrderByAddedAtDesc(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WatchlistResponse addToWatchlist(User currentUser, Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (watchlistRepository.existsByUserAndMovie(currentUser, movie)) {
            throw new IllegalArgumentException("Movie is already in your watchlist!");
        }

        Watchlist watchlist = new Watchlist();
        watchlist.setUser(currentUser);
        watchlist.setMovie(movie);

        return mapToResponse(watchlistRepository.save(watchlist));
    }

    @Transactional
    public void removeFromWatchlist(User currentUser, Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        if (!watchlistRepository.existsByUserAndMovie(currentUser, movie)) {
            throw new IllegalArgumentException("Movie is not in your watchlist!");
        }

        watchlistRepository.deleteByUserAndMovie(currentUser, movie);
    }

    private WatchlistResponse mapToResponse(Watchlist watchlist) {
        return WatchlistResponse.builder()
                .id(watchlist.getId())
                .movie(movieService.mapToResponse(watchlist.getMovie()))
                .addedAt(watchlist.getAddedAt())
                .build();
    }
}
