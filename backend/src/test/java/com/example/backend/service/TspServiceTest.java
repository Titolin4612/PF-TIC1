package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TspServiceTest {

    private final TspService tspService = new TspService();

    @Test
    void nearestNeighborTsp_placesPrioritariosFirst_thenNearestOrder() {
        GeoStopRequest a = stop(1L, false);
        GeoStopRequest b = stop(2L, true);
        GeoStopRequest c = stop(3L, false);

        List<GeoStopRequest> route = tspService.nearestNeighborTSP(List.of(a, b, c));

        assertEquals(3, route.size());
        assertEquals(2L, route.get(0).id());
    }

    @Test
    void nearestNeighborTsp_withDistanceMatrix_usesMatrixForSelection() {
        GeoStopRequest s1 = stop(1L, false);
        GeoStopRequest s2 = stop(2L, false);
        GeoStopRequest s3 = stop(3L, false);

        List<GeoStopRequest> stops = List.of(s1, s2, s3);
        double[][] matrix = new double[][]{
                {0, 1000, 200},
                {1000, 0, 100},
                {200, 100, 0}
        };

        List<GeoStopRequest> route = tspService.nearestNeighborTSP(stops, matrix);

        assertEquals(List.of(1L, 3L, 2L), route.stream().map(GeoStopRequest::id).toList());
    }

    @Test
    void totalDistanceKm_withMatrix_convertsMetersToRoundedKm() {
        GeoStopRequest s1 = stop(1L, false);
        GeoStopRequest s2 = stop(2L, false);
        GeoStopRequest s3 = stop(3L, false);

        List<GeoStopRequest> original = List.of(s1, s2, s3);
        List<GeoStopRequest> ordered = List.of(s1, s3, s2);
        double[][] matrix = new double[][]{
                {0, 1000, 2500},
                {1000, 0, 1400},
                {2500, 1400, 0}
        };

        double totalKm = tspService.totalDistanceKm(ordered, original, matrix);

        assertEquals(3.9, totalKm);
    }

    @Test
    void totalDistanceKm_withHaversine_returnsZeroForSingleStop() {
        GeoStopRequest single = stop(1L, false);

        double totalKm = tspService.totalDistanceKm(List.of(single));

        assertEquals(0.0, totalKm);
    }

    @Test
    void nearestNeighborTsp_withDistanceMatrix_usesFragileAndSlaAsSecondaryPriority() {
        GeoStopRequest s1 = stop(1L, false);
        GeoStopRequest s2 = new GeoStopRequest(2L, 0, 0, "S2", "", false, 2.0, true, 30);
        GeoStopRequest s3 = stop(3L, false);

        List<GeoStopRequest> stops = List.of(s1, s2, s3);
        double[][] matrix = new double[][]{
                {0, 105, 100},
                {105, 0, 100},
                {100, 100, 0}
        };

        List<GeoStopRequest> route = tspService.nearestNeighborTSP(stops, matrix);

        assertEquals(List.of(1L, 2L, 3L), route.stream().map(GeoStopRequest::id).toList());
    }

    private GeoStopRequest stop(Long id, boolean prioritario) {
        return new GeoStopRequest(id, 6.24 + (id * 0.01), -75.58 + (id * 0.01),
                "S" + id, "", prioritario, 2.0, false, 45);
    }
}
