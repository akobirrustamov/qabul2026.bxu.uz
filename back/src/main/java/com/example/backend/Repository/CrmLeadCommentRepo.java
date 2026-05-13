package com.example.backend.Repository;

import com.example.backend.Entity.CrmLeadComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadCommentRepo extends JpaRepository<CrmLeadComment, UUID> {

    // To'g'ri field nomi: crmLeadId (leadId emas)
    List<CrmLeadComment> findByCrmLeadIdOrderByCreatedAtAsc(UUID crmLeadId);

    // Kamayish tartibida (eng yangisi birinchi)
    List<CrmLeadComment> findByCrmLeadIdOrderByCreatedAtDesc(UUID crmLeadId);

    // Commenter va date range bo'yicha
    List<CrmLeadComment> findByCommenterIdAndCreatedAtBetween(UUID commenterId, LocalDateTime start, LocalDateTime end);

    // Barcha commentlar date range bo'yicha
    List<CrmLeadComment> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

}