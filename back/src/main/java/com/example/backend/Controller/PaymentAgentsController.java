package com.example.backend.Controller;


import com.example.backend.DTO.PaymentAgentsDTO;
import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.Attachment;
import com.example.backend.Entity.PaymentAgents;
import com.example.backend.Entity.User;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.Repository.PaymentAgentsRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/payment-agents")
public class PaymentAgentsController {


    private final PaymentAgentsRepo paymentAgentsRepo;
    private final UserRepo userRepo;
    private final AttachmentRepo attachmentRepo;
    private final AbuturientRepo abuturientRepo;

    @GetMapping("/{agentId}")
    public HttpEntity<?> getPaymentAgents(@PathVariable UUID agentId) {
        List<PaymentAgents> byId = paymentAgentsRepo.findByAgentId(agentId);
        if(byId.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(byId, HttpStatus.OK);
    }

    @GetMapping("/is-accepted/{paymentId}")
    public HttpEntity<?> getPaymentAgentById(@PathVariable UUID paymentId) {
        Optional<PaymentAgents> byId = paymentAgentsRepo.findById(paymentId);
        if(byId.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        if(byId.get().getIsAccepted()!=false){
            return new ResponseEntity<>(HttpStatus.NOT_ACCEPTABLE);
        }
        byId.get().setIsAccepted(true);
        PaymentAgents paymentAgents = paymentAgentsRepo.save(byId.get());
        return new ResponseEntity<>(paymentAgents, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity getPaymentAgents(@RequestBody PaymentAgentsDTO dto) {
        System.out.println(dto);
        Optional<User> byId = userRepo.findById(dto.getUserId());
        if (byId.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = byId.get();
        Attachment attachment = null;
        if (dto.getFileId() != null) {
            Optional<Attachment> byId1 = attachmentRepo.findById(dto.getFileId());
            if (byId1.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            attachment = byId1.get();
        }
        Optional<Abuturient> abuturientId = abuturientRepo.findById(dto.getAbuturientId());
        if (abuturientId.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Abuturient abuturient = abuturientId.get();
        abuturient.setIsPayed(true);
        abuturient.setAmount(dto.getAmount());
        abuturientRepo.save(abuturient);
        PaymentAgents  paymentAgents = new PaymentAgents(dto.getAmount(), attachment, user, false, LocalDateTime.now(), abuturient);
        PaymentAgents save = paymentAgentsRepo.save(paymentAgents);
        return ResponseEntity.ok(save);
    }

    @PutMapping("/edit")
    public ResponseEntity<PaymentAgents> updatePayment(

            @RequestBody PaymentAgentsDTO dto
    ) {
        PaymentAgents payment;
            if (dto.getUserId() == null || dto.getAbuturientId() == null) {
                throw new IllegalArgumentException(
                        "paymentId yo‘q bo‘lsa userId va abuturientId majburiy"
                );
            }

            payment = paymentAgentsRepo
                    .findByAbuturient_IdAndUser_Id(dto.getAbuturientId(), dto.getUserId())
                    .orElseThrow(() -> new RuntimeException(
                            "Payment not found by abuturientId + userId"
                    ));


        // 💵 amount
        if (dto.getAmount() != null) {
            payment.setAmount(dto.getAmount());
            payment.getAbuturient().setAmount(dto.getAmount());
            abuturientRepo.save(payment.getAbuturient());
        }

        // 📎 file
        if (dto.getFileId() != null) {
            Attachment attachment = attachmentRepo.findById(dto.getFileId())
                    .orElseThrow(() -> new RuntimeException("File not found"));
            payment.setFile(attachment);
        }

        // 👤 agent
        if (dto.getUserId() != null) {
            User user = userRepo.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            payment.setUser(user);
        }

        PaymentAgents saved = paymentAgentsRepo.save(payment);
        return ResponseEntity.ok(saved);
    }


}