package com.example.backend.dto;

import java.util.List;

public record RutasOptimizadasResponse(
        String base,
        List<RutaVehiculoResponse> rutas) {
}
