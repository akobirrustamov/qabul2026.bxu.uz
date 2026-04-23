package com.example.backend.Repository;

import com.example.backend.Entity.AmbassadorInstagram;
import com.example.backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AmbassadorInstagramRepo extends JpaRepository<AmbassadorInstagram, Integer> {
    Optional<AmbassadorInstagram> findByAmbassador(User ambassador);
}
