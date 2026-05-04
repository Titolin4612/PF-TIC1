package com.example.backend.dto;

public record GeoStopRequest(
        Long id,
        double lat,
        double lng,
        String label,
        String subLabel,
        boolean prioritario,
        Double peso,
        Boolean fragil,
        Integer tiempoEstimadoMinutos) {
}
