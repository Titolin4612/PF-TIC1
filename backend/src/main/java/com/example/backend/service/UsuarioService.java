package com.example.backend.service;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.entity.Usuario;
import com.example.backend.entity.Rol;
import com.example.backend.dto.TipoVehiculo;
import com.example.backend.repository.UsuarioRepository;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario registrar(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        prepararPerfilOperativo(usuario);
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }

    public List<Usuario> listarRepartidores() {
        return usuarioRepository.findByRol(Rol.REPARTIDOR);
    }

    public Usuario actualizarPerfilRepartidor(
            String email,
            Boolean disponible,
            Double capacidadVehiculoKg,
            TipoVehiculo tipoVehiculo,
            String vehiculo,
            String placaVehiculo) {
        Usuario repartidor = buscarPorEmail(email.trim().toLowerCase());
        if (repartidor.getRol() != Rol.REPARTIDOR) {
            throw new IllegalArgumentException("El usuario seleccionado no tiene rol de repartidor");
        }

        if (disponible != null) {
            repartidor.setDisponible(disponible);
        }
        if (capacidadVehiculoKg != null) {
            if (capacidadVehiculoKg <= 0) {
                throw new IllegalArgumentException("La capacidad del vehiculo debe ser mayor que 0");
            }
            repartidor.setCapacidadVehiculoKg(capacidadVehiculoKg);
        }
        if (tipoVehiculo != null) {
            repartidor.setTipoVehiculo(tipoVehiculo);
            aplicarDefaultsPorTipoVehiculo(repartidor, false);
        }
        if (vehiculo != null) {
            repartidor.setVehiculo(vehiculo.trim());
        }
        if (placaVehiculo != null) {
            repartidor.setPlacaVehiculo(placaVehiculo.trim().toUpperCase());
        }

        return usuarioRepository.save(repartidor);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = buscarPorEmail(username);
        return new User(
                usuario.getEmail(),
                usuario.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name())));
    }

    private void prepararPerfilOperativo(Usuario usuario) {
        if (usuario.getEmail() != null) {
            usuario.setEmail(usuario.getEmail().trim().toLowerCase());
        }

        if (usuario.getRol() != Rol.REPARTIDOR) {
            usuario.setDisponible(null);
            usuario.setCapacidadVehiculoKg(null);
            usuario.setVehiculo(null);
            usuario.setPlacaVehiculo(null);
            return;
        }

        if (usuario.getDisponible() == null) {
            usuario.setDisponible(true);
        }
        if (usuario.getTipoVehiculo() == null) {
            usuario.setTipoVehiculo(TipoVehiculo.MOTO);
        }
        aplicarDefaultsPorTipoVehiculo(usuario, true);
    }

    private void aplicarDefaultsPorTipoVehiculo(Usuario usuario, boolean completarCapacidad) {
        TipoVehiculo tipo = usuario.getTipoVehiculo() == null ? TipoVehiculo.MOTO : usuario.getTipoVehiculo();
        if (completarCapacidad && (usuario.getCapacidadVehiculoKg() == null || usuario.getCapacidadVehiculoKg() <= 0)) {
            usuario.setCapacidadVehiculoKg(tipo == TipoVehiculo.MOTO ? 25.0 : 120.0);
        }
        if (usuario.getVehiculo() == null || usuario.getVehiculo().isBlank()) {
            usuario.setVehiculo(tipo == TipoVehiculo.MOTO ? "Moto" : "Camion");
        }
    }
}
