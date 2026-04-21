package com.example.backend.web;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.TipoCobro;
import com.example.backend.entity.TipoTamano;
import com.example.backend.service.StripeService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Validated
@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final StripeService stripeService;

    public PagoController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/checkout")
    public CheckoutResponse crearCheckout(@Valid @RequestBody CheckoutRequest request, Authentication authentication) {
        String url = stripeService.crearCheckout(new StripeService.CheckoutPedido(
                request.direccionEntrega(),
                request.zona(),
                request.peso(),
                request.tamano(),
                request.fragil(),
                request.tipoCobro(),
                request.prioritario(),
                authentication.getName()));
        return new CheckoutResponse(url);
    }

    @GetMapping("/verificar")
    public Map<String, Object> verificarPago(@RequestParam("session_id") String sessionId) {
        return stripeService.verificarPago(sessionId);
    }

    @PostMapping("/confirmar")
    public Map<String, Object> confirmarPago(@RequestParam("session_id") String sessionId) {
        return stripeService.confirmarPagoYCrearPedido(sessionId);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CheckoutRequest(
            @NotBlank String direccionEntrega,
            @NotBlank String zona,
            @NotNull @PositiveOrZero Double peso,
            @NotNull TipoTamano tamano,
            @NotNull Boolean fragil,
            @NotNull TipoCobro tipoCobro,
            @NotNull Boolean prioritario) {
    }

    public record CheckoutResponse(String url) {
    }
}
