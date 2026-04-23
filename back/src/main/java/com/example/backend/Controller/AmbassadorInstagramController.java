package com.example.backend.Controller;

import com.example.backend.DTO.AmbassadorInstagramDto;
import com.example.backend.Entity.AmbassadorInstagram;
import com.example.backend.Entity.User;
import com.example.backend.Repository.AmbassadorInstagramRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/ambassador-instagram")
public class AmbassadorInstagramController {

    private final AmbassadorInstagramRepo ambassadorInstagramRepo;
    private final UserRepo userRepo;



    @GetMapping
    public HttpEntity<?> getAll(){
        return ResponseEntity.ok(ambassadorInstagramRepo.findAll());
    }

    @GetMapping("/{ambassadorId}")
    public HttpEntity<?> getById(@PathVariable UUID ambassadorId){
        Optional<User> byId = userRepo.findById(ambassadorId);
        if(byId.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        Optional<AmbassadorInstagram> byAmbassador = ambassadorInstagramRepo.findByAmbassador(byId.get());
        if(byAmbassador.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(byAmbassador.get());
    }

    @PostMapping("/{ambassadorId}")
    public HttpEntity<?> create(@RequestBody AmbassadorInstagramDto ambassadorInstagramDto, @PathVariable UUID ambassadorId){
        Optional<User> byId = userRepo.findById(ambassadorId);
        if(byId.isEmpty()){
            return ResponseEntity.notFound().build();

        }
        AmbassadorInstagram    ambassadorInstagram = new AmbassadorInstagram(LocalDateTime.now(), false, 1, ambassadorInstagramDto.getDescription(), byId.get(), ambassadorInstagramDto.getUrl());
        ambassadorInstagramRepo.save(ambassadorInstagram);
        return ResponseEntity.ok(ambassadorInstagram);
    }









}
