package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEstado(EstadoPedido estado);

    List<Pedido> findByClienteEmail(String clienteEmail);

    List<Pedido> findByClienteEmailOrClienteEmailIsNull(String clienteEmail);

    List<Pedido> findByRepartidorEmail(String repartidorEmail);

    Optional<Pedido> findByStripeSessionId(String stripeSessionId);
}



