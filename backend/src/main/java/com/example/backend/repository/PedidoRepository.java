package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.backend.entity.EstadoPedido;
import com.example.backend.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEstado(EstadoPedido estado);
    
}



