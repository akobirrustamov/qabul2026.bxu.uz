package com.example.backend.Controller;

import com.example.backend.Entity.AmountPayment;
import com.example.backend.Entity.Region;
import com.example.backend.Repository.AmountPaymentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/amount-payment")
public class AmountPaymentController {

    private final AmountPaymentRepo amountPaymentRepo;

    @GetMapping
    public HttpEntity<?> getAllAmountPayment(){
        return ResponseEntity.ok(amountPaymentRepo.findAll());
    }

    @GetMapping("/{amount}")
    public HttpEntity<?> getAmountPayment(@PathVariable Integer amount){
        AmountPayment amountPayment = new AmountPayment(amount, LocalDateTime.now());
        AmountPayment save = amountPaymentRepo.save(amountPayment);
        return ResponseEntity.ok(save);
    }
}
