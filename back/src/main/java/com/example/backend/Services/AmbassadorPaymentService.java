package com.example.backend.Services;

import com.example.backend.Entity.*;
import com.example.backend.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AmbassadorPaymentService {

    private final AbuturientRepo abuturientRepo;
    private final UserRepo userRepo;
    private final PaymentRepo paymentRepo;
    private final AmbassadorPaymentRepo ambassadorPaymentRepo;
    private final AmountPaymentRepo amountPaymentRepo;

    public AmbassadorPayment addPayment(UUID abuturientId, UUID agentId) {

        System.out.printf("AbuturientId payment: %s\n", abuturientId);
        Abuturient abuturient = abuturientRepo.findById(abuturientId)
                .orElseThrow(() -> new IllegalArgumentException("Abuturient not found"));

        User ambassador = userRepo.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Ambassador not found"));

        // check uniqueness
        if (ambassadorPaymentRepo.existsByAbuturient(abuturient)) {
            throw new IllegalStateException("This abuturient already has an ambassador payment");
        }

        // get last payment
//        Payment lastPayment = paymentRepo.findTopByOrderByCreatedAtDesc();
        AmountPayment lastPayment = amountPaymentRepo.findTopByOrderByCreatedAtDesc();
        if (lastPayment == null) {
            throw new IllegalStateException("No payments found");
        }

        AmbassadorPayment ambassadorPayment = AmbassadorPayment.builder()
                .abuturient(abuturient)
                .ambassador(ambassador)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .amount(lastPayment.getAmount())
                .completed(false)
                .build();
       ambassadorPayment.setStatus(1);
       ambassadorPayment.setComment("\"1-Yangi ariza, 2-To'lov jarayonda, 3-To'langan\"");
        AmbassadorPayment save = ambassadorPaymentRepo.save(ambassadorPayment);
        return save;
    }


    public Map<String, Object> getStatistic(UUID ambassadorId) {
        // fetch all payments for this ambassador
        java.util.List<AmbassadorPayment> payments = ambassadorPaymentRepo.findByAmbassadorId(ambassadorId);

        // initialize sums
        long totalCount = payments.size();
        long status1Count = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 1).count();
        long status2Count = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 2).count();
        long status3Count = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 3).count();

        int totalAmount = payments.stream().mapToInt(AmbassadorPayment::getAmount).sum();
        int status1Amount = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 1)
                .mapToInt(AmbassadorPayment::getAmount).sum();
        int status2Amount = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 2)
                .mapToInt(AmbassadorPayment::getAmount).sum();
        int status3Amount = payments.stream().filter(p -> p.getStatus() != null && p.getStatus() == 3)
                .mapToInt(AmbassadorPayment::getAmount).sum();

        // put into map
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", totalCount);
        stats.put("status1Count", status1Count);
        stats.put("status2Count", status2Count);
        stats.put("status3Count", status3Count);

        stats.put("totalAmount", totalAmount);
        stats.put("status1Amount", status1Amount);
        stats.put("status2Amount", status2Amount);
        stats.put("status3Amount", status3Amount);

        return stats;
    }

}
