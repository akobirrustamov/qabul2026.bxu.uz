package com.example.backend.DTO;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SmsBatchRequestDTO {
    private List<String> phones;
    private UUID templateId;
    private List<String> params; // %s yoki %d uchun
}
