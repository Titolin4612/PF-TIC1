package com.example.backend.service;

import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.backend.entity.TipoCobro;
import com.example.backend.entity.TipoTamano;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.repository.PedidoRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

@Service
public class StripeService {

    private static final Set<String> ZONAS_PERMITIDAS = Set.of(
            "medellin",
            "itagui",
            "envigado",
            "bello",
            "sabaneta");
    private static final Map<String, Long> COSTO_BASE_POR_ZONA = Map.of(
            "medellin", 13000L,
            "itagui", 15000L,
            "envigado", 18000L,
            "bello", 23000L,
            "sabaneta", 25000L);
    private static final long RECARGO_PRIORITARIO = 10000L;
    private static final ConcurrentHashMap<String, Object> CONFIRMATION_LOCKS = new ConcurrentHashMap<>();

    private final String secretKey;
    private final String successUrl;
    private final String cancelUrl;
    private final PedidoService pedidoService;
    private final PedidoRepository pedidoRepository;

    public StripeService(
            @Value("${stripe.secret-key:}") String secretKey,
            @Value("${stripe.success-url:http://localhost:5173/pago-exitoso?session_id={CHECKOUT_SESSION_ID}}") String successUrl,
            @Value("${stripe.cancel-url:http://localhost:5173/pago-cancelado}") String cancelUrl,
            PedidoService pedidoService,
            PedidoRepository pedidoRepository) {
        this.secretKey = secretKey;
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.pedidoService = pedidoService;
        this.pedidoRepository = pedidoRepository;
    }

    public String crearCheckout(CheckoutPedido pedido) {
        validarConfiguracionStripe();
        validarPedidoCheckout(pedido);
        long monto = calcularCostoDomicilio(pedido.zona(), pedido.prioritario());
        long montoEnCentavos = monto * 100;

        Stripe.apiKey = secretKey;

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .putMetadata("direccionEntrega", pedido.direccionEntrega())
                .putMetadata("zona", pedido.zona())
                .putMetadata("peso", pedido.peso().toString())
                .putMetadata("tamano", pedido.tamano().name())
                .putMetadata("fragil", pedido.fragil().toString())
                .putMetadata("tipoCobro", pedido.tipoCobro().name())
                .putMetadata("prioritario", pedido.prioritario().toString())
                .putMetadata("clienteEmail", pedido.clienteEmail())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("cop")
                                                .setUnitAmount(montoEnCentavos)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Pago de prueba pedido")
                                                                .build())
                                                .build())
                                .build())
                .build();

        try {
            Session session = Session.create(params);
            return session.getUrl();
        } catch (StripeException ex) {
            throw new IllegalStateException("No fue posible crear la sesion de Stripe Checkout", ex);
        }
    }

    public Map<String, Object> verificarPago(String sessionId) {
        validarConfiguracionStripe();
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("El session_id es obligatorio");
        }

        Stripe.apiKey = secretKey;

        try {
            Session session = Session.retrieve(sessionId);
            if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
                Map<String, String> metadata = session.getMetadata() == null ? Map.of() : session.getMetadata();
                return Map.of(
                        "status", "success",
                        "metadata", metadata);
            }
            return Map.of("status", "failed");
        } catch (StripeException ex) {
            throw new IllegalStateException("No fue posible verificar el pago en Stripe", ex);
        }
    }

    public Map<String, Object> confirmarPagoYCrearPedido(String sessionId) {
        validarConfiguracionStripe();
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("El session_id es obligatorio");
        }
        Object lock = CONFIRMATION_LOCKS.computeIfAbsent(sessionId, key -> new Object());
        synchronized (lock) {
            Pedido pedidoExistente = pedidoRepository.findByStripeSessionId(sessionId).orElse(null);
            if (pedidoExistente != null) {
                return Map.of(
                        "status", "success",
                        "alreadyCreated", true,
                        "pedidoId", pedidoExistente.getId());
            }

            Stripe.apiKey = secretKey;
            try {
                Session session = Session.retrieve(sessionId);
                if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
                    return Map.of("status", "failed");
                }

                Map<String, String> metadata = session.getMetadata() == null ? Map.of() : session.getMetadata();
                Pedido pedido = pedidoDesdeMetadata(metadata);
                Pedido creado;
                try {
                    creado = pedidoService.crearPedidoPagadoDesdeStripe(pedido, metadata.get("clienteEmail"), sessionId);
                } catch (DataIntegrityViolationException ex) {
                    // Peticion duplicada/concurrente del mismo session_id: devolvemos el ya creado.
                    Pedido existente = pedidoRepository.findByStripeSessionId(sessionId)
                            .orElseThrow(() -> ex);
                    return Map.of(
                            "status", "success",
                            "alreadyCreated", true,
                            "pedidoId", existente.getId());
                }

                return Map.of(
                        "status", "success",
                        "alreadyCreated", false,
                        "pedidoId", creado.getId());
            } catch (StripeException ex) {
                throw new IllegalStateException("No fue posible confirmar el pago en Stripe", ex);
            }
        }
    }

    private void validarPedidoCheckout(CheckoutPedido pedido) {
        if (pedido == null) {
            throw new IllegalArgumentException("El pedido es obligatorio");
        }
        if (pedido.direccionEntrega() == null || pedido.direccionEntrega().isBlank()) {
            throw new IllegalArgumentException("La direccionEntrega es obligatoria");
        }
        if (pedido.zona() == null || pedido.zona().isBlank()) {
            throw new IllegalArgumentException("La zona es obligatoria");
        }
        if (pedido.peso() == null || pedido.peso() <= 0) {
            throw new IllegalArgumentException("El peso debe ser mayor que 0");
        }
        if (pedido.tamano() == null) {
            throw new IllegalArgumentException("El tamano es obligatorio");
        }
        if (pedido.tipoCobro() == null) {
            throw new IllegalArgumentException("El tipoCobro es obligatorio");
        }
        if (pedido.tipoCobro() != TipoCobro.PAGO_WEB) {
            throw new IllegalArgumentException("Para checkout Stripe el tipoCobro debe ser PAGO_WEB");
        }
        if (pedido.fragil() == null) {
            throw new IllegalArgumentException("El campo fragil es obligatorio");
        }
        if (pedido.prioritario() == null) {
            throw new IllegalArgumentException("El campo prioritario es obligatorio");
        }
        if (pedido.clienteEmail() == null || pedido.clienteEmail().isBlank()) {
            throw new IllegalArgumentException("El clienteEmail es obligatorio para checkout");
        }
        String zonaNormalizada = pedido.zona().trim().toLowerCase(Locale.ROOT);
        if (!ZONAS_PERMITIDAS.contains(zonaNormalizada)) {
            throw new IllegalArgumentException("Zona invalida. Zonas permitidas: medellin, itagui, envigado, bello, sabaneta");
        }
    }

    private Pedido pedidoDesdeMetadata(Map<String, String> metadata) {
        String direccionEntrega = metadata.get("direccionEntrega");
        String zona = metadata.get("zona");
        String peso = metadata.get("peso");
        String tamano = metadata.get("tamano");
        String fragil = metadata.get("fragil");
        String tipoCobro = metadata.get("tipoCobro");
        String prioritario = metadata.get("prioritario");
        String clienteEmail = metadata.get("clienteEmail");

        if (direccionEntrega == null || direccionEntrega.isBlank()
                || zona == null || zona.isBlank()
                || peso == null || peso.isBlank()
                || tamano == null || tamano.isBlank()
                || fragil == null || fragil.isBlank()
                || tipoCobro == null || tipoCobro.isBlank()
                || prioritario == null || prioritario.isBlank()
                || clienteEmail == null || clienteEmail.isBlank()) {
            throw new IllegalArgumentException("Metadata incompleta para crear el pedido");
        }

        Pedido pedido = new Pedido();
        pedido.setDireccionEntrega(direccionEntrega);
        pedido.setEstado(EstadoPedido.CREADO);
        pedido.setZona(zona);
        pedido.setPeso(Double.valueOf(peso));
        pedido.setTamano(TipoTamano.valueOf(tamano));
        pedido.setFragil(Boolean.valueOf(fragil));
        pedido.setTipoCobro(normalizarTipoCobroParaPersistencia(tipoCobro));
        pedido.setPrioritario(Boolean.valueOf(prioritario));
        return pedido;
    }

    private TipoCobro normalizarTipoCobroParaPersistencia(String tipoCobro) {
        TipoCobro cobro = TipoCobro.valueOf(tipoCobro);
        if (cobro == TipoCobro.PAGO_WEB) {
            // Mantiene compatibilidad con esquemas MySQL donde el enum fisico aun no incluye PAGO_WEB.
            return TipoCobro.WEB;
        }
        return cobro;
    }

    private long calcularCostoDomicilio(String zona, Boolean prioritario) {
        String zonaNormalizada = zona.trim().toLowerCase(Locale.ROOT);
        Long costoBase = COSTO_BASE_POR_ZONA.get(zonaNormalizada);
        if (costoBase == null) {
            throw new IllegalArgumentException("Zona invalida. No se puede calcular costo de domicilio");
        }
        return Boolean.TRUE.equals(prioritario) ? costoBase + RECARGO_PRIORITARIO : costoBase;
    }

    private void validarConfiguracionStripe() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalArgumentException("Configura STRIPE_SECRET_KEY para usar pagos web");
        }
    }

    public record CheckoutPedido(
            String direccionEntrega,
            String zona,
            Double peso,
            TipoTamano tamano,
            Boolean fragil,
            TipoCobro tipoCobro,
            Boolean prioritario,
            String clienteEmail) {
    }
}
