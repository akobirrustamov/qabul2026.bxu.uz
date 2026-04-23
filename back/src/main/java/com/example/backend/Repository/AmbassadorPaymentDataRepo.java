package com.example.backend.Repository;

import com.example.backend.Entity.AmbassadorPaymentData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface AmbassadorPaymentDataRepo extends JpaRepository<AmbassadorPaymentData, Integer> {
    @Query(value = "select * from  ambassador_payment_data where ambassador_id=:id", nativeQuery = true)
    Optional<AmbassadorPaymentData> findByAmbassadorId(UUID id);
}
