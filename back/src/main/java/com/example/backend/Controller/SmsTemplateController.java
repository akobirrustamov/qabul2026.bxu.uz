package com.example.backend.Controller;

import com.example.backend.DTO.SmsTemplatesDTO;
import com.example.backend.Entity.SmsTemplates;
import com.example.backend.Repository.SmsTemplatesRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/sms-templates")
public class SmsTemplateController {
    private final SmsTemplatesRepo smsTemplatesRepo;
    @GetMapping
    public ResponseEntity<?> getAllSmsTemplates() {
        List<SmsTemplates> all = smsTemplatesRepo.findAll();
        return new ResponseEntity<>(all, HttpStatus.OK);
    }

    @PutMapping("/{smsId}")
    public HttpEntity<?> edit(@PathVariable UUID smsId, @RequestBody SmsTemplatesDTO dto) {
        Optional<SmsTemplates> smsTemplatesOptional = smsTemplatesRepo.findById(smsId);
        if (smsTemplatesOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        SmsTemplates smsTemplates = smsTemplatesOptional.get();
        smsTemplates.setName(dto.getName());
        SmsTemplates save = smsTemplatesRepo.save(smsTemplates);
        return ResponseEntity.ok().body(save);
    }

}
