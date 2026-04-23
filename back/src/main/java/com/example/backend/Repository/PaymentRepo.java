package com.example.backend.Repository;

import com.example.backend.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PaymentRepo extends JpaRepository<Payment,Integer> {
    Payment findTopByOrderByCreatedAtDesc();



    @Query(value = "select * from payment where ambassador_id=:id", nativeQuery = true)
    List<Payment> findAllByAmbassadorId(UUID id);
}
