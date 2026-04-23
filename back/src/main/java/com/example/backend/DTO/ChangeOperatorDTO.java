package com.example.backend.DTO;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ChangeOperatorDTO {
    private UUID operatorId;
    private List<UUID> leadIds;
}

