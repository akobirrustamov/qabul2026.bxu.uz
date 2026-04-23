package com.example.backend.Controller;

import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.AmbassadorPayment;
import com.example.backend.Entity.Payment;
import com.example.backend.Entity.User;
import com.example.backend.Repository.*;
import com.example.backend.Services.AmbassadorPaymentService;
import com.example.backend.Services.AuthService.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/ambassador")
public class AmbassadorPaymentController {

    private final AuthService service;
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final AgentPathRepo agentPathRepo;
    private final AbuturientRepo abuturientRepo;
    private final PaymentRepo paymentRepo;
    private final AmbassadorPaymentRepo ambassadorPaymentRepo;

    private final AmbassadorPaymentService ambassadorPaymentService;
    // ✅ Add payment for abiturient referred by ambassador
    @PostMapping("/add-payment/{abuturientId}/{agentId}")
    public HttpEntity<?> addPayment(@PathVariable UUID abuturientId, @PathVariable UUID agentId) {
       return ResponseEntity.ok(ambassadorPaymentService.addPayment(abuturientId, agentId));
    }

    // ✅ Get all payments by ambassador
    @GetMapping("/all/{ambassadorId}")
    public HttpEntity<?> getAllPayments(@PathVariable UUID ambassadorId) {
        List<AmbassadorPayment> all = ambassadorPaymentRepo.findByAmbassadorId(ambassadorId);
        return ResponseEntity.ok(all);
    }
    @GetMapping("/payed/{ambassadorId}")
    public HttpEntity<?> getPayedPayments(@PathVariable UUID ambassadorId) {
        List<AmbassadorPayment> all = ambassadorPaymentRepo.findByAmbassadorIdPayed(ambassadorId,3);
        return ResponseEntity.ok(all);
    }
    @GetMapping("/inprogres/{ambassadorId}")
    public HttpEntity<?> getInProgressPayments(@PathVariable UUID ambassadorId) {
        List<AmbassadorPayment> all = ambassadorPaymentRepo.findByAmbassadorIdPayed(ambassadorId,2);
        return ResponseEntity.ok(all);
    }

    @GetMapping("/not-payed/{ambassadorId}")
    public HttpEntity<?> getNotPayedPayments(@PathVariable UUID ambassadorId) {
        List<AmbassadorPayment> all = ambassadorPaymentRepo.findByAmbassadorIdPayed(ambassadorId, 1);
        return ResponseEntity.ok(all);
    }

    @GetMapping("/statistic/{ambassadorId}")
    public HttpEntity<?> getStatistic(@PathVariable UUID ambassadorId) {
        return ResponseEntity.ok(ambassadorPaymentService.getStatistic(ambassadorId));
    }

}
