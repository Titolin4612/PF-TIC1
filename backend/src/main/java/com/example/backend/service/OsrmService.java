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
    private static final double FALLBACK_SPEED_METERS_PER_SECOND = 25_000.0 / 3600.0;

    private final RestClient restClient = RestClient.create();
    private final CongestionService congestionService;

    public OsrmService(CongestionService congestionService) {
        this.congestionService = congestionService;
    }

    /** Returns road distance matrix in meters. Returns null on error, caller uses Haversine. */
    public double[][] getDistanceMatrix(List<GeoStopRequest> stops) {
        RouteCostMatrix matrix = getRouteCostMatrix(stops);
        return matrix == null ? null : matrix.distanceMeters();
    }

    /** Returns distance, duration and congestion-weighted duration matrices. */
    public RouteCostMatrix getRouteCostMatrix(List<GeoStopRequest> stops) {
        try {
            String url = OSRM_BASE + "/table/v1/driving/" + buildCoords(stops) + "?annotations=distance,duration";
            JsonNode root = restClient.get().uri(url).retrieve().body(JsonNode.class);
            if (root == null || !root.has("distances") || !root.has("durations")) return null;

            return sanitizeMatrix(
                    readMatrix(root.get("distances")),
                    readMatrix(root.get("durations")),
                    stops);
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
                // GeoJSON is [lng, lat], Leaflet needs [lat, lng].
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

    private Double[][] readMatrix(JsonNode matrixNode) {
        int n = matrixNode.size();
        Double[][] raw = new Double[n][];
        for (int i = 0; i < n; i++) {
            JsonNode row = matrixNode.get(i);
            raw[i] = new Double[row.size()];
            for (int j = 0; j < row.size(); j++) {
                raw[i][j] = row.get(j).isNull() ? null : row.get(j).asDouble();
            }
        }
        return raw;
    }

    private RouteCostMatrix sanitizeMatrix(
            Double[][] rawDistance,
            Double[][] rawDuration,
            List<GeoStopRequest> stops) {
        int n = stops.size();
        double[][] distanceMeters = new double[n][n];
        double[][] durationSeconds = new double[n][n];
        double[][] weightedDurationSeconds = new double[n][n];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                Double distance = rawValue(rawDistance, i, j);
                Double duration = rawValue(rawDuration, i, j);

                if (distance == null || distance.isNaN() || distance < 0) {
                    distance = haversineMeters(stops.get(i), stops.get(j)) * 1.3;
                }
                if (duration == null || duration.isNaN() || duration < 0) {
                    duration = distance / FALLBACK_SPEED_METERS_PER_SECOND;
                }

                distanceMeters[i][j] = distance;
                durationSeconds[i][j] = duration;
                weightedDurationSeconds[i][j] = congestionService.applyToDuration(
                        stops.get(i),
                        stops.get(j),
                        duration);
            }
        }

        return new RouteCostMatrix(distanceMeters, durationSeconds, weightedDurationSeconds);
    }

    private Double rawValue(Double[][] raw, int i, int j) {
        return raw != null && i < raw.length && raw[i] != null && j < raw[i].length ? raw[i][j] : null;
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
