package com.example.backend.Repository;

import com.example.backend.Entity.CrmLeadHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CrmLeadHistoryRepo extends JpaRepository<CrmLeadHistory, UUID> {
}
