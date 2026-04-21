package com.example.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.LocalDateTime;
import java.util.List;
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

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> manejarValidacionNegocio(IllegalArgumentException ex) {
        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "BAD_REQUEST",
                "mensaje", ex.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> manejarValidacionRequest(MethodArgumentNotValidException ex) {
        List<String> detalles = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatearErrorCampo)
                .toList();

        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "BAD_REQUEST",
                "mensaje", "Error de validacion en el request",
                "detalles", detalles
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> manejarJsonInvalido(HttpMessageNotReadableException ex) {
        String causa = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "BAD_REQUEST",
                "mensaje", "JSON invalido o enum no reconocido",
                "detalles", causa
        );
    }

    private String formatearErrorCampo(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

}
