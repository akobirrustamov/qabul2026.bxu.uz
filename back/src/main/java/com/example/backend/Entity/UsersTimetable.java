package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users_timetable")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsersTimetable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** Foydalanuvchining IP manzili */
    private String ip;

    /** Token ning SHA-256 hashi — unique kalit (1 token = 1 session) */
    @Column(unique = true, nullable = false, length = 64)
    private String tokenHash;

    /** Token ning birinchi 60 belgisi (ko'rsatish uchun) */
    @Column(length = 60)
    private String tokenPrefix;

    /** Birinchi faollashgan sana */
    private LocalDate date;

    /** Bu token bilan birinchi so'rov vaqti (login vaqti) */
    private LocalDateTime firstSeen;

    /** Oxirgi so'rov vaqti */
    private LocalDateTime lastSeen;

    /** Bu token orqali jonatilgan so'rovlar soni */
    private int requestCount;

    /**
     * Session davomiyligi (sekundda).
     * firstSeen dan lastSeen gacha o'tgan vaqt.
     */
    @Transient
    public long getSessionDurationSeconds() {
        if (firstSeen == null || lastSeen == null) return 0;
        return Duration.between(firstSeen, lastSeen).getSeconds();
    }

    /**
     * Session davomiyligi chiroyli formatda: "2s 34dq 12s"
     */
    @Transient
    public String getSessionDurationFormatted() {
        long totalSeconds = getSessionDurationSeconds();
        long hours   = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        if (hours > 0)   return String.format("%ds %02ddq %02ds", hours, minutes, seconds);
        if (minutes > 0) return String.format("%ddq %02ds", minutes, seconds);
        return totalSeconds + "s";
    }
}
