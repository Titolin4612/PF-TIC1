package com.example.backend.dto;

import com.example.backend.entity.Pedido;

import java.util.List;

public record RutaVehiculoResponse(
        String vehiculo,
        TipoVehiculo tipo,
        String repartidor,
        int capacidadMaxima,
        double capacidadKg,
        double cargaKg,
        List<Pedido> pedidosAsignados,
        double distanciaEstimada) {
}
