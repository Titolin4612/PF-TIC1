package com.example.backend.web;

import com.example.backend.entity.Usuario;
import com.example.backend.service.UsuarioService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/repartidores")
public class RepartidorController {

    private final UsuarioService usuarioService;

    public RepartidorController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PreAuthorize("hasRole('GERENTE')")
    @GetMapping
    public List<Usuario> listarRepartidores() {
        return usuarioService.listarRepartidores();
    }

    @PreAuthorize("hasRole('GERENTE')")
    @PatchMapping("/{email}/operacion")
    public Usuario actualizarOperacion(
            @PathVariable String email,
            @RequestBody ActualizarOperacionRepartidorRequest request) {
        return usuarioService.actualizarPerfilRepartidor(
                email,
                request.disponible(),
                request.capacidadVehiculoKg(),
                request.vehiculo(),
                request.placaVehiculo());
    }

    public record ActualizarOperacionRepartidorRequest(
            Boolean disponible,
            Double capacidadVehiculoKg,
            String vehiculo,
            String placaVehiculo) {
    }
}
