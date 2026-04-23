package com.example.backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CrmLeadDTO {
    private UUID crmSubCategoryId;
    private Integer sortOrder;
    private LocalDateTime reminderTime;
    private String reminderDescription;
    private Boolean status;
    private UUID operatorId;
}
