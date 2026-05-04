package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OsrmService {

    private static final Logger log = LoggerFactory.getLogger(OsrmService.class);
    private static final String OSRM_BASE = "http://router.project-osrm.org";

    private final RestClient restClient = RestClient.create();

    /** Returns road distance matrix in meters. Returns null on error → caller uses Haversine. */
    public double[][] getDistanceMatrix(List<GeoStopRequest> stops) {
        try {
            String url = OSRM_BASE + "/table/v1/driving/" + buildCoords(stops) + "?annotations=distance";
            JsonNode root = restClient.get().uri(url).retrieve().body(JsonNode.class);
            if (root == null || !root.has("distances")) return null;

            JsonNode distNode = root.get("distances");
            int n = distNode.size();
            Double[][] raw = new Double[n][];
            for (int i = 0; i < n; i++) {
                JsonNode row = distNode.get(i);
                raw[i] = new Double[row.size()];
                for (int j = 0; j < row.size(); j++) {
                    raw[i][j] = row.get(j).isNull() ? null : row.get(j).asDouble();
                }
            }
            return sanitizeMatrix(raw, stops);
        } catch (Exception e) {
            log.warn("OSRM table failed: {}", e.getMessage());
            return null;
        }
    }

    /** Returns road geometry as [[lat, lng], ...] (Leaflet order). Returns null on error. */
    public List<double[]> getRouteGeometry(List<GeoStopRequest> orderedStops) {
        try {
            String url = OSRM_BASE + "/route/v1/driving/" + buildCoords(orderedStops) + "?overview=full&geometries=geojson";
            JsonNode root = restClient.get().uri(url).retrieve().body(JsonNode.class);
            if (root == null || !root.has("routes") || root.get("routes").isEmpty()) return null;

            JsonNode coords = root.get("routes").get(0).get("geometry").get("coordinates");
            List<double[]> geometry = new ArrayList<>();
            for (JsonNode c : coords) {
                // GeoJSON is [lng, lat] → swap to [lat, lng] for Leaflet
                geometry.add(new double[]{c.get(1).asDouble(), c.get(0).asDouble()});
            }
            return geometry;
        } catch (Exception e) {
            log.warn("OSRM route failed: {}", e.getMessage());
            return null;
        }
    }

    private String buildCoords(List<GeoStopRequest> stops) {
        return stops.stream()
                .map(s -> s.lng() + "," + s.lat())
                .collect(Collectors.joining(";"));
    }

    private double[][] sanitizeMatrix(Double[][] raw, List<GeoStopRequest> stops) {
        int n = stops.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                Double val = (raw[i] != null && j < raw[i].length) ? raw[i][j] : null;
                if (val == null || val.isNaN() || val < 0) {
                    matrix[i][j] = haversineMeters(stops.get(i), stops.get(j)) * 1.3;
                } else {
                    matrix[i][j] = val;
                }
            }
        }
        return matrix;
    }

    private double haversineMeters(GeoStopRequest a, GeoStopRequest b) {
        final double R = 6_371_000;
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLng = Math.toRadians(b.lng() - a.lng());
        double x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a.lat())) * Math.cos(Math.toRadians(b.lat()))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }
}
