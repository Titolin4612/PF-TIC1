package com.example.backend.web;

import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.service.PedidoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "http://localhost:5173")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public Pedido crearPedido(@Valid @RequestBody Pedido pedido) {
        return pedidoService.crearPedido(pedido);
    }

    @GetMapping
    public List<Pedido> listarPedidos() {
        return pedidoService.listarPedidos();
    }

    @GetMapping("/test")
    public String test() {
        return "Módulo de pedidos activo 🚚";
    }

    @GetMapping("/{id}")
    public Pedido obtenerPedido(@PathVariable Long id) {
        return pedidoService.obtenerPorId(id);
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
    public List<Pedido> filtrarPorEstado(@RequestParam EstadoPedido estado) {
        return pedidoService.filtrarPorEstado(estado);
    }
}