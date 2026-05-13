package com.example.backend.Controller;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UsersTimetable;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Repository.UsersTimetableRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/timetable")
public class UsersTimetableController {

    private final UsersTimetableRepo usersTimetableRepo;
    private final UserRepo userRepo;

    // ================================================================
    // SUMMARY — barcha userlar statistikasi
    // ================================================================

    /**
     * GET /api/v1/timetable/summary
     * Har bir user bo'yicha: loginCount, totalRequests, lastSeen
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        List<Object[]> rows = usersTimetableRepo.findUserSummaries();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            UUID userId       = (UUID) row[0];
            long loginCount   = ((Number) row[1]).longValue();
            long totalReqs    = ((Number) row[2]).longValue();
            LocalDateTime lastSeen = (LocalDateTime) row[3];

            Optional<User> user = userRepo.findById(userId);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId",        userId);
            entry.put("name",          user.map(User::getName).orElse("Noma'lum"));
            entry.put("phone",         user.map(User::getPhone).orElse("-"));
            entry.put("loginCount",    loginCount);      // nechta marta login qilgan
            entry.put("totalRequests", totalReqs);       // jami so'rovlar
            entry.put("lastSeen",      lastSeen);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/timetable/user/{userId}/summary
     * Bitta user bo'yicha: loginCount, totalRequests va barcha sessionlar ro'yxati
     */
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<?> getUserSummary(@PathVariable UUID userId) {
        Optional<User> optUser = userRepo.findById(userId);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User topilmadi");
        }

        List<UsersTimetable> sessions = usersTimetableRepo
                .findAllByUserIdOrderByLastSeenDesc(userId);

        long loginCount   = sessions.size();
        long totalRequests = sessions.stream().mapToLong(UsersTimetable::getRequestCount).sum();

        List<Map<String, Object>> sessionList = new ArrayList<>();
        for (UsersTimetable s : sessions) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date",                    s.getDate());
            entry.put("ip",                      s.getIp());
            entry.put("firstSeen",               s.getFirstSeen());
            entry.put("lastSeen",                s.getLastSeen());
            entry.put("requestCount",            s.getRequestCount());
            entry.put("sessionDurationSeconds",  s.getSessionDurationSeconds());
            entry.put("sessionDurationFormatted",s.getSessionDurationFormatted());
            entry.put("tokenPrefix",             s.getTokenPrefix());
            sessionList.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId",        userId);
        result.put("name",          optUser.get().getName());
        result.put("phone",         optUser.get().getPhone());
        result.put("loginCount",    loginCount);
        result.put("totalRequests", totalRequests);
        result.put("sessions",      sessionList);

        return ResponseEntity.ok(result);
    }

    // ================================================================
    // TODAY
    // ================================================================

    /** GET /api/v1/timetable — bugungi barcha sessionlar */
    @GetMapping
    public ResponseEntity<?> getToday() {
        return ResponseEntity.ok(
                usersTimetableRepo.findAllByDateOrderByLastSeenDesc(LocalDate.now())
        );
    }

    /** GET /api/v1/timetable/user/{userId}/today — bitta userning bugungi sessionlari */
    @GetMapping("/user/{userId}/today")
    public ResponseEntity<?> getUserToday(@PathVariable UUID userId) {
        List<UsersTimetable> list = usersTimetableRepo
                .findAllByUserIdAndDate(userId, LocalDate.now());
        if (list.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Bugun bu user hali tizimga kirmagan");
        }
        return ResponseEntity.ok(list);
    }

    // ================================================================
    // ALL SESSIONS
    // ================================================================

    /** GET /api/v1/timetable/all — barcha yozuvlar */
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(usersTimetableRepo.findAll());
    }

    /** GET /api/v1/timetable/user/{userId} — bitta userning barcha sessionlari */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUser(@PathVariable UUID userId) {
        List<UsersTimetable> list = usersTimetableRepo
                .findAllByUserIdOrderByLastSeenDesc(userId);
        if (list.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Bu user uchun faoliyat topilmadi");
        }
        return ResponseEntity.ok(list);
    }

    // ================================================================
    // DATE RANGE
    // ================================================================

    /** GET /api/v1/timetable/date?date=2026-05-10 */
    @GetMapping("/date")
    public ResponseEntity<?> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(
                usersTimetableRepo.findAllByDateOrderByLastSeenDesc(date)
        );
    }

    /** GET /api/v1/timetable/range?startDate=2026-05-01&endDate=2026-05-10 */
    @GetMapping("/range")
    public ResponseEntity<?> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                usersTimetableRepo.findAllByDateBetweenOrderByLastSeenDesc(startDate, endDate)
        );
    }

    /** GET /api/v1/timetable/user/{userId}/range?startDate=...&endDate=... */
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<?> getUserByRange(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                usersTimetableRepo.findAllByUserIdAndDateBetweenOrderByLastSeenDesc(
                        userId, startDate, endDate)
        );
    }
}
