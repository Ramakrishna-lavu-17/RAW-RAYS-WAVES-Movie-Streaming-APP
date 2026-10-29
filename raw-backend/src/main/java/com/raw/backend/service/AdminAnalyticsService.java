package com.raw.backend.service;

import com.raw.backend.dto.AdminAnalyticsResponse;
import com.raw.backend.dto.MovieResponse;
import com.raw.backend.entity.Movie;
import com.raw.backend.entity.MovieStatus;
import com.raw.backend.repository.MovieRepository;
import com.raw.backend.repository.UserRepository;
import com.raw.backend.repository.WatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final MovieService movieService;

    public AdminAnalyticsService(UserRepository userRepository,
                                 MovieRepository movieRepository,
                                 WatchHistoryRepository watchHistoryRepository,
                                 MovieService movieService) {
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
        this.watchHistoryRepository = watchHistoryRepository;
        this.movieService = movieService;
    }

    public AdminAnalyticsResponse getAnalyticsOverview() {
        long totalUsers = userRepository.count();
        long totalMovies = movieRepository.count();
        long availableMovies = movieRepository.countByStatus(MovieStatus.AVAILABLE);
        long comingSoonMovies = movieRepository.countByStatus(MovieStatus.COMING_SOON);

        List<Object[]> mostWatchedRaw = watchHistoryRepository.findMostWatchedMovies(PageRequest.of(0, 5));
        List<MovieResponse> mostWatched = mostWatchedRaw.stream()
                .map(row -> movieService.mapToResponse((Movie) row[0]))
                .collect(Collectors.toList());

        List<Object[]> trendingRaw = watchHistoryRepository.findTrendingMovies(PageRequest.of(0, 5));
        List<MovieResponse> trending = trendingRaw.stream()
                .map(row -> movieService.mapToResponse((Movie) row[0]))
                .collect(Collectors.toList());

        return AdminAnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalMovies(totalMovies)
                .availableMovies(availableMovies)
                .comingSoonMovies(comingSoonMovies)
                .mostWatchedMovies(mostWatched)
                .trendingMovies(trending)
                .build();
    }
}
