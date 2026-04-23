package com.example.backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CrmLeadCommentDTO {
    private String description;
    private UUID commenterId;
    private LocalDateTime createdAt;
    private Integer historyStatus;
}