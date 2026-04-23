package com.example.backend.Services.CrmCategoryService;

import com.example.backend.Entity.CrmCategory;

import java.util.List;
import java.util.UUID;

public interface CrmCategoryService {

    CrmCategory create(CrmCategory category);

    CrmCategory update(UUID id, CrmCategory category);

    void delete(UUID id);

    CrmCategory getById(UUID id);

    List<CrmCategory> getAll();
}
