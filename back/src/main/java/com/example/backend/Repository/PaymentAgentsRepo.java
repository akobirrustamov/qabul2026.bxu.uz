package com.example.backend.Repository;

import com.example.backend.DTO.PaymentAgentsDTO;
import com.example.backend.Entity.PaymentAgents;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentAgentsRepo extends JpaRepository<PaymentAgents, UUID> {

    void save(PaymentAgentsDTO dto);

    @Query(value = "select * from payment_agent where user_id=:agentId",  nativeQuery = true)
    List<PaymentAgents> findByAgentId(UUID agentId);

    void deleteByAbuturient_Id(UUID abuturientId);

    Optional<PaymentAgents> findByAbuturientId(UUID abuturientId);

    Optional<PaymentAgents> findByAbuturient_IdAndUser_Id(UUID abuturientId, UUID userId);
}
