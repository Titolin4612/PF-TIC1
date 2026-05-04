package com.example.backend.dto;

import java.util.List;

import com.example.backend.entity.Pedido;

public class RutaVehiculoResponse {

    private String vehiculo;
    private TipoVehiculo tipo;
    private String repartidor;
    private int capacidadMaxima;
    private List<Pedido> pedidosAsignados;
    private double distanciaEstimada;

    public RutaVehiculoResponse(
            String vehiculo,
            TipoVehiculo tipo,
            String repartidor,
            int capacidadMaxima,
            List<Pedido> pedidosAsignados,
            double distanciaEstimada) {
        this.vehiculo = vehiculo;
        this.tipo = tipo;
        this.repartidor = repartidor;
        this.capacidadMaxima = capacidadMaxima;
        this.pedidosAsignados = pedidosAsignados;
        this.distanciaEstimada = distanciaEstimada;
    }

    public String getVehiculo() {
        return vehiculo;
    }

    public TipoVehiculo getTipo() {
        return tipo;
    }

    public String getRepartidor() {
        return repartidor;
    }

    public int getCapacidadMaxima() {
        return capacidadMaxima;
    }

    public List<Pedido> getPedidosAsignados() {
        return pedidosAsignados;
    }

    public double getDistanciaEstimada() {
        return distanciaEstimada;
    }
}
