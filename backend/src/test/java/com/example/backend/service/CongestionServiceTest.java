package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CongestionServiceTest {

    private final CongestionService congestionService = new CongestionService();

    @Test
    void factorForSegment_penalizesKnownCongestedCorridor() {
        GeoStopRequest from = stop(1L, 6.2258, -75.5732);
        GeoStopRequest to = stop(2L, 6.2265, -75.5740);

        assertTrue(congestionService.factorForSegment(from, to) > 1.0);
    }

    @Test
    void factorForSegment_keepsNeutralFactorOutsideConfiguredAreas() {
        GeoStopRequest from = stop(1L, 6.02, -75.42);
        GeoStopRequest to = stop(2L, 6.03, -75.43);

        assertEquals(1.0, congestionService.factorForSegment(from, to));
    }

    private GeoStopRequest stop(Long id, double lat, double lng) {
        return new GeoStopRequest(id, lat, lng, "S" + id, "", false, 2.0, false, 45);
    }
}
