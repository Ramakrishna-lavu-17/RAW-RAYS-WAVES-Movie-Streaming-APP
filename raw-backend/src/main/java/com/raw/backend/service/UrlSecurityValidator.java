package com.raw.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.net.URL;

@Service
@Slf4j
public class UrlSecurityValidator {

    /**
     * Validates that the movie source URL is safe, valid, and accessible.
     * Guards against SSRF, internal network scanning, and invalid protocols.
     */
    public void validateSourceUrl(String sourceUrl) {
        if (sourceUrl == null || sourceUrl.isBlank()) {
            throw new IllegalArgumentException("Movie source URL cannot be empty.");
        }

        URI uri;
        try {
            uri = URI.create(sourceUrl.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL format: " + e.getMessage());
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Unauthorized protocol: Only HTTP and HTTPS sources are permitted.");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Invalid host in movie source URL.");
        }

        // Prevent SSRF: Resolve IP addresses and verify they are NOT private/internal
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (isPrivateOrReservedAddress(addr)) {
                    log.warn("Blocked SSRF attempt to private/internal IP address: {} (Host: {})", addr.getHostAddress(), host);
                    throw new IllegalArgumentException("Access denied: Source URL resolves to a prohibited or private network address (" + addr.getHostAddress() + ").");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to resolve host: " + host + ". Please check URL availability.");
        }

        // Verify that remote source is accessible via HTTP HEAD/GET probe
        verifyAccessibility(uri);
    }

    private boolean isPrivateOrReservedAddress(InetAddress addr) {
        if (addr.isAnyLocalAddress() || addr.isLoopbackAddress() || addr.isLinkLocalAddress()) {
            return true;
        }

        if (addr.isSiteLocalAddress()) {
            return true; // Covers 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        }

        byte[] ip = addr.getAddress();

        // Check for 169.254.x.x (Link-local / Cloud metadata service like 169.254.169.254)
        if (ip.length == 4) {
            int first = ip[0] & 0xFF;
            int second = ip[1] & 0xFF;
            if (first == 169 && second == 254) {
                return true;
            }
            // Check for 0.0.0.0
            if (first == 0) {
                return true;
            }
        }

        return false;
    }

    private void verifyAccessibility(URI uri) {
        HttpURLConnection connection = null;
        try {
            URL url = uri.toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("HEAD");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("User-Agent", "RAW-OTT-MediaIngest/1.0");

            int responseCode = connection.getResponseCode();
            // If HEAD is not allowed (405), fallback to GET with small range
            if (responseCode == HttpURLConnection.HTTP_BAD_METHOD || responseCode == 403) {
                connection.disconnect();
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setRequestProperty("Range", "bytes=0-1024");
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(8000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "RAW-OTT-MediaIngest/1.0");
                responseCode = connection.getResponseCode();
            }

            if (responseCode >= 400) {
                throw new IllegalArgumentException("Source URL is not accessible. Server responded with HTTP status " + responseCode);
            }

            log.info("Successfully validated accessible movie source URL: {}", uri);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect to source URL: {}", uri, e);
            throw new IllegalArgumentException("Unable to connect to source URL: " + e.getMessage());
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
