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
@Table(name = "ambassador_payment")
public class AmbassadorPayment {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Specifies auto-increment behavior
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "abuturient_id", unique = true, nullable = false)
    private Abuturient abuturient;

    @ManyToOne
    private User ambassador;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Integer amount;
    private Boolean completed;
    private Integer status;
    private String comment;
//    1 yangi
//    2 to'lovi jarayonda
//    3 to'langan

    public AmbassadorPayment(Abuturient abuturient, User ambassador, Boolean isActive, LocalDateTime createdAt, Integer amount, Boolean completed) {
        this.abuturient = abuturient;
        this.ambassador = ambassador;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.amount = amount;
        this.completed = completed;
    }
}
