package com.example.backend.Controller;

import com.example.backend.DTO.SmsBatchRequestDTO;
import com.example.backend.Entity.*;
import com.example.backend.Repository.*;
import com.example.backend.Services.SmsCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SmsController {

    private final AbuturientRepo abuturientRepo;
    private final SmsCodeRepo smsCodeRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;
    private final CrmCategoryRepo crmCategoryRepo;
    private final CrmLeadRepo crmLeadRepo;
    private final CrmLeadCommentRepo crmLeadCommentRepo;
    private final UserRepo userRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final SmsCodeService smsCodeService;

//    @PostMapping("/send-batch")
//    public ResponseEntity<?> sendBatch(@RequestBody SmsBatchRequestDTO dto) {
//        return ResponseEntity.ok(smsCodeService.sendBatchSms(dto));
//    }

    @GetMapping("/{abuturientId}/{code}")
    public HttpEntity<?> sendSms(@PathVariable UUID abuturientId, @PathVariable Integer code) {
        Optional<SmsCode> smsCodeOpt = smsCodeRepo.findByAbuturientId(abuturientId);
        if (smsCodeOpt.isPresent()) {
            SmsCode smsCode = smsCodeOpt.get();
            System.out.print(smsCode);

            // Kod noto'g'ri yoki muddati tugagan bo'lsa
            if (!smsCode.getCode().equals(code) || LocalDateTime.now().isAfter(smsCode.getExpireTime())) {
                return ResponseEntity.status(403).body("Kod noto‘g‘ri yoki eskirgan");
            }

            Optional<Abuturient> byId = abuturientRepo.findById(abuturientId);
            if (byId.isEmpty())    return ResponseEntity.status(403).body("Abiturient mavjud emas");
            Abuturient abuturient = byId.get();
            smsCodeRepo.delete(smsCode);
            CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
            CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 2).orElseThrow();
            Optional<CrmLead> crmLead = crmLeadRepo.findByApplicantId(abuturient.getId());
            if (crmLead.isEmpty()) {
                throw new RuntimeException("Lead is required");
            }

            CrmLead lead = crmLead.get();
            lead.setCrmSubCategory(crmSubCategory);
            CrmLead savedLead = crmLeadRepo.save(lead);
            User commenter = userRepo.findByPhone("crm-bot")
                    .orElseThrow(() -> new RuntimeException("User not found"));

            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(savedLead)
                    .commenter(commenter)
                    .description("Qabul saytida sms code kiritdi")
                    .historyStatus(4)
                    .createdAt( LocalDateTime.now())
                    .build();
            CrmLeadComment saved = crmLeadCommentRepo.save(comment);
            messagingTemplate.convertAndSend("/topic/lead-update", savedLead);
            messagingTemplate.convertAndSend("/topic/lead-comment", saved);

            return ResponseEntity.ok(smsCode.getAbuturient());
        }

        return ResponseEntity.notFound().build();
    }
}
