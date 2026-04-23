package com.example.backend.Repository;

import com.example.backend.Entity.DiscountByYear;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountByYearRepo extends JpaRepository<DiscountByYear,Integer> {
}
