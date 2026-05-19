package com.example.backend.service;

public record RouteCostMatrix(
        double[][] distanceMeters,
        double[][] durationSeconds,
        double[][] weightedDurationSeconds) {
}
