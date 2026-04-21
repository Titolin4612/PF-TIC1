package com.example.backend.entity;

public enum TipoCobro {
    CONTRA_ENTREGA,
    WEB,
    PAGO_WEB;

    public boolean esPagoWeb() {
        return this == WEB || this == PAGO_WEB;
    }
}
