package com.example.backend.security;

import com.example.backend.entity.Rol;
import com.example.backend.entity.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        setPrivateField(jwtService, "jwtSecret", "4f8d7b0f6bba4a6aa9a91ce2f0875b8f4f8d7b0f6bba4a6aa9a91ce2f0875b8f");
        setPrivateField(jwtService, "expirationMs", 60_000L);
    }

    @Test
    void generarToken_andExtraerClaims_workForValidUser() {
        Usuario usuario = new Usuario();
        usuario.setEmail("test@example.com");
        usuario.setRol(Rol.GERENTE);

        String token = jwtService.generarToken(usuario);

        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extraerUsername(token));
        assertEquals("GERENTE", jwtService.extraerRol(token));
    }

    @Test
    void esTokenValido_returnsTrueForMatchingUser() {
        Usuario usuario = new Usuario();
        usuario.setEmail("match@example.com");
        usuario.setRol(Rol.CLIENTE);

        String token = jwtService.generarToken(usuario);
        UserDetails userDetails = new User("match@example.com", "pwd", List.of());

        assertTrue(jwtService.esTokenValido(token, userDetails));
    }

    @Test
    void esTokenValido_returnsFalseWhenUsernameDoesNotMatch() {
        Usuario usuario = new Usuario();
        usuario.setEmail("owner@example.com");
        usuario.setRol(Rol.REPARTIDOR);

        String token = jwtService.generarToken(usuario);
        UserDetails anotherUser = new User("other@example.com", "pwd", List.of());

        assertFalse(jwtService.esTokenValido(token, anotherUser));
    }

    @Test
    void esTokenValido_returnsFalseWhenTokenExpired() throws Exception {
        setPrivateField(jwtService, "expirationMs", -1L);

        Usuario usuario = new Usuario();
        usuario.setEmail("expired@example.com");
        usuario.setRol(Rol.GERENTE);

        String token = jwtService.generarToken(usuario);
        UserDetails userDetails = new User("expired@example.com", "pwd", List.of());

        assertFalse(jwtService.esTokenValido(token, userDetails));
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
