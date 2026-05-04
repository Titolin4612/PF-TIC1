package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TspService {

    /** Nearest-neighbor TSP using Haversine fallback and operational priority. */
    public List<GeoStopRequest> nearestNeighborTSP(List<GeoStopRequest> stops) {
        if (stops.size() <= 1) return new ArrayList<>(stops);

        List<GeoStopRequest> prioritarios = stops.stream().filter(GeoStopRequest::prioritario).toList();
        List<GeoStopRequest> normales = stops.stream().filter(s -> !s.prioritario()).toList();

        List<GeoStopRequest> ordered = new ArrayList<>();
        ordered.addAll(prioritarios);
        ordered.addAll(normales);

        List<GeoStopRequest> unvisited = new ArrayList<>(ordered.subList(1, ordered.size()));
        List<GeoStopRequest> route = new ArrayList<>();
        route.add(ordered.get(0));

        while (!unvisited.isEmpty()) {
            GeoStopRequest current = route.get(route.size() - 1);
            int nearestIdx = 0;
            double nearestDist = weightedCost(unvisited.get(0), haversineKm(current, unvisited.get(0)));
            for (int i = 1; i < unvisited.size(); i++) {
                double d = weightedCost(unvisited.get(i), haversineKm(current, unvisited.get(i)));
                if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
            }
            route.add(unvisited.remove(nearestIdx));
        }
        return route;
    }

    /** Nearest-neighbor TSP using a road distance matrix. Prioritarios always first. */
    public List<GeoStopRequest> nearestNeighborTSP(List<GeoStopRequest> stops, double[][] distMatrix) {
        if (stops.size() <= 1) return new ArrayList<>(stops);

        int n = stops.size();
        List<Integer> prioritarioIdxs = new ArrayList<>();
        List<Integer> normalIdxs = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (stops.get(i).prioritario()) prioritarioIdxs.add(i);
            else normalIdxs.add(i);
        }

        List<Integer> orderedIdxs = new ArrayList<>();
        orderedIdxs.addAll(prioritarioIdxs);
        orderedIdxs.addAll(normalIdxs);

        List<Integer> unvisited = new ArrayList<>(orderedIdxs.subList(1, orderedIdxs.size()));
        List<Integer> routeIdxs = new ArrayList<>();
        routeIdxs.add(orderedIdxs.get(0));

        while (!unvisited.isEmpty()) {
            int currentIdx = routeIdxs.get(routeIdxs.size() - 1);
            int nearestPos = 0;
            double nearestDist = weightedCost(stops.get(unvisited.get(0)), distMatrix[currentIdx][unvisited.get(0)]);
            for (int i = 1; i < unvisited.size(); i++) {
                double d = weightedCost(stops.get(unvisited.get(i)), distMatrix[currentIdx][unvisited.get(i)]);
                if (d < nearestDist) { nearestDist = d; nearestPos = i; }
            }
            routeIdxs.add(unvisited.remove(nearestPos));
        }

        return routeIdxs.stream().map(stops::get).toList();
    }

    /** Total distance in km using road distance matrix (meters). */
    public double totalDistanceKm(List<GeoStopRequest> ordered, List<GeoStopRequest> original, double[][] distMatrix) {
        double total = 0;
        for (int i = 0; i < ordered.size() - 1; i++) {
            int from = original.indexOf(ordered.get(i));
            int to = original.indexOf(ordered.get(i + 1));
            total += distMatrix[from][to];
        }
        return Math.round(total / 100.0) / 10.0; // meters → km, 1 decimal
    }

    /** Total distance in km using Haversine (fallback). */
    public double totalDistanceKm(List<GeoStopRequest> stops) {
        double total = 0;
        for (int i = 0; i < stops.size() - 1; i++) {
            total += haversineKm(stops.get(i), stops.get(i + 1));
        }
        return Math.round(total * 10.0) / 10.0;
    }

    private double weightedCost(GeoStopRequest stop, double distance) {
        double factor = 1.0;
        if (stop.prioritario()) {
            factor -= 0.25;
        }
        if (Boolean.TRUE.equals(stop.fragil())) {
            factor -= 0.10;
        }
        if (stop.tiempoEstimadoMinutos() != null && stop.tiempoEstimadoMinutos() <= 35) {
            factor -= 0.10;
        }
        if (stop.peso() != null && stop.peso() > 20) {
            factor += 0.05;
        }
        return distance * Math.max(factor, 0.55);
    }

    private double haversineKm(GeoStopRequest a, GeoStopRequest b) {
        final double R = 6371;
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLng = Math.toRadians(b.lng() - a.lng());
        double x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a.lat())) * Math.cos(Math.toRadians(b.lat()))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }
}
