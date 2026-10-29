package com.raw.backend.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
@Slf4j
public class StorageTokenService {

    private final String secretKey;
    private static final String HMAC_ALGO = "HmacSHA256";

    public StorageTokenService(
            @Value("${raw.storage.token.secret:RAW_OTT_SECURE_STORAGE_SECRET_KEY_2026_VERY_SECURE}") String secretKey) {
        this.secretKey = secretKey;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenClaims {
        private Long userId;
        private Long movieId;
        private String allowedQuality; // "480p", "720p", "1080p"
        private long expiresAt;
    }

    /**
     * Generates a tamper-proof HMAC-SHA256 signed playback token.
     */
    public String generateToken(Long userId, Long movieId, String allowedQuality, long ttlSeconds) {
        long expiresAt = System.currentTimeMillis() + (ttlSeconds * 1000L);
        String payload = String.format("%d:%d:%s:%d", userId, movieId, allowedQuality.toLowerCase(), expiresAt);
        String signature = computeHmac(payload);
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + signature;
    }

    /**
     * Validates signature and expiration of playback token.
     * Returns parsed TokenClaims or null if invalid or expired.
     */
    public TokenClaims validateToken(String token) {
        if (token == null || !token.contains(".")) {
            return null;
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                return null;
            }

            String encodedPayload = parts[0];
            String receivedSignature = parts[1];

            byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedPayload);
            String payload = new String(decodedBytes, StandardCharsets.UTF_8);

            String expectedSignature = computeHmac(payload);
            if (!expectedSignature.equals(receivedSignature)) {
                log.warn("Invalid storage token signature detected");
                return null;
            }

            String[] fields = payload.split(":");
            if (fields.length != 4) {
                return null;
            }

            Long userId = Long.parseLong(fields[0]);
            Long movieId = Long.parseLong(fields[1]);
            String allowedQuality = fields[2];
            long expiresAt = Long.parseLong(fields[3]);

            if (System.currentTimeMillis() > expiresAt) {
                log.warn("Expired storage token for movie {} user {}", movieId, userId);
                return null;
            }

            return TokenClaims.builder()
                    .userId(userId)
                    .movieId(movieId)
                    .allowedQuality(allowedQuality)
                    .expiresAt(expiresAt)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse storage token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Checks if requested objectKey (e.g. movies/24/1080p/index.m3u8) is within permitted quality tier.
     */
    public boolean isQualityPermitted(String allowedQuality, String objectKey) {
        if (allowedQuality == null || objectKey == null) {
            return false;
        }

        String lowerKey = objectKey.toLowerCase();
        String lowerAllowed = allowedQuality.toLowerCase();

        // 1080p allows all renditions (1080p, 720p, 480p, master)
        if ("1080p".equals(lowerAllowed)) {
            return true;
        }

        // Standard: 720p allows 720p and 480p, rejects 1080p and master with 1080p
        if ("720p".equals(lowerAllowed)) {
            if (lowerKey.contains("/1080p/")) {
                return false;
            }
            if (lowerKey.endsWith("master.m3u8")) {
                return false;
            }
            return true;
        }

        // Basic: 480p allows only 480p
        if ("480p".equals(lowerAllowed)) {
            if (lowerKey.contains("/1080p/") || lowerKey.contains("/720p/")) {
                return false;
            }
            if (lowerKey.endsWith("master.m3u8")) {
                return false;
            }
            return true;
        }

        return false;
    }

    private String computeHmac(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error computing HMAC signature", e);
        }
    }
}
