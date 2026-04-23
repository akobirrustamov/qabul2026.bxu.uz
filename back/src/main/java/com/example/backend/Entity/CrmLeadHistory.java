package com.example.backend.Entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "crm_lead_histories")
public class CrmLeadHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private CrmLead lead;

    @ManyToOne
    private User user;
    private Integer status;

    private String description;

    private LocalDateTime createdAt;
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

}



