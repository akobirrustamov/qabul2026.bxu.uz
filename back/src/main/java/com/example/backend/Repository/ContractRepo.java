package com.example.backend.Repository;

import com.example.backend.Entity.Contract;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ContractRepo extends JpaRepository<Contract, UUID> {

    Contract findByHemisId(Long aLong);

    @Query(value = "select * from contract where passport_number=:passportNumber", nativeQuery = true)
    Optional<Contract> findByPassportNumber(@Size(min = 14, max = 14, message = "Passport number must be exactly 14 characters long") String passportNumber);
}
