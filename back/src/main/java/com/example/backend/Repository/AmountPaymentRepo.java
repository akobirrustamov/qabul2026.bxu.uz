package com.example.backend.Repository;

import com.example.backend.Entity.AmountPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AmountPaymentRepo extends JpaRepository<AmountPayment,Integer> {
    AmountPayment findTopByOrderByCreatedAtDesc();
}
