package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Entity
@Table(name = "crm_leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLead {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    private CrmSubCategory crmSubCategory;

//    @ManyToOne
//    private User operator;
    @ManyToOne
    private Abuturient applicant;
    private String phone;
    private String chatId;
    private String source;
    @ManyToOne
    private User operator;

    @OneToMany(mappedBy = "crmLead", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<CrmLeadComment> comments;

    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime reminderTime;
    private String reminderDescription;
    private Boolean completed;
    private Boolean status;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}