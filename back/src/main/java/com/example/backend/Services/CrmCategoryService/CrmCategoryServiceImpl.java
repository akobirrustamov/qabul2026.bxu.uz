package com.example.backend.Services.CrmCategoryService;

import com.example.backend.Entity.CrmCategory;
import com.example.backend.Repository.CrmCategoryRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;



@Service
@RequiredArgsConstructor
@Transactional
public class CrmCategoryServiceImpl implements CrmCategoryService {

    private final CrmCategoryRepo repository;

    // ================= CREATE =================
    @Override
    public CrmCategory create(CrmCategory category) {

        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name is required");
        }

        int total = (int) repository.count();

        // If null or invalid → append to end
        if (category.getSortOrder() == null || category.getSortOrder() <= 0) {
            category.setSortOrder(total + 1);
        }

        // If bigger than max → append
        if (category.getSortOrder() > total + 1) {
            category.setSortOrder(total + 1);
        }

        // Shift others
        List<CrmCategory> toShift =
                repository.findBySortOrderGreaterThanEqualOrderBySortOrderAsc(category.getSortOrder());

        for (CrmCategory c : toShift) {
            c.setSortOrder(c.getSortOrder() + 1);
        }

        repository.saveAll(toShift);

        return repository.save(category);
    }

    // ================= UPDATE =================
    @Override
    public CrmCategory update(UUID id, CrmCategory category) {

        CrmCategory existing = getById(id);

        int oldOrder = existing.getSortOrder();
        Integer requestedOrder = category.getSortOrder();

        if (requestedOrder == null || requestedOrder <= 0) {
            requestedOrder = oldOrder;
        }

        int total = (int) repository.count();

        if (requestedOrder > total) {
            requestedOrder = total;
        }

        if (oldOrder != requestedOrder) {

            if (requestedOrder < oldOrder) {
                // moving UP
                List<CrmCategory> between =
                        repository.findBySortOrderBetweenOrderBySortOrderAsc(requestedOrder, oldOrder - 1);

                for (CrmCategory c : between) {
                    if (!c.getId().equals(id)) {
                        c.setSortOrder(c.getSortOrder() + 1);
                    }
                }

                repository.saveAll(between);

            } else {
                // moving DOWN
                List<CrmCategory> between =
                        repository.findBySortOrderBetweenOrderBySortOrderAsc(oldOrder + 1, requestedOrder);

                for (CrmCategory c : between) {
                    if (!c.getId().equals(id)) {
                        c.setSortOrder(c.getSortOrder() - 1);
                    }
                }

                repository.saveAll(between);
            }

            existing.setSortOrder(requestedOrder);
        }

        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        existing.setStatus(category.getStatus());

        return repository.save(existing);
    }

    // ================= DELETE =================
    @Override
    public void delete(UUID id) {

        CrmCategory category = getById(id);
        int deletedOrder = category.getSortOrder();

        repository.delete(category);

        List<CrmCategory> toShift =
                repository.findBySortOrderGreaterThanOrderBySortOrderAsc(deletedOrder);

        for (CrmCategory c : toShift) {
            c.setSortOrder(c.getSortOrder() - 1);
        }

        repository.saveAll(toShift);
    }

    // ================= GET =================
    @Override
    public CrmCategory getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("CrmCategory not found with id: " + id));
    }

    @Override
    public List<CrmCategory> getAll() {
        return repository.findAllByOrderBySortOrderAsc();
    }
}