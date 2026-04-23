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
@Table(name = "ambassador_payment_data")
public class AmbassadorPaymentData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Specifies auto-increment behavior
    private Integer id;
    @OneToOne
    private User ambassador;
    private String plasticNumber;
    private LocalDateTime createDate;
    private String name;
}
