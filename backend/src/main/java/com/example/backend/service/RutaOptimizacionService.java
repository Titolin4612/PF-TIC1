package com.example.backend.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.backend.dto.RutaVehiculoResponse;
import com.example.backend.dto.RutasOptimizadasResponse;
import com.example.backend.dto.TipoVehiculo;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.entity.Rol;
import com.example.backend.entity.TipoTamano;
import com.example.backend.entity.Usuario;
import com.example.backend.repository.PedidoRepository;
import com.example.backend.repository.UsuarioRepository;

@Service
public class RutaOptimizacionService {

    private static final String BASE_DIRECCION = "Cq. 1 #70-01";
    private static final int CAPACIDAD_MOTO = 3;
    private static final int CAPACIDAD_CAMION = 10;
    private static final double PESO_MAXIMO_MOTO = 5.0;
    private static final GeoPoint BASE_COORDENADAS = new GeoPoint(6.2442, -75.5906);

    private static final Map<String, GeoPoint> COORDENADAS_ZONA = Map.of(
            "medellin", new GeoPoint(6.2442, -75.5812),
            "itagui", new GeoPoint(6.1849, -75.5993),
            "envigado", new GeoPoint(6.1752, -75.5849),
            "sabaneta", new GeoPoint(6.1513, -75.6169),
            "bello", new GeoPoint(6.3367, -75.5577)
    );

    private static final Map<String, GeoPoint> COORDENADAS_SECTOR_MEDELLIN = Map.of(
            "laureles", new GeoPoint(6.2442, -75.5906),
            "upb", new GeoPoint(6.2442, -75.5906),
            "belen", new GeoPoint(6.2255, -75.5986),
            "poblado", new GeoPoint(6.2088, -75.5672),
            "el poblado", new GeoPoint(6.2088, -75.5672)
    );

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    public RutaOptimizacionService(PedidoRepository pedidoRepository, UsuarioRepository usuarioRepository) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public RutasOptimizadasResponse generarRutasOptimizadas() {
        List<Pedido> pedidos = pedidoRepository.findByEstadoIn(List.of(
                EstadoPedido.CREADO,
                EstadoPedido.EN_PREPARACION
        ));

        List<Pedido> prioritarios = pedidos.stream()
                .filter(pedido -> Boolean.TRUE.equals(pedido.getPrioritario()))
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .toList();
        List<Pedido> noPrioritarios = pedidos.stream()
                .filter(pedido -> !Boolean.TRUE.equals(pedido.getPrioritario()))
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .toList();

        List<VehiculoRuta> motos = new ArrayList<>();
        List<VehiculoRuta> camiones = new ArrayList<>();

        for (Pedido pedido : prioritarios) {
            if (puedeIrEnMoto(pedido)) {
                asignarPedido(motos, TipoVehiculo.MOTO, CAPACIDAD_MOTO, pedido);
            } else {
                asignarPedido(camiones, TipoVehiculo.CAMION, CAPACIDAD_CAMION, pedido);
            }
        }

        List<Pedido> restantes = new ArrayList<>();
        restantes.addAll(noPrioritarios);

        for (Pedido pedido : restantes) {
            if (debeIrEnCamion(pedido) || !asignarEnMotoExistente(motos, pedido)) {
                asignarPedido(camiones, TipoVehiculo.CAMION, CAPACIDAD_CAMION, pedido);
            }
        }

        List<Usuario> repartidoresMoto = usuarioRepository.findByRolAndTipoVehiculoOrderByIdAsc(
                Rol.REPARTIDOR,
                TipoVehiculo.MOTO);
        List<Usuario> repartidoresCamion = usuarioRepository.findByRolAndTipoVehiculoOrderByIdAsc(
                Rol.REPARTIDOR,
                TipoVehiculo.CAMION);

        List<RutaVehiculoResponse> rutas = new ArrayList<>();
        rutas.addAll(crearRespuestas(motos, repartidoresMoto));
        rutas.addAll(crearRespuestas(camiones, repartidoresCamion));

        return new RutasOptimizadasResponse(BASE_DIRECCION, rutas);
    }

    private void asignarPedido(
            List<VehiculoRuta> vehiculos,
            TipoVehiculo tipo,
            int capacidadMaxima,
            Pedido pedido) {
        VehiculoRuta vehiculo = vehiculos.stream()
                .filter(ruta -> ruta.tieneCapacidad())
                .findFirst()
                .orElseGet(() -> {
                    VehiculoRuta nuevo = new VehiculoRuta(tipo, capacidadMaxima, vehiculos.size() + 1);
                    vehiculos.add(nuevo);
                    return nuevo;
                });

        vehiculo.pedidos.add(pedido);
    }

    private boolean asignarEnMotoExistente(List<VehiculoRuta> motos, Pedido pedido) {
        if (!puedeIrEnMoto(pedido)) {
            return false;
        }

        return motos.stream()
                .filter(VehiculoRuta::tieneCapacidad)
                .findFirst()
                .map(moto -> {
                    moto.pedidos.add(pedido);
                    return true;
                })
                .orElse(false);
    }

    private List<RutaVehiculoResponse> crearRespuestas(List<VehiculoRuta> vehiculos, List<Usuario> repartidores) {
        List<RutaVehiculoResponse> respuestas = new ArrayList<>();

        for (int i = 0; i < vehiculos.size(); i++) {
            VehiculoRuta vehiculo = vehiculos.get(i);
            String repartidor = i < repartidores.size() ? repartidores.get(i).getEmail() : null;
            List<Pedido> pedidosOrdenados = ordenarPorVecinoMasCercano(vehiculo.pedidos);
            respuestas.add(new RutaVehiculoResponse(
                    vehiculo.nombre(),
                    vehiculo.tipo,
                    repartidor,
                    vehiculo.capacidadMaxima,
                    pedidosOrdenados,
                    calcularDistanciaEstimada(pedidosOrdenados)));
        }

        return respuestas;
    }

    private List<Pedido> ordenarPorVecinoMasCercano(List<Pedido> pedidos) {
        List<Pedido> pendientes = new ArrayList<>(pedidos);
        List<Pedido> ruta = new ArrayList<>();
        GeoPoint actual = BASE_COORDENADAS;

        while (!pendientes.isEmpty()) {
            GeoPoint puntoActual = actual;
            boolean desdeBase = ruta.isEmpty();
            Pedido masCercano = pendientes.stream()
                    .min(Comparator
                            .comparingDouble((Pedido pedido) -> distanciaKm(
                                    puntoActual,
                                    desdeBase ? coordenadasInicialPedido(pedido) : coordenadasPedido(pedido)))
                            .thenComparing(pedido -> zonaNormalizada(pedido.getZona()))
                            .thenComparing(Pedido::getId))
                    .orElseThrow();
            ruta.add(masCercano);
            pendientes.remove(masCercano);
            actual = coordenadasPedido(masCercano);
        }

        return ruta;
    }

    private double calcularDistanciaEstimada(List<Pedido> pedidosOrdenados) {
        double total = 0.0;
        GeoPoint actual = BASE_COORDENADAS;

        for (Pedido pedido : pedidosOrdenados) {
            GeoPoint siguiente = coordenadasEstimacionPedido(pedido);
            total += distanciaKm(actual, siguiente);
            actual = siguiente;
        }

        return Math.round(total * 10.0) / 10.0;
    }

    private boolean puedeIrEnMoto(Pedido pedido) {
        return pedido.getTamano() == TipoTamano.PEQUENO
                && pedido.getPeso() != null
                && pedido.getPeso() <= PESO_MAXIMO_MOTO;
    }

    private boolean debeIrEnCamion(Pedido pedido) {
        return pedido.getTamano() == TipoTamano.MEDIANO
                || pedido.getTamano() == TipoTamano.GRANDE
                || pedido.getPeso() == null
                || pedido.getPeso() > PESO_MAXIMO_MOTO;
    }

    private GeoPoint coordenadasPedido(Pedido pedido) {
        String zona = zonaNormalizada(pedido.getZona());
        if (zona.isBlank()) {
            return BASE_COORDENADAS;
        }

        if ("medellin".equals(zona)) {
            GeoPoint puntoNomenclatura = inferirCoordenadasMedellin(pedido);
            if (puntoNomenclatura != null) {
                return puntoNomenclatura;
            }
        }

        return COORDENADAS_ZONA.getOrDefault(zona, BASE_COORDENADAS);
    }

    private GeoPoint coordenadasInicialPedido(Pedido pedido) {
        String texto = textoNormalizado(pedido.getDireccionEntrega() + " " + pedido.getZona());
        GeoPoint puntoNomenclatura = inferirCoordenadasMedellin(pedido);

        if (puntoNomenclatura != null) {
            return puntoNomenclatura;
        }

        return COORDENADAS_SECTOR_MEDELLIN.entrySet().stream()
                .filter(entry -> texto.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElseGet(() -> coordenadasPedido(pedido));
    }

    private GeoPoint inferirCoordenadasMedellin(Pedido pedido) {
        String texto = textoNormalizado(pedido.getDireccionEntrega() + " " + pedido.getZona());

        if (texto.matches(".*(calle|cl|c)\\s*33\\b.*")
                || texto.matches(".*(carrera|cra|kr|cr)\\s*7[0-6]\\b.*")) {
            return COORDENADAS_SECTOR_MEDELLIN.get("laureles");
        }

        if (texto.matches(".*(carrera|cra|kr|cr)\\s*43[a-z]?\\b.*")
                || texto.matches(".*(calle|cl|c)\\s*10\\b.*")) {
            return COORDENADAS_SECTOR_MEDELLIN.get("poblado");
        }

        if (texto.matches(".*(calle|cl|c)\\s*\\d+\\s*sur\\b.*")
                || texto.matches(".*(carrera|cra|kr|cr)\\s*8[0-9]\\b.*")) {
            return COORDENADAS_SECTOR_MEDELLIN.get("belen");
        }

        return null;
    }

    private GeoPoint coordenadasEstimacionPedido(Pedido pedido) {
        GeoPoint centroZona = coordenadasPedido(pedido);
        String semilla = pedido.getDireccionEntrega() + "-" + pedido.getId();
        GeoPoint desplazamiento = desplazamientoDeterministico(semilla);

        return new GeoPoint(
                centroZona.lat + desplazamiento.lat,
                centroZona.lng + desplazamiento.lng);
    }

    private GeoPoint desplazamientoDeterministico(String semilla) {
        int hash = semilla == null ? 0 : semilla.hashCode();
        double angulo = Math.toRadians(Math.floorMod(hash, 360));
        double radio = 0.006 + (Math.floorMod(hash, 1000) / 1000.0) * 0.018;

        return new GeoPoint(
                Math.cos(angulo) * radio,
                Math.sin(angulo) * radio);
    }

    private String zonaNormalizada(String zona) {
        if (zona == null) {
            return "";
        }

        return textoNormalizado(zona);
    }

    private String textoNormalizado(String texto) {
        if (texto == null) {
            return "";
        }

        String sinAcentos = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.trim().toLowerCase(Locale.ROOT);
    }

    private double distanciaKm(GeoPoint a, GeoPoint b) {
        double radioTierraKm = 6371.0;
        double dLat = Math.toRadians(b.lat - a.lat);
        double dLng = Math.toRadians(b.lng - a.lng);
        double latA = Math.toRadians(a.lat);
        double latB = Math.toRadians(b.lat);

        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(latA) * Math.cos(latB)
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        return radioTierraKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private record GeoPoint(double lat, double lng) {
    }

    private static class VehiculoRuta {
        private final TipoVehiculo tipo;
        private final int capacidadMaxima;
        private final int numero;
        private final List<Pedido> pedidos = new ArrayList<>();

        private VehiculoRuta(TipoVehiculo tipo, int capacidadMaxima, int numero) {
            this.tipo = tipo;
            this.capacidadMaxima = capacidadMaxima;
            this.numero = numero;
        }

        private boolean tieneCapacidad() {
            return pedidos.size() < capacidadMaxima;
        }

        private String nombre() {
            return tipo.name() + "-" + numero;
        }
    }
}
