package com.example.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PedidoNoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> manejarPedidoNoEncontrado(PedidoNoEncontradoException ex) {
        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "NOT_FOUND",
                "mensaje", ex.getMessage()
        );
    }
}