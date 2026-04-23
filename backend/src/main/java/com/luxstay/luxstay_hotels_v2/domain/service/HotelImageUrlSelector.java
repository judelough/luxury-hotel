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
public class HotelImageUrlSelector {

    private final SecureRandom rng = new SecureRandom();
    private final ReentrantLock lock = new ReentrantLock();

    private List<String> allUrls = List.of();
    private Deque<String> bag = new ArrayDeque<>();

    @PostConstruct
    public void load() {
        this.allUrls = readUrlsFromClasspath("data/hotel-images-urls.txt");
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

    private List<String> readUrlsFromClasspath(String path) {
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8)
        )) {
            return br.lines()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .distinct()
                    .toList();
        } catch (Exception e) {
            return List.of(); // keep app running even if file missing
        }
    }
}
