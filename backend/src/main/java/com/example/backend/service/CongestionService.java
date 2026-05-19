package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CongestionService {

    private static final List<CongestionArea> CONGESTION_AREAS = List.of(
            new CongestionArea("Avenida Regional / Industriales", 6.2258, -75.5732, 2.2, 1.45),
            new CongestionArea("Avenida El Poblado", 6.2107, -75.5681, 2.0, 1.35),
            new CongestionArea("Centro / Oriental", 6.2475, -75.5658, 1.8, 1.40),
            new CongestionArea("San Juan / Laureles", 6.2464, -75.5901, 1.7, 1.30),
            new CongestionArea("Autopista Norte / Bello", 6.3068, -75.5628, 2.5, 1.30),
            new CongestionArea("Las Vegas / Envigado", 6.1826, -75.5841, 1.9, 1.25)
    );

    public double factorForSegment(GeoStopRequest from, GeoStopRequest to) {
        double factor = 1.0;
        GeoPoint midpoint = new GeoPoint((from.lat() + to.lat()) / 2.0, (from.lng() + to.lng()) / 2.0);

        for (CongestionArea area : CONGESTION_AREAS) {
            if (area.contains(from.lat(), from.lng())
                    || area.contains(to.lat(), to.lng())
                    || area.contains(midpoint.lat(), midpoint.lng())) {
                factor = Math.max(factor, area.factor());
            }
        }

        return factor;
    }

    public double applyToDuration(GeoStopRequest from, GeoStopRequest to, double durationSeconds) {
        return durationSeconds * factorForSegment(from, to);
    }

    private record GeoPoint(double lat, double lng) {
    }

    private record CongestionArea(String name, double lat, double lng, double radiusKm, double factor) {
        private boolean contains(double pointLat, double pointLng) {
            final double earthRadiusKm = 6371.0;
            double dLat = Math.toRadians(pointLat - lat);
            double dLng = Math.toRadians(pointLng - lng);
            double latA = Math.toRadians(lat);
            double latB = Math.toRadians(pointLat);
            double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(latA) * Math.cos(latB)
                    * Math.sin(dLng / 2) * Math.sin(dLng / 2);

            double distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
            return distanceKm <= radiusKm;
        }
    }
}
