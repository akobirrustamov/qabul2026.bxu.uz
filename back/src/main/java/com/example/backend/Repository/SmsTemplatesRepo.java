package com.example.backend.Repository;

import com.example.backend.Entity.SmsTemplates;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
public interface SmsTemplatesRepo extends JpaRepository<SmsTemplates, UUID> {
    Optional<SmsTemplates> findByEskizId(Long eskizId);
}