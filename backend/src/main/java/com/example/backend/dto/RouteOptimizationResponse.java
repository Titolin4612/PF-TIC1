package com.example.backend.dto;

import java.util.List;

public record RouteOptimizationResponse(
        List<GeoStopRequest> stops,
        double totalDistanceKm,
        List<double[]> routeGeometry) {
}
