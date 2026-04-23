package com.example.backend.Services.CrmSubCategoryService;

import com.example.backend.Entity.CrmCategory;
import com.example.backend.Entity.CrmSubCategory;
import com.example.backend.Repository.CrmCategoryRepo;
import com.example.backend.Repository.CrmSubCategoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CrmSubCategoryServiceImpl implements CrmSubCategoryService {

    private final CrmSubCategoryRepo repository;
    private final CrmCategoryRepo categoryRepository;

    @Override
    public CrmSubCategory create(CrmSubCategory subCategory) {
        return repository.save(subCategory);
    }

    @Override
    public CrmSubCategory update(UUID id, CrmSubCategory subCategory) {
        CrmSubCategory existing = getById(id);

        existing.setName(subCategory.getName());
        existing.setDescription(subCategory.getDescription());
        existing.setSortOrder(subCategory.getSortOrder());
        existing.setStatus(subCategory.getStatus());

        if (subCategory.getCrmCategory() != null) {
            UUID catId = subCategory.getCrmCategory().getId();
            CrmCategory category = categoryRepository.findById(catId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            existing.setCrmCategory(category);
        }

        return repository.save(existing);
    }

    @Override
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public CrmSubCategory getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CrmSubCategory not found"));
    }

    @Override
    public List<CrmSubCategory> getAll() {
        return repository.findAll();
    }

    @Override
    public List<CrmSubCategory> getByCategoryId(UUID categoryId) {
        return repository.findAllByCrmCategoryId(categoryId);
    }
}
