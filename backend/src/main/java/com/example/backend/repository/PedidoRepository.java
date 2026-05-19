package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.Optional;
import java.util.List;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEstado(EstadoPedido estado);

    List<Pedido> findByEstadoIn(Collection<EstadoPedido> estados);

    List<Pedido> findByClienteEmail(String clienteEmail);

    List<Pedido> findByClienteEmailOrClienteEmailIsNull(String clienteEmail);

    List<Pedido> findByRepartidorEmail(String repartidorEmail);

    List<Pedido> findByRepartidorEmailAndEstadoIn(String repartidorEmail, Collection<EstadoPedido> estados);

    Optional<Pedido> findByStripeSessionId(String stripeSessionId);
}



