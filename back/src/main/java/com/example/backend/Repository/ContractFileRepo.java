package com.example.backend.Repository;

import com.example.backend.Entity.ContractFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractFileRepo extends JpaRepository<ContractFile, Integer> {
}
