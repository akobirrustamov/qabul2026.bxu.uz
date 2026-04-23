package com.example.backend.Controller;

import com.example.backend.DTO.PassportDTO;
import com.example.backend.DTO.PaymentDto;
import com.example.backend.Entity.AmbassadorPayment;
import com.example.backend.Entity.Attachment;
import com.example.backend.Entity.Payment;
import com.example.backend.Entity.User;
import com.example.backend.Repository.AmbassadorPaymentRepo;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.Repository.PaymentRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/payment")
public class PaymentController {

    private final PaymentRepo  paymentRepo;
    private final AmbassadorPaymentRepo ambassadorPaymentRepo;
    private final UserRepo userRepo;
//    private final AmbassadorPaymentRepo ambassadorPaymentRepo;
    private final AttachmentRepo attachmentRepo;

    @GetMapping
    public HttpEntity<?> getPayments(){
        return new ResponseEntity<>(paymentRepo.findAll(), HttpStatus.OK);
    }


    @GetMapping("/{paymentId}")
    public HttpEntity<?> getPaymentById(@PathVariable("paymentId") Integer paymentId){
        Optional<Payment> byId = paymentRepo.findById(paymentId);
        if(byId.isPresent()){
            return new ResponseEntity<>(byId.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/withdraw/{ambassadorId}")
    public HttpEntity<?> withdraw(@PathVariable UUID ambassadorId, @RequestBody PaymentDto paymentDto){
        Optional<User> byId = userRepo.findById(ambassadorId);
        if(byId.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Integer amount = 0;
        for (UUID abuturientId : paymentDto.getAbuturientIds()) {
            Optional<AmbassadorPayment> byAbuturientId = ambassadorPaymentRepo.findByAbuturientId(abuturientId);
            if (byAbuturientId.isPresent() && byAbuturientId.get().getStatus()==1) {
                amount += byAbuturientId.get().getAmount();
                byAbuturientId.get().setStatus(2);
                ambassadorPaymentRepo.save(byAbuturientId.get());
            }

        }
        Payment payment = new Payment();
        payment.setDescription(paymentDto.getDescription());
        payment.setAmbassador(byId.get());
        payment.setStatus(1);
        payment.setCreatedAt(LocalDateTime.now());

        payment.setAmount(amount);
        return new ResponseEntity<>(paymentRepo.save(payment), HttpStatus.OK);
    }

    @GetMapping("/payment-ambasador/{ambassadorId}")
    public HttpEntity<?>  getPaymentsAmbassador(@PathVariable UUID ambassadorId){
        Optional<User> byId = userRepo.findById(ambassadorId);
        if(byId.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        List<Payment> allByAmbassadorId = paymentRepo.findAllByAmbassadorId(byId.get().getId());
        return new ResponseEntity<>(allByAmbassadorId, HttpStatus.OK);

    }



    @PutMapping("/pay/{paymentId}/{fileId}")
    public HttpEntity<?> updatePayment(@PathVariable Integer paymentId, @PathVariable UUID fileId){
        Optional<Payment> byId = paymentRepo.findById(paymentId);
        if(byId.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Optional<Attachment> byId1 = attachmentRepo.findById(fileId);
        if(byId1.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Payment payment = byId.get();
        payment.setStatus(3);
        payment.setFile(byId1.get());

        List<AmbassadorPayment> all = ambassadorPaymentRepo.findByAmbassadorIdPayed(payment.getAmbassador().getId(),2);
        for (AmbassadorPayment ambassadorPayment : all) {
            ambassadorPayment.setStatus(3);
            ambassadorPaymentRepo.save(ambassadorPayment);
        }
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepo.save(payment);
        return new ResponseEntity<>(paymentRepo.save(payment), HttpStatus.OK);

    }


}
