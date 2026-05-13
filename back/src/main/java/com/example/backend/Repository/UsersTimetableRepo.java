package com.example.backend.Repository;

import com.example.backend.Entity.UsersTimetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsersTimetableRepo extends JpaRepository<UsersTimetable, UUID> {

    /** Token hashi bo'yicha — unique kalit */
    Optional<UsersTimetable> findByTokenHash(String tokenHash);

    /** Bitta user barcha tokenlari/sessionlari (eng yangi avval) */
    List<UsersTimetable> findAllByUserIdOrderByLastSeenDesc(UUID userId);

    /** Bitta user bugungi tokenlari */
    List<UsersTimetable> findAllByUserIdAndDate(UUID userId, LocalDate date);

    /** Barcha userlar bugungi faoliyati */
    List<UsersTimetable> findAllByDateOrderByLastSeenDesc(LocalDate date);

    /** Sana oralig'i bo'yicha */
    List<UsersTimetable> findAllByDateBetweenOrderByLastSeenDesc(LocalDate from, LocalDate to);

    /** User + sana oralig'i */
    List<UsersTimetable> findAllByUserIdAndDateBetweenOrderByLastSeenDesc(UUID userId, LocalDate from, LocalDate to);

    /** Bitta userning jami login soni (nechta token = nechta login) */
    long countByUserId(UUID userId);

    /** Bitta userning jami so'rovlari (barcha sessionlar yig'indisi) */
    @Query("SELECT COALESCE(SUM(t.requestCount), 0) FROM UsersTimetable t WHERE t.user.id = :userId")
    long sumRequestCountByUserId(@Param("userId") UUID userId);

    /** Barcha userlar bo'yicha summary (userId, loginCount, totalRequests, lastSeen) */
    @Query("""
        SELECT t.user.id,
               COUNT(t.id),
               COALESCE(SUM(t.requestCount), 0),
               MAX(t.lastSeen)
        FROM UsersTimetable t
        GROUP BY t.user.id
        ORDER BY MAX(t.lastSeen) DESC
        """)
    List<Object[]> findUserSummaries();

    /** Duplicate tozalash uchun */
    Optional<UsersTimetable> findFirstByUserIdAndDateOrderByLastSeenDesc(UUID userId, LocalDate date);
}
