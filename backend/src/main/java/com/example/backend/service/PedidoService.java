package com.example.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.Locale;

import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.entity.TipoTamano;
import com.example.backend.exception.PedidoNoEncontradoException;
import com.example.backend.repository.PedidoRepository;

@Service
public class PedidoService {

    private static final Set<String> ZONAS_AREA_METROPOLITANA = Set.of(
            "medellin",
            "envigado",
            "bello",
            "itagui"
    );

    private final PedidoRepository pedidoRepository;

    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    public Pedido crearPedido(Pedido pedido) {
        validarPedido(pedido);
        return pedidoRepository.save(pedido);
    }

    public Pedido crearPedidoComoCliente(Pedido pedido, String clienteEmail) {
        pedido.setClienteEmail(clienteEmail);
        validarPedido(pedido);
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }

    public List<Pedido> listarPedidosCliente(String clienteEmail) {
        return pedidoRepository.findByClienteEmail(clienteEmail);
    }

    public List<Pedido> listarPedidosRepartidor(String repartidorEmail) {
        return pedidoRepository.findByRepartidorEmail(repartidorEmail);
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

        validarPedido(pedidoActualizado);

        pedido.setDireccionEntrega(pedidoActualizado.getDireccionEntrega());
        pedido.setEstado(pedidoActualizado.getEstado());
        pedido.setZona(pedidoActualizado.getZona());
        pedido.setPeso(pedidoActualizado.getPeso());
        pedido.setTamano(pedidoActualizado.getTamano());
        pedido.setFragil(pedidoActualizado.getFragil());
        pedido.setTipoCobro(pedidoActualizado.getTipoCobro());
        pedido.setPrioritario(pedidoActualizado.getPrioritario());
        pedido.setRepartidorEmail(pedidoActualizado.getRepartidorEmail());

        return pedidoRepository.save(pedido);
    }

    public Pedido asignarRepartidor(Long id, String repartidorEmail) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new PedidoNoEncontradoException("Pedido no encontrado"));
        pedido.setRepartidorEmail(repartidorEmail);
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

    private void validarPedido(Pedido pedido) {
        validarZona(pedido.getZona());
        validarPeso(pedido.getPeso());
        validarTamanoVsPeso(pedido.getTamano(), pedido.getPeso());
        validarTipoCobro(pedido);
    }

    private void validarZona(String zona) {
        if (zona == null || zona.isBlank()) {
            throw new IllegalArgumentException("La zona es obligatoria");
        }

        String zonaNormalizada = zona.trim().toLowerCase(Locale.ROOT);
        if (!ZONAS_AREA_METROPOLITANA.contains(zonaNormalizada)) {
            throw new IllegalArgumentException(
                    "La zona debe pertenecer al area metropolitana: Medellin, Envigado, Bello, Itagui");
        }
    }

    private void validarPeso(Double peso) {
        if (peso == null || peso <= 0) {
            throw new IllegalArgumentException("El peso debe ser mayor que 0");
        }
    }

    private void validarTamanoVsPeso(TipoTamano tamano, Double peso) {
        if (tamano == null) {
            throw new IllegalArgumentException("El tamano es obligatorio");
        }

        if (peso == null) {
            return;
        }

        switch (tamano) {
            case PEQUENO:
                if (peso > 5) {
                    throw new IllegalArgumentException("Un pedido PEQUENO no puede superar 5 kg");
                }
                break;
            case MEDIANO:
                if (peso <= 5 || peso > 20) {
                    throw new IllegalArgumentException("Un pedido MEDIANO debe pesar mas de 5 kg y hasta 20 kg");
                }
                break;
            case GRANDE:
                if (peso <= 20) {
                    throw new IllegalArgumentException("Un pedido GRANDE debe pesar mas de 20 kg");
                }
                break;
            default:
                throw new IllegalArgumentException("Tamano de pedido no valido");
        }
    }

    private void validarTipoCobro(Pedido pedido) {
        if (pedido.getTipoCobro() == null) {
            throw new IllegalArgumentException("El tipo de cobro no puede ser null");
        }
    }
}


