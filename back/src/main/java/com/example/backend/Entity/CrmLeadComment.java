package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(name = "crm_lead_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    private CrmLead crmLead;

    @ManyToOne
    private User commenter;
//    1- lead almashdi
//    2- comment yozildi
//    3- qo'ngiroq(sipuni)
//    4- sayt avtomatik qabuldan

    private Integer historyStatus;
    private String description;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}