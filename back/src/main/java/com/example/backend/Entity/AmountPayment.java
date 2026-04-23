package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "amount_payment")
public class AmountPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Specifies auto-increment behavior
    private Integer id;
    private Integer amount;
    private LocalDateTime createdAt;

    public AmountPayment(Integer amount, LocalDateTime createdAt) {
        this.amount = amount;
        this.createdAt = createdAt;
    }
}
