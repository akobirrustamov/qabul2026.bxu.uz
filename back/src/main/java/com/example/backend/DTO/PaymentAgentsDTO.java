package com.example.backend.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PaymentAgentsDTO {
    private UUID userId;
    private UUID fileId;
    private UUID abuturientId;
    private Integer amount;
}
