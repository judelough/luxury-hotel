package com.luxstay.luxstay_hotels_v2.domain.service;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

@Component
public class RoomImageUrlSelector {

    private final SecureRandom rng = new SecureRandom();
    private final ReentrantLock lock = new ReentrantLock();

    private List<String> allUrls = List.of();
    private Deque<String> bag = new ArrayDeque<>();

    @PostConstruct
    public void load() {
        this.allUrls = readUrlsFromClasspath("data/room-images-urls.txt");
        refillBag();
    }

    public String nextUrl() {
        lock.lock();
        try {
            if (allUrls.isEmpty()) return null;

            if (bag.isEmpty()) refillBag();

            return bag.removeFirst();
        } finally {
            lock.unlock();
        }
    }

    private void refillBag() {
        List<String> shuffled = new ArrayList<>(allUrls);
        Collections.shuffle(shuffled, rng);
        bag = new ArrayDeque<>(shuffled);
    }

    /**
     * Robust parsing:
     * - trims
     * - splits on ANY whitespace so "url1 url2" becomes 2 urls
     * - removes duplicates while preserving a stable order before shuffling
     */
    private List<String> readUrlsFromClasspath(String path) {
        LinkedHashSet<String> unique = new LinkedHashSet<>();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8)
        )) {
            String line;
            while ((line = br.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isBlank()) continue;

                // split on any whitespace (spaces/tabs)
                String[] parts = trimmed.split("\\s+");
                for (String p : parts) {
                    String url = p.trim();
                    if (!url.isBlank()) unique.add(url);
                }
            }
            return List.copyOf(unique);
        } catch (Exception e) {
            return List.of(); // keep app running even if file missing
        }
    }
}
