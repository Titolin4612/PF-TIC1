package com.example.backend.service;

import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.backend.entity.EstadoPago;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.entity.Rol;
import com.example.backend.entity.TipoTamano;
import com.example.backend.entity.Usuario;
import com.example.backend.exception.PedidoNoEncontradoException;
import com.example.backend.repository.PedidoRepository;
import com.example.backend.repository.UsuarioRepository;

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

    private static final Set<EstadoPedido> ESTADOS_CARGA_ACTIVA = Set.of(
            EstadoPedido.CREADO,
            EstadoPedido.EN_PREPARACION,
            EstadoPedido.EN_CAMINO
    );

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    public PedidoService(PedidoRepository pedidoRepository, UsuarioRepository usuarioRepository) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Pedido crearPedido(Pedido pedido) {
        validarPedidoYPrepararCosto(pedido);
        prepararSeguimientoLogistico(pedido);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        return pedidoRepository.save(pedido);
    }

    public Pedido crearPedidoComoCliente(Pedido pedido, String clienteEmail) {
        pedido.setClienteEmail(normalizarEmail(clienteEmail));
        validarPedidoYPrepararCosto(pedido);
        prepararSeguimientoLogistico(pedido);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        return pedidoRepository.save(pedido);
    }

    public Pedido crearPedidoPagadoDesdeStripe(Pedido pedido, String clienteEmail, String stripeSessionId) {
        pedido.setClienteEmail(normalizarEmail(clienteEmail));
        validarPedidoYPrepararCosto(pedido);
        prepararSeguimientoLogistico(pedido);
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
        actualizarSeguimientoPorEstado(pedido, nuevoEstado);
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
        pedido.setTiempoEstimadoMinutos(pedidoActualizado.getTiempoEstimadoMinutos());
        pedido.setAlertaRetraso(Boolean.TRUE.equals(pedidoActualizado.getAlertaRetraso()));
        pedido.setMotivoAlerta(pedidoActualizado.getMotivoAlerta());
        if (pedido.getEstadoPago() == null) {
            pedido.setEstadoPago(EstadoPago.PENDIENTE);
        }

        return pedidoRepository.save(pedido);
    }

    public Pedido asignarRepartidor(Long id, String repartidorEmail) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new PedidoNoEncontradoException("Pedido no encontrado"));
        Usuario repartidor = validarRepartidorDisponible(repartidorEmail);
        validarCapacidadDisponible(repartidor, pedido);

        pedido.setRepartidorEmail(repartidor.getEmail());
        pedido.setFechaAsignacion(LocalDateTime.now());
        if (pedido.getTiempoEstimadoMinutos() == null || pedido.getTiempoEstimadoMinutos() <= 0) {
            pedido.setTiempoEstimadoMinutos(calcularTiempoEstimadoMinutos(pedido));
        }
        pedido.setAlertaRetraso(false);
        pedido.setMotivoAlerta(null);
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

    private void prepararSeguimientoLogistico(Pedido pedido) {
        if (pedido.getEstado() == null) {
            pedido.setEstado(EstadoPedido.CREADO);
        }
        if (pedido.getTiempoEstimadoMinutos() == null || pedido.getTiempoEstimadoMinutos() <= 0) {
            pedido.setTiempoEstimadoMinutos(calcularTiempoEstimadoMinutos(pedido));
        }
        pedido.setAlertaRetraso(false);
        pedido.setMotivoAlerta(null);
    }

    private void actualizarSeguimientoPorEstado(Pedido pedido, EstadoPedido nuevoEstado) {
        if (nuevoEstado == EstadoPedido.ENTREGADO) {
            pedido.setFechaEntrega(LocalDateTime.now());
            evaluarAlertaRetraso(pedido);
            return;
        }

        if (pedido.getFechaAsignacion() != null
                && pedido.getTiempoEstimadoMinutos() != null
                && LocalDateTime.now().isAfter(pedido.getFechaAsignacion().plusMinutes(pedido.getTiempoEstimadoMinutos()))) {
            pedido.setAlertaRetraso(true);
            pedido.setMotivoAlerta("La ruta supero el tiempo estimado de entrega");
        }
    }

    private void evaluarAlertaRetraso(Pedido pedido) {
        if (pedido.getFechaAsignacion() == null
                || pedido.getFechaEntrega() == null
                || pedido.getTiempoEstimadoMinutos() == null) {
            pedido.setAlertaRetraso(false);
            pedido.setMotivoAlerta(null);
            return;
        }

        long minutosReales = Duration.between(pedido.getFechaAsignacion(), pedido.getFechaEntrega()).toMinutes();
        if (minutosReales > pedido.getTiempoEstimadoMinutos()) {
            pedido.setAlertaRetraso(true);
            pedido.setMotivoAlerta("Entrega tardia: " + minutosReales + " min reales vs "
                    + pedido.getTiempoEstimadoMinutos() + " min estimados");
        } else {
            pedido.setAlertaRetraso(false);
            pedido.setMotivoAlerta(null);
        }
    }

    private Usuario validarRepartidorDisponible(String repartidorEmail) {
        String emailNormalizado = normalizarEmail(repartidorEmail);
        Usuario repartidor = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new IllegalArgumentException("Repartidor no encontrado"));

        if (repartidor.getRol() != Rol.REPARTIDOR) {
            throw new IllegalArgumentException("El usuario seleccionado no tiene rol de repartidor");
        }
        if (Boolean.FALSE.equals(repartidor.getDisponible())) {
            throw new IllegalArgumentException("El repartidor no esta disponible en flota");
        }
        return repartidor;
    }

    private void validarCapacidadDisponible(Usuario repartidor, Pedido pedido) {
        Double capacidad = repartidor.getCapacidadVehiculoKg();
        if (capacidad == null || capacidad <= 0) {
            return;
        }

        double cargaActiva = pedidoRepository
                .findByRepartidorEmailAndEstadoIn(repartidor.getEmail(), ESTADOS_CARGA_ACTIVA)
                .stream()
                .filter(p -> !p.getId().equals(pedido.getId()))
                .map(Pedido::getPeso)
                .filter(peso -> peso != null && peso > 0)
                .mapToDouble(Double::doubleValue)
                .sum();
        double pesoNuevo = pedido.getPeso() == null ? 0 : pedido.getPeso();

        if (cargaActiva + pesoNuevo > capacidad) {
            throw new IllegalArgumentException("Capacidad insuficiente. Carga activa: "
                    + cargaActiva + " kg, pedido: " + pesoNuevo + " kg, capacidad: " + capacidad + " kg");
        }
    }

    private int calcularTiempoEstimadoMinutos(Pedido pedido) {
        String zona = pedido.getZona() == null ? "" : pedido.getZona().trim().toLowerCase(Locale.ROOT);
        int base = switch (zona) {
            case "medellin" -> 35;
            case "itagui", "envigado" -> 45;
            case "bello" -> 55;
            case "sabaneta" -> 60;
            default -> 50;
        };

        if (Boolean.TRUE.equals(pedido.getPrioritario())) {
            base -= 10;
        }
        if (Boolean.TRUE.equals(pedido.getFragil())) {
            base += 10;
        }
        if (pedido.getTamano() == TipoTamano.GRANDE) {
            base += 15;
        } else if (pedido.getTamano() == TipoTamano.MEDIANO) {
            base += 5;
        }
        return Math.max(base, 20);
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
