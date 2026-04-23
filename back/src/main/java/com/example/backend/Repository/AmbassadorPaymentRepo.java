package com.example.backend.Repository;

import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.AmbassadorPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AmbassadorPaymentRepo extends JpaRepository<AmbassadorPayment, Integer> {
    boolean existsByAbuturient(Abuturient abuturient);
    @Query(value = "select * from ambassador_payment where ambassador_id=:ambassadorId ", nativeQuery = true)
    List<AmbassadorPayment> findByAmbassadorId(UUID ambassadorId);


    @Query(value = "select * from ambassador_payment where ambassador_id=:ambassadorId and status=:statusN", nativeQuery = true)
    List<AmbassadorPayment> findByAmbassadorIdPayed(UUID ambassadorId, Integer statusN);


    @Query(value = "select * from ambassador_payment where ambassador_id=:ambassadorId and compalated=false", nativeQuery = true)
    List<AmbassadorPayment> findByAmbassadorIdNotPayed(UUID ambassadorId);

    @Query(value = "select * from ambassador_payment where abuturient_id=:abuturientId", nativeQuery = true)
    Optional<AmbassadorPayment> findByAbuturientId(UUID abuturientId);
}
