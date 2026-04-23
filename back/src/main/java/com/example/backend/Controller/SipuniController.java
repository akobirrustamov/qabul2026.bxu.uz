package com.example.backend.Controller;

import com.example.backend.Services.SipuniService.SipuniPollingJob;
import com.example.backend.Services.SipuniService.SipuniService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sipuni")
@RequiredArgsConstructor
public class SipuniController {
    private final SipuniPollingJob sipuniPollingJob;
    private final SipuniService sipuniService;

    @GetMapping("/import-today")
    public String importToday() {
        sipuniPollingJob.importAllToday(); // ← bu metod comment ham qo'shadi
        return "Import bajarildi!";
    }

    @GetMapping("/audio")
    public ResponseEntity<byte[]> getAudio(@RequestParam String id) {
        byte[] audio = sipuniService.getCallAudio(id);

        return ResponseEntity.ok()
                .header("Content-Type", "audio/mpeg")
                .body(audio);
    }
}