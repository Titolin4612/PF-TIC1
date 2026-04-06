package com.example.backend.web;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.service.PedidoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private static final Set<String> ROLES_GERENTE = Set.of("ROLE_GERENTE");
    private static final Set<String> ROLES_REPARTIDOR = Set.of("ROLE_REPARTIDOR");
    private static final Set<String> ROLES_CLIENTE = Set.of("ROLE_CLIENTE");

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public Pedido crearPedido(@Valid @RequestBody Pedido pedido, Authentication authentication) {
        return pedidoService.crearPedidoComoCliente(pedido, authentication.getName());
    }

    @GetMapping
    public List<Pedido> listarPedidos(Authentication authentication) {
        if (tieneRol(authentication, ROLES_GERENTE)) {
            return pedidoService.listarPedidos();
        }
        if (tieneRol(authentication, ROLES_REPARTIDOR)) {
            return pedidoService.listarPedidosRepartidor(authentication.getName());
        }
        if (tieneRol(authentication, ROLES_CLIENTE)) {
            return pedidoService.listarPedidosCliente(authentication.getName());
        }
        throw new IllegalArgumentException("Rol no soportado");
    }

    @GetMapping("/test")
    public String test() {
        return "Módulo de pedidos activo 🚚";
    }

    @GetMapping("/{id}")
    public Pedido obtenerPedido(@PathVariable Long id, Authentication authentication) {
        Pedido pedido = pedidoService.obtenerPorId(id);
        if (tieneRol(authentication, ROLES_GERENTE)) {
            return pedido;
        }
        if (tieneRol(authentication, ROLES_CLIENTE) && authentication.getName().equals(pedido.getClienteEmail())) {
            return pedido;
        }
        if (tieneRol(authentication, ROLES_REPARTIDOR)
                && authentication.getName().equals(pedido.getRepartidorEmail())) {
            return pedido;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes ver este pedido");
    }
    @PutMapping("/{id}")
    public Pedido actualizarPedido(@PathVariable Long id, @Valid @RequestBody Pedido pedido) {
        return pedidoService.actualizarPedido(id, pedido);
    }
   @PutMapping("/{id}/estado")
    public Pedido actualizarEstado(@PathVariable Long id, @RequestParam EstadoPedido estado) {
        return pedidoService.actualizarEstado(id, estado);
    }
    @DeleteMapping("/{id}")
    public void eliminarPedido(@PathVariable Long id) {
        pedidoService.eliminarPedido(id);
    }   
    @GetMapping("/estado")
    public List<Pedido> filtrarPorEstado(@RequestParam EstadoPedido estado, Authentication authentication) {
        if (tieneRol(authentication, ROLES_GERENTE)) {
            return pedidoService.filtrarPorEstado(estado);
        }
        if (tieneRol(authentication, ROLES_CLIENTE)) {
            return pedidoService.listarPedidosCliente(authentication.getName()).stream()
                    .filter(p -> p.getEstado() == estado)
                    .toList();
        }
        if (tieneRol(authentication, ROLES_REPARTIDOR)) {
            return pedidoService.listarPedidosRepartidor(authentication.getName()).stream()
                    .filter(p -> p.getEstado() == estado)
                    .toList();
        }
        return List.of();
    }

    @PutMapping("/{id}/asignar")
    public Pedido asignarRepartidor(@PathVariable Long id, @RequestParam String repartidorEmail) {
        return pedidoService.asignarRepartidor(id, repartidorEmail);
    }

    private boolean tieneRol(Authentication authentication, Set<String> roles) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (roles.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
