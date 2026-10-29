package com.raw.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMediaConfig implements WebMvcConfigurer {

    @Value("${raw.storage.local.root-path:C:/raw-storage/movies}")
    private String rootStoragePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String cleanPath = rootStoragePath.replace("\\", "/");
        if (!cleanPath.endsWith("/")) {
            cleanPath += "/";
        }
        File dir = new File(cleanPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        registry.addResourceHandler("/media/hls/**")
                .addResourceLocations("file:" + cleanPath)
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/media/hls/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*");
    }
}
