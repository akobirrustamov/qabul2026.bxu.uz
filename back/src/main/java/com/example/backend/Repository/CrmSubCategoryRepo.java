package com.example.backend.Repository;

import com.example.backend.Entity.CrmSubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CrmSubCategoryRepo extends JpaRepository<CrmSubCategory, UUID> {

    List<CrmSubCategory> findAllByCrmCategoryId(UUID categoryId);





    @Query(value = "select * from crm_sub_categories where crm_category_id=:id and sort_order=:i", nativeQuery = true)
    Optional<CrmSubCategory> findBySortOrderAndCategoryId(UUID id, int i);
}
