package com.example.backend.web;

import com.example.backend.dto.GeoStopRequest;
import com.example.backend.dto.RouteOptimizationResponse;
import com.example.backend.service.OsrmService;
import com.example.backend.service.RouteCostMatrix;
import com.example.backend.service.TspService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final TspService tspService;
    private final OsrmService osrmService;

    public RouteController(TspService tspService, OsrmService osrmService) {
        this.tspService = tspService;
        this.osrmService = osrmService;
    }

    @PreAuthorize("hasAnyRole('GERENTE', 'REPARTIDOR')")
    @PostMapping("/optimize")
    public RouteOptimizationResponse optimize(@RequestBody List<GeoStopRequest> stops) {
        if (stops == null || stops.isEmpty()) {
            return new RouteOptimizationResponse(List.of(), 0, null);
        }

        if (stops.size() == 1) {
            return new RouteOptimizationResponse(List.copyOf(stops), 0, null);
        }

        // 1. Try road durations from OSRM, adjusted by congestion, for better TSP ordering.
        RouteCostMatrix costMatrix = osrmService.getRouteCostMatrix(stops);

        List<GeoStopRequest> optimized;
        double totalKm;

        if (costMatrix != null) {
            optimized = tspService.nearestNeighborTSP(stops, costMatrix.weightedDurationSeconds());
            totalKm = tspService.totalDistanceKm(optimized, stops, costMatrix.distanceMeters());
        } else {
            optimized = tspService.nearestNeighborTSP(stops);
            totalKm = tspService.totalDistanceKm(optimized);
        }

        // 2. Get actual road geometry for the polyline
        List<double[]> geometry = optimized.size() > 1 ? osrmService.getRouteGeometry(optimized) : null;

        return new RouteOptimizationResponse(optimized, totalKm, geometry);
    }
}
