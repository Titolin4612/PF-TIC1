package com.example.backend.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.dto.TipoVehiculo;
import com.example.backend.entity.Rol;
import com.example.backend.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByRol(Rol rol);

    List<Usuario> findByRolAndDisponibleTrueOrderByIdAsc(Rol rol);

    List<Usuario> findByRolAndTipoVehiculoAndDisponibleTrueOrderByIdAsc(Rol rol, TipoVehiculo tipoVehiculo);
}
