package com.example.backend.service;

import com.example.backend.dto.GeoStopRequest;
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
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class RutaOptimizacionService {

    private static final String BASE_DIRECCION = "Cq. 1 #70-01";
    private static final int CAPACIDAD_PEDIDOS_MOTO = 3;
    private static final int CAPACIDAD_PEDIDOS_CAMION = 10;
    private static final double PESO_MAXIMO_MOTO = 5.0;
    private static final double CAPACIDAD_KG_MOTO = 25.0;
    private static final double CAPACIDAD_KG_CAMION = 120.0;
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
    private final OsrmService osrmService;

    public RutaOptimizacionService(
            PedidoRepository pedidoRepository,
            UsuarioRepository usuarioRepository,
            OsrmService osrmService) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.osrmService = osrmService;
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
        List<Pedido> normales = pedidos.stream()
                .filter(pedido -> !Boolean.TRUE.equals(pedido.getPrioritario()))
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .toList();

        List<VehiculoRuta> motos = new ArrayList<>();
        List<VehiculoRuta> camiones = new ArrayList<>();

        for (Pedido pedido : prioritarios) {
            if (puedeIrEnMoto(pedido)) {
                asignarPedido(motos, TipoVehiculo.MOTO, CAPACIDAD_PEDIDOS_MOTO, CAPACIDAD_KG_MOTO, pedido);
            } else {
                asignarPedido(camiones, TipoVehiculo.CAMION, CAPACIDAD_PEDIDOS_CAMION, CAPACIDAD_KG_CAMION, pedido);
            }
        }

        for (Pedido pedido : normales) {
            if (debeIrEnCamion(pedido) || !asignarEnMotoExistente(motos, pedido)) {
                asignarPedido(camiones, TipoVehiculo.CAMION, CAPACIDAD_PEDIDOS_CAMION, CAPACIDAD_KG_CAMION, pedido);
            }
        }

        List<Usuario> repartidoresMoto = usuarioRepository.findByRolAndTipoVehiculoAndDisponibleTrueOrderByIdAsc(
                Rol.REPARTIDOR,
                TipoVehiculo.MOTO);
        List<Usuario> repartidoresCamion = usuarioRepository.findByRolAndTipoVehiculoAndDisponibleTrueOrderByIdAsc(
                Rol.REPARTIDOR,
                TipoVehiculo.CAMION);

        List<RutaVehiculoResponse> rutas = new ArrayList<>();
        rutas.addAll(crearRespuestas(motos, repartidoresMoto));
        rutas.addAll(crearRespuestas(camiones, repartidoresCamion));

        List<Pedido> pedidosAsignados = rutas.stream()
                .filter(ruta -> ruta.repartidor() != null)
                .flatMap(ruta -> ruta.pedidosAsignados().stream())
                .toList();
        if (!pedidosAsignados.isEmpty()) {
            pedidoRepository.saveAll(pedidosAsignados);
        }

        return new RutasOptimizadasResponse(BASE_DIRECCION, rutas);
    }

    private void asignarPedido(
            List<VehiculoRuta> vehiculos,
            TipoVehiculo tipo,
            int capacidadMaxima,
            double capacidadKg,
            Pedido pedido) {
        VehiculoRuta vehiculo = vehiculos.stream()
                .filter(ruta -> ruta.tieneCapacidadPara(pedido))
                .findFirst()
                .orElseGet(() -> {
                    VehiculoRuta nuevo = new VehiculoRuta(tipo, capacidadMaxima, capacidadKg, vehiculos.size() + 1);
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
                .filter(ruta -> ruta.tieneCapacidadPara(pedido))
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
            Usuario repartidor = i < repartidores.size() ? repartidores.get(i) : null;
            RutaCalculada rutaCalculada = calcularRutaVehiculo(vehiculo.pedidos);
            List<Pedido> pedidosOrdenados = rutaCalculada.pedidosOrdenados();
            asignarRepartidorSiExiste(pedidosOrdenados, repartidor);
            String nombreVehiculo = repartidor != null && repartidor.getVehiculo() != null && !repartidor.getVehiculo().isBlank()
                    ? repartidor.getVehiculo()
                    : vehiculo.nombre();
            double capacidadKg = repartidor != null && repartidor.getCapacidadVehiculoKg() != null
                    ? repartidor.getCapacidadVehiculoKg()
                    : vehiculo.capacidadKg;
            List<GeoStopRequest> paradas = crearParadas(pedidosOrdenados);

            respuestas.add(new RutaVehiculoResponse(
                    nombreVehiculo,
                    vehiculo.tipo,
                    repartidor == null ? null : repartidor.getEmail(),
                    vehiculo.capacidadMaxima,
                    capacidadKg,
                    vehiculo.cargaKg(),
                    pedidosOrdenados,
                    paradas,
                    crearRouteGeometry(paradas),
                    rutaCalculada.distanciaEstimada()));
        }

        return respuestas;
    }

    private void asignarRepartidorSiExiste(List<Pedido> pedidos, Usuario repartidor) {
        if (repartidor == null) {
            return;
        }

        LocalDateTime fechaAsignacion = LocalDateTime.now();
        for (Pedido pedido : pedidos) {
            pedido.setRepartidorEmail(repartidor.getEmail());
            if (pedido.getFechaAsignacion() == null) {
                pedido.setFechaAsignacion(fechaAsignacion);
            }
            pedido.setAlertaRetraso(false);
            pedido.setMotivoAlerta(null);
        }
    }

    private List<GeoStopRequest> crearParadas(List<Pedido> pedidosOrdenados) {
        return pedidosOrdenados.stream()
                .map(pedido -> {
                    GeoPoint coordenadas = coordenadasEstimacionPedido(pedido);
                    return new GeoStopRequest(
                            pedido.getId(),
                            coordenadas.lat(),
                            coordenadas.lng(),
                            pedido.getDireccionEntrega(),
                            "#" + pedido.getId() + " - " + (pedido.getZona() == null ? "Sin zona" : pedido.getZona()),
                            Boolean.TRUE.equals(pedido.getPrioritario()),
                            pedido.getPeso(),
                            pedido.getFragil(),
                            pedido.getTiempoEstimadoMinutos());
                })
                .toList();
    }

    private List<double[]> crearRouteGeometry(List<GeoStopRequest> paradas) {
        if (paradas.isEmpty()) {
            return List.of();
        }

        List<double[]> geometry = osrmService.getRouteGeometry(crearParadasConBase(paradas));
        if (geometry == null || geometry.size() < 2) {
            return List.of();
        }

        return geometry;
    }

    private RutaCalculada calcularRutaVehiculo(List<Pedido> pedidos) {
        RutaCalculada rutaPorCalles = calcularRutaPorCalles(pedidos);
        if (rutaPorCalles != null) {
            return rutaPorCalles;
        }

        List<Pedido> pedidosOrdenados = ordenarPorVecinoMasCercano(pedidos);
        return new RutaCalculada(pedidosOrdenados, calcularDistanciaEstimada(pedidosOrdenados));
    }

    private RutaCalculada calcularRutaPorCalles(List<Pedido> pedidos) {
        if (pedidos.isEmpty()) {
            return new RutaCalculada(List.of(), 0);
        }

        List<GeoStopRequest> routeStops = crearParadasConBase(crearParadas(pedidos));
        RouteCostMatrix costMatrix = osrmService.getRouteCostMatrix(routeStops);
        if (costMatrix == null || costMatrix.weightedDurationSeconds().length != routeStops.size()) {
            return null;
        }

        double[][] weightedDurationMatrix = costMatrix.weightedDurationSeconds();
        double[][] distanceMatrix = costMatrix.distanceMeters();
        List<Integer> pendientes = new ArrayList<>();
        for (int i = 1; i < routeStops.size(); i++) {
            pendientes.add(i);
        }

        List<Pedido> pedidosOrdenados = new ArrayList<>();
        int actual = 0;
        double totalMetros = 0.0;

        while (!pendientes.isEmpty()) {
            int posicionMasCercana = 0;
            double costoMasCercano = valorMatriz(weightedDurationMatrix, actual, pendientes.get(0));

            for (int i = 1; i < pendientes.size(); i++) {
                double costo = valorMatriz(weightedDurationMatrix, actual, pendientes.get(i));
                if (costo < costoMasCercano) {
                    costoMasCercano = costo;
                    posicionMasCercana = i;
                }
            }

            int siguiente = pendientes.remove(posicionMasCercana);
            totalMetros += valorMatriz(distanceMatrix, actual, siguiente);
            pedidosOrdenados.add(pedidos.get(siguiente - 1));
            actual = siguiente;
        }

        return new RutaCalculada(pedidosOrdenados, Math.round(totalMetros / 100.0) / 10.0);
    }

    private double valorMatriz(double[][] matrix, int desde, int hasta) {
        if (desde >= matrix.length || hasta >= matrix[desde].length) {
            return Double.POSITIVE_INFINITY;
        }
        double value = matrix[desde][hasta];
        return Double.isFinite(value) && value >= 0 ? value : Double.POSITIVE_INFINITY;
    }

    private List<GeoStopRequest> crearParadasConBase(List<GeoStopRequest> paradas) {
        List<GeoStopRequest> routeStops = new ArrayList<>();
        routeStops.add(new GeoStopRequest(
                0L,
                BASE_COORDENADAS.lat(),
                BASE_COORDENADAS.lng(),
                BASE_DIRECCION,
                "Base de despacho",
                false,
                null,
                false,
                null));
        routeStops.addAll(paradas);
        return routeStops;
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
        GeoPoint desplazamiento = desplazamientoDeterministico(pedido.getDireccionEntrega() + "-" + pedido.getId());

        return new GeoPoint(
                centroZona.lat + desplazamiento.lat,
                centroZona.lng + desplazamiento.lng);
    }

    private GeoPoint desplazamientoDeterministico(String semilla) {
        int hash = semilla == null ? 0 : semilla.hashCode();
        double angulo = Math.toRadians(Math.floorMod(hash, 360));
        double radio = 0.0015 + (Math.floorMod(hash, 1000) / 1000.0) * 0.0045;

        return new GeoPoint(Math.cos(angulo) * radio, Math.sin(angulo) * radio);
    }

    private String zonaNormalizada(String zona) {
        return textoNormalizado(zona);
    }

    private String textoNormalizado(String texto) {
        if (texto == null) {
            return "";
        }

        String sinAcentos = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\b(\\d+)\\s*a\\s+sur\\b", "$1 sur")
                .replaceAll("\\b(\\d+)a\\s+sur\\b", "$1 sur")
                .replaceAll("\\b(\\d+)\\s*a\\s+norte\\b", "$1 norte")
                .replaceAll("\\b(\\d+)a\\s+norte\\b", "$1 norte")
                .replaceAll("\\s+a\\s+", " ")
                .replaceAll("\\s+", " ");
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

    private record RutaCalculada(List<Pedido> pedidosOrdenados, double distanciaEstimada) {
    }

    private static class VehiculoRuta {
        private final TipoVehiculo tipo;
        private final int capacidadMaxima;
        private final double capacidadKg;
        private final int numero;
        private final List<Pedido> pedidos = new ArrayList<>();

        private VehiculoRuta(TipoVehiculo tipo, int capacidadMaxima, double capacidadKg, int numero) {
            this.tipo = tipo;
            this.capacidadMaxima = capacidadMaxima;
            this.capacidadKg = capacidadKg;
            this.numero = numero;
        }

        private boolean tieneCapacidadPara(Pedido pedido) {
            return pedidos.size() < capacidadMaxima
                    && cargaKg() + (pedido.getPeso() == null ? 0 : pedido.getPeso()) <= capacidadKg;
        }

        private double cargaKg() {
            return pedidos.stream()
                    .map(Pedido::getPeso)
                    .filter(peso -> peso != null && peso > 0)
                    .mapToDouble(Double::doubleValue)
                    .sum();
        }

        private String nombre() {
            return tipo.name() + "-" + numero;
        }
    }
}
