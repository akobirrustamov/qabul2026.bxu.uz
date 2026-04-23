package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "contract_file")
@Entity
@Builder
public class ContractFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne
    private Attachment file;
    private LocalDateTime createdAt;

    public ContractFile(Attachment file, LocalDateTime createdAt) {
        this.file = file;
        this.createdAt = createdAt;
    }
}
