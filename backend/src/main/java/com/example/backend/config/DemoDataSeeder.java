package com.example.backend.config;

import com.example.backend.dto.TipoVehiculo;
import com.example.backend.entity.EstadoPago;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;
import com.example.backend.entity.Rol;
import com.example.backend.entity.TipoCobro;
import com.example.backend.entity.TipoTamano;
import com.example.backend.entity.Usuario;
import com.example.backend.repository.PedidoRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            UsuarioRepository usuarioRepository,
            PedidoRepository pedidoRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        crearUsuarioDemo("Gerente Demo", "gerente@smartroute.com", Rol.GERENTE, null, null, null, null, null);
        crearUsuarioDemo("Cliente Demo", "cliente@smartroute.com", Rol.CLIENTE, null, null, null, null, null);
        crearUsuarioDemo("Moto Norte", "moto.norte@smartroute.com", Rol.REPARTIDOR, true, TipoVehiculo.MOTO, 25.0, "Moto Norte", "MOT-101");
        crearUsuarioDemo("Moto Sur", "moto.sur@smartroute.com", Rol.REPARTIDOR, true, TipoVehiculo.MOTO, 25.0, "Moto Sur", "MOT-202");
        crearUsuarioDemo("Camion Centro", "camion.centro@smartroute.com", Rol.REPARTIDOR, true, TipoVehiculo.CAMION, 120.0, "Camion Centro", "CAM-303");
        crearUsuarioDemo("Camion Reserva", "camion.reserva@smartroute.com", Rol.REPARTIDOR, false, TipoVehiculo.CAMION, 120.0, "Camion Reserva", "CAM-404");

        if (pedidoRepository.count() == 0) {
            crearPedidoDemo("Calle 33 #74-20, Laureles", "Medellin", 2.5, TipoTamano.PEQUENO, false, true, EstadoPedido.CREADO, null, 25, false);
            crearPedidoDemo("Carrera 43A #10-30, El Poblado", "Medellin", 4.0, TipoTamano.PEQUENO, true, true, EstadoPedido.EN_PREPARACION, "moto.norte@smartroute.com", 30, false);
            crearPedidoDemo("Calle 80 #45-12", "Bello", 8.0, TipoTamano.MEDIANO, false, false, EstadoPedido.EN_PREPARACION, "camion.centro@smartroute.com", 60, false);
            crearPedidoDemo("Carrera 52 #50-20", "Itagui", 22.0, TipoTamano.GRANDE, false, false, EstadoPedido.CREADO, null, 55, false);
            crearPedidoDemo("Calle 36 Sur #41-15", "Envigado", 3.0, TipoTamano.PEQUENO, true, false, EstadoPedido.EN_CAMINO, "moto.sur@smartroute.com", 40, true);
            crearPedidoDemo("Calle 75 Sur #34-22", "Sabaneta", 18.0, TipoTamano.MEDIANO, false, true, EstadoPedido.CREADO, null, 55, false);
            crearPedidoDemo("Calle 10 #32-80", "Medellin", 1.8, TipoTamano.PEQUENO, false, false, EstadoPedido.EN_PREPARACION, "moto.norte@smartroute.com", 35, false);
            crearPedidoDemo("Carrera 70 #48-25", "Medellin", 6.5, TipoTamano.MEDIANO, true, true, EstadoPedido.CREADO, null, 45, false);
        }
    }

    private void crearUsuarioDemo(
            String nombre,
            String email,
            Rol rol,
            Boolean disponible,
            TipoVehiculo tipoVehiculo,
            Double capacidadVehiculoKg,
            String vehiculo,
            String placaVehiculo) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseGet(Usuario::new);
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode("Demo1234"));
        usuario.setRol(rol);
        usuario.setDisponible(disponible);
        usuario.setTipoVehiculo(tipoVehiculo);
        usuario.setCapacidadVehiculoKg(capacidadVehiculoKg);
        usuario.setVehiculo(vehiculo);
        usuario.setPlacaVehiculo(placaVehiculo);
        usuarioRepository.save(usuario);
    }

    private void crearPedidoDemo(
            String direccion,
            String zona,
            double peso,
            TipoTamano tamano,
            boolean fragil,
            boolean prioritario,
            EstadoPedido estado,
            String repartidorEmail,
            int tiempoEstimadoMinutos,
            boolean retrasado) {
        Pedido pedido = new Pedido();
        pedido.setDireccionEntrega(direccion);
        pedido.setZona(zona);
        pedido.setPeso(peso);
        pedido.setTamano(tamano);
        pedido.setFragil(fragil);
        pedido.setPrioritario(prioritario);
        pedido.setEstado(estado);
        pedido.setTipoCobro(TipoCobro.CONTRA_ENTREGA);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        pedido.setClienteEmail("cliente@smartroute.com");
        pedido.setRepartidorEmail(repartidorEmail);
        pedido.setTiempoEstimadoMinutos(tiempoEstimadoMinutos);
        pedido.setCostoDomicilio(prioritario ? 23000.0 : 13000.0);
        pedido.setAlertaRetraso(retrasado);
        pedido.setMotivoAlerta(retrasado ? "La ruta supero el tiempo estimado de entrega" : null);
        if (repartidorEmail != null) {
            pedido.setFechaAsignacion(LocalDateTime.now().minusMinutes(retrasado ? tiempoEstimadoMinutos + 20L : 15L));
        }
        pedidoRepository.save(pedido);
    }
}
