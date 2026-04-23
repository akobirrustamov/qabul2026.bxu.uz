package com.example.backend.Controller;

import com.example.backend.Entity.CrmSubCategory;
import com.example.backend.Services.CrmSubCategoryService.CrmSubCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/crm/sub-categories")
@RequiredArgsConstructor
public class CrmSubCategoryController {

    private final CrmSubCategoryService service;

    @PostMapping
    public CrmSubCategory create(@RequestBody CrmSubCategory subCategory) {
        return service.create(subCategory);
    }

    @PutMapping("/{id}")
    public CrmSubCategory update(
            @PathVariable UUID id,
            @RequestBody CrmSubCategory subCategory
    ) {
        return service.update(id, subCategory);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/{id}")
    public CrmSubCategory getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @GetMapping
    public List<CrmSubCategory> getAll() {
        return service.getAll();
    }

    @GetMapping("/by-category/{categoryId}")
    public List<CrmSubCategory> getByCategory(
            @PathVariable UUID categoryId
    ) {
        return service.getByCategoryId(categoryId);
    }
}
