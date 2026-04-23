package com.example.backend.Repository;

import com.example.backend.Entity.CrmCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CrmCategoryRepo extends JpaRepository<CrmCategory, UUID> {

    List<CrmCategory> findAllByOrderBySortOrderAsc();

    List<CrmCategory> findByStatusTrueOrderBySortOrderAsc();

    List<CrmCategory> findBySortOrderGreaterThanEqualOrderBySortOrderAsc(Integer sortOrder);

    List<CrmCategory> findBySortOrderGreaterThanOrderBySortOrderAsc(Integer sortOrder);

    List<CrmCategory> findBySortOrderBetweenOrderBySortOrderAsc(Integer start, Integer end);

    Optional<CrmCategory> findBySortOrder(int i);
}