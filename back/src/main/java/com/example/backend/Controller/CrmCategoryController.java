package com.example.backend.Controller;

import com.example.backend.Entity.CrmCategory;
import com.example.backend.Services.CrmCategoryService.CrmCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/crm/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CrmCategoryController {
    private final CrmCategoryService service;
    @PostMapping
    public ResponseEntity<CrmCategory> create(@RequestBody CrmCategory category) {
        System.out.println(category);
        CrmCategory created = service.create(category);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CrmCategory> update(
            @PathVariable UUID id,
            @RequestBody CrmCategory category
    ) {
        CrmCategory updated = service.update(id, category);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CrmCategory> getById(@PathVariable UUID id) {
        CrmCategory category = service.getById(id);
        return ResponseEntity.ok(category);
    }

    @GetMapping
    public ResponseEntity<List<CrmCategory>> getAll() {
        List<CrmCategory> categories = service.getAll();
        return ResponseEntity.ok(categories);
    }
}