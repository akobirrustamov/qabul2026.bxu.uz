package com.example.backend.Repository;

import com.example.backend.Entity.DiscountStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DiscountStudentRepo extends JpaRepository<DiscountStudent,Integer> {


    @Query(value = "select * from discount_student where passport_pin=:passportPin ", nativeQuery = true)
  Optional<DiscountStudent> findDiscountStudentByPassport_pin(String passportPin);
}
