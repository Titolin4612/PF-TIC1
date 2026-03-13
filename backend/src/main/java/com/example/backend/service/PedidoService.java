package com.example.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;

import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.exception.PedidoNoEncontradoException;
import com.example.backend.repository.PedidoRepository;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;

    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    public Pedido crearPedido(Pedido pedido) {
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }

    public Pedido obtenerPorId(Long id) {
        return pedidoRepository.findById(id)
        .orElseThrow(() -> new PedidoNoEncontradoException("Pedido no encontrado"));
    }
    public Pedido actualizarEstado(Long id, EstadoPedido nuevoEstado) {
            Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new PedidoNoEncontradoException("Pedido no encontrado con id: " + id));
            pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }
    public Pedido actualizarPedido(Long id, Pedido pedidoActualizado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new PedidoNoEncontradoException("Pedido no encontrado"));

        pedido.setDireccionEntrega(pedidoActualizado.getDireccionEntrega());
        pedido.setEstado(pedidoActualizado.getEstado());

        return pedidoRepository.save(pedido);
    }
    public void eliminarPedido(Long id) {
        if (!pedidoRepository.existsById(id)) {
                throw new PedidoNoEncontradoException("Pedido no encontrado con id: " + id);
            }
        pedidoRepository.deleteById(id);
    }
    public List<Pedido> filtrarPorEstado(EstadoPedido estado) {
        return pedidoRepository.findByEstado(estado);
    }
    
}