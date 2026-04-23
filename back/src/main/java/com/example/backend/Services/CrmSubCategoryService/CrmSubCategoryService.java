package com.example.backend.Services.CrmSubCategoryService;

import com.example.backend.Entity.CrmSubCategory;

import java.util.List;
import java.util.UUID;

public interface CrmSubCategoryService {

    CrmSubCategory create(CrmSubCategory subCategory);

    CrmSubCategory update(UUID id, CrmSubCategory subCategory);

    void delete(UUID id);

    CrmSubCategory getById(UUID id);

    List<CrmSubCategory> getAll();

    List<CrmSubCategory> getByCategoryId(UUID categoryId);
}
