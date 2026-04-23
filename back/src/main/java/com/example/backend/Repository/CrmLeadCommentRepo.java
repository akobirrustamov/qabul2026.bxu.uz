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

}