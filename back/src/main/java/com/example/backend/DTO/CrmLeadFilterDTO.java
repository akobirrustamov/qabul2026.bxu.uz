package com.example.backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CrmLeadFilterDTO {
    private UUID operatorId;
    private UUID agentId;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private int page = 0;
    private int size = 100;
    private Boolean operatorNull;
}