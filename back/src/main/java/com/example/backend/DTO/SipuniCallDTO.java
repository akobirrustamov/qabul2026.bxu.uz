// DTO/SipuniCallDTO.java
package com.example.backend.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SipuniCallDTO {
    private LocalDateTime dateTime;
    private String type;       // Входящий / Исходящий
    private String status;     // Отвечен / Не отвечен
    private String fromNumber;
    private String toNumber;
    private String duration;
    private String recordId;
}