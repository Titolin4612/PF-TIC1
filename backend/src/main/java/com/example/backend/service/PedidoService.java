package com.example.backend.service;

import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.backend.entity.EstadoPago;
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
            "itagui",
            "sabaneta"
    );

    private static final Map<String, Double> COSTO_BASE_POR_ZONA = Map.of(
            "medellin", 13000.0,
            "itagui", 15000.0,
            "envigado", 18000.0,
            "bello", 23000.0,
            "sabaneta", 25000.0
    );

    private static final double RECARGO_PRIORITARIO = 10000.0;

    private final PedidoRepository pedidoRepository;

    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    public Pedido crearPedido(Pedido pedido) {
        validarPedidoYPrepararCosto(pedido);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        return pedidoRepository.save(pedido);
    }

    public Pedido crearPedidoComoCliente(Pedido pedido, String clienteEmail) {
        pedido.setClienteEmail(normalizarEmail(clienteEmail));
        validarPedidoYPrepararCosto(pedido);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        return pedidoRepository.save(pedido);
    }

    public Pedido crearPedidoPagadoDesdeStripe(Pedido pedido, String clienteEmail, String stripeSessionId) {
        pedido.setClienteEmail(normalizarEmail(clienteEmail));
        validarPedidoYPrepararCosto(pedido);
        pedido.setEstadoPago(EstadoPago.PAGADO);
        pedido.setStripeSessionId(stripeSessionId);
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }

    public List<Pedido> listarPedidosCliente(String clienteEmail) {
        return pedidoRepository.findByClienteEmailOrClienteEmailIsNull(normalizarEmail(clienteEmail));
    }

    public List<Pedido> listarPedidosClienteAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("No hay usuario autenticado para listar pedidos");
        }
        return pedidoRepository.findByClienteEmailOrClienteEmailIsNull(normalizarEmail(authentication.getName()));
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

        validarPedidoYPrepararCosto(pedidoActualizado);

        pedido.setDireccionEntrega(pedidoActualizado.getDireccionEntrega());
        pedido.setEstado(pedidoActualizado.getEstado());
        pedido.setZona(pedidoActualizado.getZona());
        pedido.setPeso(pedidoActualizado.getPeso());
        pedido.setTamano(pedidoActualizado.getTamano());
        pedido.setFragil(pedidoActualizado.getFragil());
        pedido.setTipoCobro(pedidoActualizado.getTipoCobro());
        pedido.setPrioritario(pedidoActualizado.getPrioritario());
        pedido.setCostoDomicilio(pedidoActualizado.getCostoDomicilio());
        pedido.setRepartidorEmail(pedidoActualizado.getRepartidorEmail());
        if (pedido.getEstadoPago() == null) {
            pedido.setEstadoPago(EstadoPago.PENDIENTE);
        }

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

    private void validarPedidoYPrepararCosto(Pedido pedido) {
        validarZona(pedido.getZona());
        validarPeso(pedido.getPeso());
        validarTamanoVsPeso(pedido.getTamano(), pedido.getPeso());
        validarTipoCobro(pedido);
        pedido.setCostoDomicilio(calcularCostoDomicilio(pedido.getZona(), pedido.getPrioritario()));
    }

    private void validarZona(String zona) {
        if (zona == null || zona.isBlank()) {
            throw new IllegalArgumentException("La zona es obligatoria");
        }

        String zonaNormalizada = zona.trim().toLowerCase(Locale.ROOT);
        if (!ZONAS_AREA_METROPOLITANA.contains(zonaNormalizada)) {
            throw new IllegalArgumentException(
                    "Zona invalida. Zonas permitidas: medellin, itagui, envigado, bello, sabaneta");
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

    private double calcularCostoDomicilio(String zona, Boolean prioritario) {
        validarZona(zona);
        String zonaNormalizada = zona.trim().toLowerCase(Locale.ROOT);
        Double costoBase = COSTO_BASE_POR_ZONA.get(zonaNormalizada);
        if (costoBase == null) {
            throw new IllegalArgumentException("Zona invalida. No se puede calcular costo de domicilio");
        }
        return Boolean.TRUE.equals(prioritario) ? costoBase + RECARGO_PRIORITARIO : costoBase;
    }

    private String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email del cliente es obligatorio");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
