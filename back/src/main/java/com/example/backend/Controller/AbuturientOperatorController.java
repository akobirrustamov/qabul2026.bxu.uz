package com.example.backend.Controller;

import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.AbuturientOperator;
import com.example.backend.Entity.Attachment;
import com.example.backend.Entity.User;
import com.example.backend.Repository.AbuturientOperatorRepo;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.Repository.UserRepo;
import jakarta.persistence.Column;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/abuturient-operator")
public class AbuturientOperatorController {

    private final AbuturientOperatorRepo abuturientOperatorRepo;
    private final AbuturientRepo abuturientRepo;
    private final AttachmentRepo attachmentRepo;
    private final UserRepo userRepo;
    @GetMapping("/operator/{operatorId}")
    public HttpEntity<?> getAbuturientOperator(@PathVariable UUID operatorId){
        List<Abuturient> all = abuturientRepo.findByOperatorId(operatorId);
        return ResponseEntity.ok(all);
    }

    @PostMapping("/{abutrurientId}/{operatorId}/{fileId}")
    public HttpEntity<?> postAbuturientOperator(@PathVariable UUID abutrurientId, @PathVariable UUID operatorId, @PathVariable UUID fileId){
        Optional<Abuturient> byId = abuturientRepo.findById(abutrurientId);
        Optional<Attachment> byId1 = attachmentRepo.findById(fileId);
        Optional<User> byId2 = userRepo.findById(operatorId);
        if (byId2.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        User user = byId2.get();
        if (byId1.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        Attachment attachment = byId1.get();
        if(byId.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        Abuturient abuturient = byId.get();
        abuturient.setOperatorChek(attachment);
        abuturient.setOperator(user);
        abuturient.setOperatorCreatedAt(LocalDateTime.now());
        Abuturient save = abuturientRepo.save(abuturient);

        return ResponseEntity.ok(save);

    }





}


