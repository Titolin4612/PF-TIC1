package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.dto.TipoVehiculo;
import com.example.backend.entity.Rol;
import com.example.backend.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByRolAndTipoVehiculoOrderByIdAsc(Rol rol, TipoVehiculo tipoVehiculo);
}
