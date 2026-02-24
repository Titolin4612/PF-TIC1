package com.example.backend.service;

import java.time.Instant;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public Map<String, Object> status() {
        return Map.of(
                "status", "ok",
                "timestamp", Instant.now().toString());
    }
}
