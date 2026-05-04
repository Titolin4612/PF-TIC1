package com.example.backend.dto;

import java.util.List;

public class RutasOptimizadasResponse {

    private String base;
    private List<RutaVehiculoResponse> rutas;

    public RutasOptimizadasResponse(String base, List<RutaVehiculoResponse> rutas) {
        this.base = base;
        this.rutas = rutas;
    }

    public String getBase() {
        return base;
    }

    public List<RutaVehiculoResponse> getRutas() {
        return rutas;
    }
}
