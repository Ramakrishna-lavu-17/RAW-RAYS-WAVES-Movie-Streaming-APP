package com.raw.backend.config;

import com.raw.backend.service.LocalStorageService;
import com.raw.backend.service.R2StorageService;
import com.raw.backend.service.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class StorageConfig {

    @Bean
    @Primary
    public StorageService primaryStorageService(
            @Value("${raw.storage.provider:local}") String provider,
            R2StorageService r2StorageService,
            LocalStorageService localStorageService) {

        if ("r2".equalsIgnoreCase(provider) && r2StorageService.isConfigured()) {
            log.info("Using Cloudflare R2 as the active external object storage service.");
            return r2StorageService;
        }

        log.info("Using Local External Object Storage (files stored outside PostgreSQL in external directory) as active storage service.");
        return localStorageService;
    }
}
