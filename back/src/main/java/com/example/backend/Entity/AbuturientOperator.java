package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "abuturient_operator")
public class AbuturientOperator {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    @ManyToOne
    private Attachment file;
    @ManyToOne
    private User operator;
    @ManyToOne
    private Abuturient abuturient;

    public AbuturientOperator(Attachment file, User operator, Abuturient abuturient) {
        this.file = file;
        this.operator = operator;
        this.abuturient = abuturient;
    }
}
