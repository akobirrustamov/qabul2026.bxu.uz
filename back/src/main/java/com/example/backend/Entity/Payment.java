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
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Specifies auto-increment behavior
    private Integer id;
    private String description;
    private Integer amount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @ManyToOne
    private Attachment file;
    private Integer status;
    @ManyToOne
    private User ambassador;
}
