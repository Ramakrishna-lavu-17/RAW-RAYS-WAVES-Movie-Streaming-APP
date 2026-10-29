package com.raw.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {

    private long totalUsers;
    private long totalMovies;
    private long availableMovies;
    private long comingSoonMovies;
    private List<MovieResponse> mostWatchedMovies;
    private List<MovieResponse> trendingMovies;
}
