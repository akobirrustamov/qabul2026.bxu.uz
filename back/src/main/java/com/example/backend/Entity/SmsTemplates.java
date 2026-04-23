package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "sms_templates")
public class SmsTemplates {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private Long eskizId;
    private String name;
    @Column(columnDefinition = "TEXT")
    private String template;
    private String status;
    private LocalDateTime updatedAt = LocalDateTime.now();

}
