package com.example.backend.Controller;

import com.example.backend.Entity.AmbassadorPaymentData;
import com.example.backend.Repository.AmbassadorPaymentDataRepo;
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
@RequestMapping("/api/v1/ambassador-payment-data")
public class AmbassadorPaymentDataController {

    private final AmbassadorPaymentDataRepo ambassadorPaymentDataRepo;

    // ✅ Create new record
    @PostMapping
    public HttpEntity<?> create(@RequestBody AmbassadorPaymentData request) {
        request.setCreateDate(LocalDateTime.now());
        AmbassadorPaymentData saved = ambassadorPaymentDataRepo.save(request);
        return ResponseEntity.ok(saved);
    }

    // ✅ Get all records
    @GetMapping
    public HttpEntity<?> getAll() {
        List<AmbassadorPaymentData> all = ambassadorPaymentDataRepo.findAll();
        return ResponseEntity.ok(all);
    }


    // ✅ Get one record by id
    @GetMapping("/{id}")
    public HttpEntity<?> getById(@PathVariable UUID id) {
        Optional<AmbassadorPaymentData> data = ambassadorPaymentDataRepo.findByAmbassadorId(id);
        System.out.printf("Data found with id: %s\n", data.get());
        return data.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ Update existing record
    @PutMapping("/{id}")
    public HttpEntity<?> update(@PathVariable Integer id, @RequestBody AmbassadorPaymentData request) {
        Optional<AmbassadorPaymentData> optional = ambassadorPaymentDataRepo.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AmbassadorPaymentData existing = optional.get();
        existing.setName(request.getName());
        existing.setPlasticNumber(request.getPlasticNumber());
        existing.setAmbassador(request.getAmbassador());
        // do not overwrite createDate on update
        AmbassadorPaymentData updated = ambassadorPaymentDataRepo.save(existing);
        return ResponseEntity.ok(updated);
    }

    // ✅ Delete by id
    @DeleteMapping("/{id}")
    public HttpEntity<?> delete(@PathVariable Integer id) {
        if (!ambassadorPaymentDataRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ambassadorPaymentDataRepo.deleteById(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}
