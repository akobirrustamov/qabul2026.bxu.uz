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
@Table(name = "payment_agent")
public class PaymentAgents {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Specifies auto-increment behavior
    private UUID id;
    private Integer amount;
    @ManyToOne
    private Attachment file;
    @ManyToOne
    private User user;
    @ManyToOne
    @JoinColumn(name = "abuturient_id", unique = true)
    private Abuturient abuturient;
    private Boolean isAccepted;
    private LocalDateTime createdAt;

    public PaymentAgents(Integer amount, Attachment file, User user, Boolean isAccepted, LocalDateTime createdAt, Abuturient abuturient) {
        this.amount = amount;
        this.file = file;
        this.user = user;
        this.isAccepted = isAccepted;
        this.createdAt = createdAt;
        this.abuturient = abuturient;
    }
}
