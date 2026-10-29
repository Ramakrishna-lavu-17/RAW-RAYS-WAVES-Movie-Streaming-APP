package com.raw.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
@Setter
public class TmdbConfig {

    @Value("${tmdb.api.key:}")
    private String apiKey;

    @Value("${tmdb.api.read-access-token:}")
    private String readAccessToken;

    @Value("${tmdb.api.base-url:https://api.themoviedb.org/3}")
    private String baseUrl;

    @Value("${tmdb.image.base-url:https://image.tmdb.org/t/p}")
    private String imageBaseUrl;

    public boolean isConfigured() {
        return (apiKey != null && !apiKey.isBlank()) || (readAccessToken != null && !readAccessToken.isBlank());
    }

    public void updateCredentials(String key, String token) {
        if (key != null && !key.isBlank()) {
            this.apiKey = key.trim();
        }
        if (token != null && !token.isBlank()) {
            this.readAccessToken = token.trim();
        }
    }
}
