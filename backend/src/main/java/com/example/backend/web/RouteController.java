package com.example.backend.web;

import com.example.backend.dto.GeoStopRequest;
import com.example.backend.dto.RouteOptimizationResponse;
import com.example.backend.service.OsrmService;
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

        // 1. Try road distances from OSRM for better TSP ordering
        double[][] distMatrix = osrmService.getDistanceMatrix(stops);

        List<GeoStopRequest> optimized;
        double totalKm;

        if (distMatrix != null) {
            optimized = tspService.nearestNeighborTSP(stops, distMatrix);
            totalKm = tspService.totalDistanceKm(optimized, stops, distMatrix);
        } else {
            optimized = tspService.nearestNeighborTSP(stops);
            totalKm = tspService.totalDistanceKm(optimized);
        }

        // 2. Get actual road geometry for the polyline
        List<double[]> geometry = optimized.size() > 1 ? osrmService.getRouteGeometry(optimized) : null;

        return new RouteOptimizationResponse(optimized, totalKm, geometry);
    }
}
