package com.example.backend.Controller;

import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.AmbassadorPayment;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.AmbassadorPaymentRepo;
import com.example.backend.Repository.PaymentRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.apache.xmlbeans.impl.xb.xsdschema.Attribute;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/admin-ambassador")
public class AdminAmbassadorController {

    private final UserRepo userRepo;
    private final PaymentRepo paymentRepo;
    private final AbuturientRepo abuturientRepo;
    private final AmbassadorPaymentRepo ambassadorPaymentRepo;
    @PutMapping("/{ambassadorPaymentId}")
    public HttpEntity<?> back(@PathVariable Integer ambassadorPaymentId){
        Optional<AmbassadorPayment> byAbuturientId = ambassadorPaymentRepo.findById(ambassadorPaymentId);
        if (byAbuturientId.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        AmbassadorPayment ambassadorPayment = byAbuturientId.get();
        ambassadorPayment.setStatus(1);
        ambassadorPaymentRepo.save(ambassadorPayment);
        return ResponseEntity.ok(ambassadorPayment);
    }
    @PutMapping("/decline/{ambassadorPaymentId}")
    public HttpEntity<?> decline(@PathVariable Integer ambassadorPaymentId){
        Optional<AmbassadorPayment> byAbuturientId = ambassadorPaymentRepo.findById(ambassadorPaymentId);
        if (byAbuturientId.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        AmbassadorPayment ambassadorPayment = byAbuturientId.get();
        ambassadorPayment.setStatus(0);
        ambassadorPaymentRepo.save(ambassadorPayment);
        return ResponseEntity.ok(ambassadorPayment);
    }



    @DeleteMapping("/{ambassadorPaymentId}")
    public HttpEntity<?> delete(@PathVariable Integer ambassadorPaymentId){
        ambassadorPaymentRepo.deleteById(ambassadorPaymentId);
        return ResponseEntity.ok().build();
    }
}
