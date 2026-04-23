// Services/SipuniService/SipuniService.java
package com.example.backend.Services.SipuniService;

import com.example.backend.DTO.SipuniCallDTO;

import java.util.List;

public interface SipuniService {
    List<SipuniCallDTO> fetchAndParseCalls(String from, String to);
    byte[] getCallAudio(String recordId);
}