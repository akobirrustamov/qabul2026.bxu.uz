package com.example.backend.Repository;

import com.example.backend.Entity.AbuturientOperator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AbuturientOperatorRepo extends JpaRepository<AbuturientOperator, UUID> {
}
