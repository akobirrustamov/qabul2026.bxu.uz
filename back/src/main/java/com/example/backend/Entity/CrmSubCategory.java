package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_sub_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmSubCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String name;
    private String description;
    @ManyToOne
    private CrmCategory crmCategory;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private Boolean status;
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

}
