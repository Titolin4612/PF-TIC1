package com.example.backend.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccionEntrega;

    @NotNull(message = "El estado es obligatorio")
    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fechaCreacion;

    private String zona;

    private Double peso;

    @Enumerated(EnumType.STRING)
    private TipoTamano tamano;

    private Boolean fragil;

    @NotNull(message = "El tipo de cobro es obligatorio")
    @Enumerated(EnumType.STRING)
    private TipoCobro tipoCobro;

    private Boolean prioritario;

    private Double costoDomicilio;

    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago;

    private String clienteEmail;

    private String repartidorEmail;

    @Column(unique = true)
    private String stripeSessionId;

    public Pedido() {
        this.fechaCreacion = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getDireccionEntrega() {
        return direccionEntrega;
    }

    public void setDireccionEntrega(String direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }

    public Double getPeso() {
        return peso;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public TipoTamano getTamano() {
        return tamano;
    }

    public void setTamano(TipoTamano tamano) {
        this.tamano = tamano;
    }

    public Boolean getFragil() {
        return fragil;
    }

    public void setFragil(Boolean fragil) {
        this.fragil = fragil;
    }

    public TipoCobro getTipoCobro() {
        return tipoCobro;
    }

    public void setTipoCobro(TipoCobro tipoCobro) {
        this.tipoCobro = tipoCobro;
    }

    public Boolean getPrioritario() {
        return prioritario;
    }

    public void setPrioritario(Boolean prioritario) {
        this.prioritario = prioritario;
    }

    public Double getCostoDomicilio() {
        return costoDomicilio;
    }

    public void setCostoDomicilio(Double costoDomicilio) {
        this.costoDomicilio = costoDomicilio;
    }

    public EstadoPago getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(EstadoPago estadoPago) {
        this.estadoPago = estadoPago;
    }

    public String getClienteEmail() {
        return clienteEmail;
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public String getRepartidorEmail() {
        return repartidorEmail;
    }

    public void setRepartidorEmail(String repartidorEmail) {
        this.repartidorEmail = repartidorEmail;
    }

    public String getStripeSessionId() {
        return stripeSessionId;
    }

    public void setStripeSessionId(String stripeSessionId) {
        this.stripeSessionId = stripeSessionId;
    }
}
