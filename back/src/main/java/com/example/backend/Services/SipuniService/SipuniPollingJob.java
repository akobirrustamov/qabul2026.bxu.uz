package com.example.backend.Services.SipuniService;

import com.example.backend.Controller.AbuturientController;
import com.example.backend.DTO.AbuturientDTO;
import com.example.backend.DTO.CrmLeadCommentDTO;
import com.example.backend.DTO.SipuniCallDTO;
import com.example.backend.Entity.CrmLead;
import com.example.backend.Entity.CrmLeadComment;
import com.example.backend.Entity.User;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.CrmLeadCommentRepo;
import com.example.backend.Repository.CrmLeadRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.CrmLeadsService.CrmLeadsService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
public class SipuniPollingJob {

    private final AbuturientController abuturientController;
    private final SipuniService sipuniService;
    private final AbuturientRepo applicantRepo;
    private final CrmLeadRepo crmLeadRepo;
    private final CrmLeadCommentRepo crmLeadCommentRepo;
    private final CrmLeadsService crmLeadService;
    private final UserRepo userRepo;

    // ── Holat ──────────────────────────────────────────────────────────────
    // Server startdan keyingi birinchi pollda lastChecked = now()-2min bo'ladi
    // (10 daqiqa emas — 10 daqiqa juda ko'p call olib kelishi mumkin)
    private volatile LocalDateTime lastChecked = LocalDateTime.now().minusMinutes(2);

    // ⚡ Xotiradagi processedIds — bir xil callni ikki marta qayta ishlashni to'xtatadi
    // Key: recordId (agar bo'lsa) yoki "phone_datetime" kombinatsiyasi
    // ConcurrentHashMap — thread-safe
    private final Set<String> processedCallKeys = Collections.newSetFromMap(new ConcurrentHashMap<>());

    // Parallel pollning oldini olish
    private final AtomicBoolean isPolling = new AtomicBoolean(false);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
    private static final DateTimeFormatter DATETIME_SHORT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    // ── Polling (har 10 sekund) ───────────────────────────────────────────────
    @Scheduled(fixedDelay = 10_000)
    public void pollNewCalls() {
        String now = LocalDateTime.now().format(DATETIME_FMT);

        // Agar oldingi poll hali tugamagan bo'lsa — o'tkazib yubor
        if (!isPolling.compareAndSet(false, true)) {
            return;
        }

        LocalDateTime pollStartTime = LocalDateTime.now();
        LocalDateTime checkFrom = lastChecked.minusMinutes(2);

        try {
            String today = LocalDate.now().format(DATE_FMT);

            List<SipuniCallDTO> calls = sipuniService.fetchAndParseCalls(today, today);

            if (calls.isEmpty()) {
                lastChecked = pollStartTime;
                return;
            }

            // Statistika
            int totalIncoming = 0, tooOld = 0, cacheHit = 0, yangi = 0, skipped = 0;

            for (SipuniCallDTO call : calls) {
                if (call.getDateTime() == null) continue;

                // Kiruvchi emas
                String type = call.getType();
                if (type == null) continue;

// 🔥 hamma turdagi calllar o'tadi
                if (!type.contains("Вход") && !type.contains("Исход") && !type.contains("Внутрен")) {
                    continue;
                }
                totalIncoming++;

                // Eski call
                if (!call.getDateTime().isAfter(checkFrom)) {
                    tooOld++;
                    continue;
                }

                String callKey = buildCallKey(call);
                if (callKey == null) {

                    continue;
                }

                // Cache da bor
                if (processedCallKeys.contains(callKey)) {
                    cacheHit++;

                    continue;
                }

                String phone = extractClientPhone(call);
                if (phone == null || phone.isBlank()) continue;

                String dbPhone = convertToDbFormat(phone);
                if (dbPhone == null) continue;

                boolean processed = processCall(dbPhone, call);
                if (processed) {
                    processedCallKeys.add(callKey);
                    yangi++;
                } else {
                    skipped++;
                }
            }


            cleanOldKeys();

        } catch (Exception e) {
            System.err.printf("[%s] >>> [POLL] XATO: %s%n", now, e.getMessage());
            e.printStackTrace();
        } finally {
            lastChecked = pollStartTime;
            isPolling.set(false);

        }
    }

    /**
     * Call uchun unique key yaratish
     * RecordId bo'lsa — ishlatamiz (eng ishonchli)
     * Bo'lmasa — phone + datetime kombinatsiyasi
     */
    private String buildCallKey(SipuniCallDTO call) {
        String recordId = call.getRecordId();
        if (recordId != null && !recordId.isBlank()) {
            return "rid_" + recordId;
        }

        // Fallback: phone + time (sekundsiz — Sipuni ba'zan sekund bermaydi)
        String phone = extractClientPhone(call);
        if (phone == null || phone.isBlank()) return null;
        if (call.getDateTime() == null) return null;

        String time = call.getDateTime().format(DATETIME_SHORT);
        return "pt_" + phone + "_" + time;
    }

    /**
     * Callni qayta ishlash — mavjud lead ga comment yoki yangi lead yaratish
     * @return true — ishlov berildi, false — allaqachon mavjud yoki xato
     */
    private boolean processCall(String dbPhone, SipuniCallDTO call) {
        String now = LocalDateTime.now().format(DATETIME_FMT);
        try {
            CrmLead lead = findLeadByPhone(dbPhone);

            if (lead == null) {
                boolean applicantExists = applicantRepo.findByPhone1(dbPhone).isPresent();
                if (!applicantExists) {
                    handleNew(dbPhone);
                    lead = findLeadByPhone(dbPhone);

                }
                if (lead != null) {
                    addComment(lead, call, "Sipuni call");
                }
                return true;
            }



            if (isCallAlreadyInDb(lead, call)) {

                return false;
            }

            addComment(lead, call, "Sipuni call");
            return true;

        } catch (Exception e) {
            System.err.printf("[%s] >>> [PROCESS] XATO [%s]: %s%n", now, dbPhone, e.getMessage());
            return false;
        }
    }

    /**
     * DB da comment mavjudligini tekshirish
     * Faqat server restart bo'lgandan keyin birinchi pollda kerak
     * (processedCallKeys xotira tozalanganidan keyin)
     */
    private boolean isCallAlreadyInDb(CrmLead lead, SipuniCallDTO call) {
        String recordId = call.getRecordId();
        String callTime = call.getDateTime() != null
                ? call.getDateTime().format(DATETIME_SHORT)
                : null;

        List<CrmLeadComment> comments =
                crmLeadCommentRepo.findByCrmLeadIdOrderByCreatedAtDesc(lead.getId());

        for (CrmLeadComment comment : comments) {
            String desc = comment.getDescription();
            if (desc == null) continue;

            // RecordId bo'yicha tekshirish
            if (recordId != null && !recordId.isBlank() && desc.contains(recordId)) {
                return true;
            }

            // Vaqt + raqam bo'yicha tekshirish
//            if (callTime != null
//                    && desc.contains(callTime)
//                    && call.getFromNumber() != null
//                    && desc.contains(call.getFromNumber())) {
//                return true;
//            }
        }
        return false;
    }

    /**
     * Eski (2 soatdan eski) keylarni xotiradan o'chirish
     * processedCallKeys cheksiz o'smaydi
     */
    private void cleanOldKeys() {
        // Har 1000 ta keydan oshsa tozalash (taxminiy — vaqt saqlashni murakkablashtirmaslik uchun)
        if (processedCallKeys.size() > 1000) {
            processedCallKeys.clear();
        }
    }

    // ── Phone conversion ──────────────────────────────────────────────────
    private String convertToDbFormat(String sipuniPhone) {
        if (sipuniPhone == null || sipuniPhone.isBlank()) return null;

        String raw = sipuniPhone.trim();
        String digits = raw.replaceAll("[^\\d]", "");

        if (digits.isBlank()) return null;

        // 914184415 -> +998914184415
        if (digits.length() == 9) {
            return "+998" + digits;
        }

        // 998914184415 -> +998914184415
        if (digits.length() == 12 && digits.startsWith("998")) {
            return "+" + digits;
        }

        // +998914184415 -> +998914184415
        if (raw.startsWith("+") && digits.length() == 12 && digits.startsWith("998")) {
            return "+" + digits;
        }

        // qolgan hamma variantlar skip
        System.out.printf(">>> Skip non-UZ phone: %s (digits: %s, len: %d)%n",
                sipuniPhone, digits, digits.length());
        return null;
    }
    
    private String resolveOperator(String rawNumber) {
        if (rawNumber == null || rawNumber.isBlank()) return rawNumber;

        String digits = rawNumber.replaceAll("[^\\d]", "");

        // faqat haqiqiy ichki operator raqami bo'lsa qidiramiz
        if (digits.length() == 3 || digits.length() == 4 || digits.length() == 7) {
            try {
                Integer number = Integer.parseInt(digits);

                Optional<User> userOpt = userRepo.findByCallCenterNumber(number);
                if (userOpt.isPresent()) {
                    return userOpt.get().getName();
                }
            } catch (Exception ignored) {
            }
        }

        // aks holda tashqi telefon raqamini o'zini qaytaramiz
        return rawNumber;
    }

    // ── Lead lookup ───────────────────────────────────────────────────────
    private boolean isLeadExists(String dbPhone) {
        if (applicantRepo.findByPhone1(dbPhone).isPresent()) return true;
        if (crmLeadRepo.findTopByPhoneOrderByCreatedAtDesc(dbPhone).isPresent()) return true;

        // Plus siz variant ham tekshirish
        String withoutPlus = dbPhone.startsWith("+") ? dbPhone.substring(1) : dbPhone;
        if (applicantRepo.findByPhone1(withoutPlus).isPresent()) return true;
        if (crmLeadRepo.findTopByPhoneOrderByCreatedAtDesc(withoutPlus).isPresent()) return true;

        return false;
    }

    private CrmLead findLeadByPhone(String dbPhone) {
        Optional<CrmLead> lead = crmLeadRepo.findTopByPhoneOrderByCreatedAtDesc(dbPhone);
        if (lead.isPresent()) return lead.get();

        String withoutPlus = dbPhone.startsWith("+") ? dbPhone.substring(1) : dbPhone;
        return crmLeadRepo.findTopByPhoneOrderByCreatedAtDesc(withoutPlus).orElse(null);
    }

    // ── Comment yozish ────────────────────────────────────────────────────
    private void addComment(CrmLead lead, SipuniCallDTO call, String prefix) {
        try {
            User bot = userRepo.findByPhone("crm-bot").orElse(null);
            if (bot == null) {
                System.err.println(">>> crm-bot user not found in DB!");
                return;
            }

            String time = call.getDateTime() != null
                    ? call.getDateTime().format(DATETIME_FMT)
                    : "unknown";

            String recordIdInfo = (call.getRecordId() != null && !call.getRecordId().isBlank())
                    ? " [ID:" + call.getRecordId() + "]"
                    : "";

            String text = String.format(
                    "%s | %s | %s → %s | %s sek | %s%s",
                    prefix,
                    time,
                    call.getFromNumber(),
                    call.getToNumber(),
                    call.getDuration(),
                    call.getStatus(),
                    recordIdInfo
            );

            CrmLeadCommentDTO dto = new CrmLeadCommentDTO();
            dto.setCommenterId(bot.getId());
            dto.setDescription(text);
            dto.setCreatedAt(call.getDateTime());

            crmLeadService.addCommentSipuni(lead.getId(), dto);

        } catch (Exception e) {
            System.err.println(">>> addComment error: " + e.getMessage());
        }
    }

    // ── Yangi lead yaratish ───────────────────────────────────────────────
    private void handleNew(String dbPhone) {
        try {
            AbuturientDTO dto = new AbuturientDTO();
            dto.setPhone(dbPhone);
            abuturientController.addAbuturientWithoutSmsSipuni(dto);
        } catch (Exception e) {
            System.err.println(">>> handleNew error [" + dbPhone + "]: " + e.getMessage());
        }
    }

    // ── Manual import (button bosganda) ───────────────────────────────────
    /**
     * Bugungi barcha calllarni import qilish
     * Dublikat himoyasi bilan
     */
    public void importAllToday() {
        String now = LocalDateTime.now().format(DATETIME_FMT);

        String today = LocalDate.now().format(DATE_FMT);
        List<SipuniCallDTO> calls = sipuniService.fetchAndParseCalls(today, today);

        Set<String> sessionKeys = new HashSet<>();
        int yangiLead = 0, yangiComment = 0, skipped = 0;

        for (SipuniCallDTO call : calls) {
            String type = call.getType();
            if (type == null) continue;

// 🔥 hamma turdagi calllar o'tadi
            if (!type.contains("Вход") && !type.contains("Исход") && !type.contains("Внутрен")) {
                continue;
            }

            String callKey = buildCallKey(call);
            if (callKey == null) continue;

            if (sessionKeys.contains(callKey)) {
                skipped++;
                continue;
            }
            sessionKeys.add(callKey);
            processedCallKeys.add(callKey);

            String phone = extractClientPhone(call);
            if (phone == null || phone.isBlank()) continue;

            String dbPhone = convertToDbFormat(phone);
            if (dbPhone == null) continue;

            boolean applicantExists = applicantRepo.findByPhone1(dbPhone).isPresent();
            CrmLead lead = findLeadByPhone(dbPhone);

            if (lead != null && isCallAlreadyInDb(lead, call)) {
                skipped++;
                continue;
            }

            if (!applicantExists || lead == null) {
                if (!applicantExists) {
                    handleNew(dbPhone);
                    yangiLead++;
                }
                CrmLead newLead = findLeadByPhone(dbPhone);
                if (newLead != null) {
                    addComment(newLead, call, "Sipuni import");
                    yangiComment++;
                } else {
                    System.err.printf("[%s] >>> [IMPORT] Lead yaratilgandan keyin ham topilmadi: %s%n", now, dbPhone);
                }
            } else {
                addComment(lead, call, "Sipuni import");
                yangiComment++;
            }
        }
        lastChecked = LocalDateTime.now();
    }

    private String extractClientPhone(SipuniCallDTO call) {
        String type = call.getType();
        if (type == null) return null;

        // ❌ internal skip
        if (type.contains("Внутрен")) return null;

        // 📞 outgoing → client TO da
        if (type.contains("Исход")) {
            return call.getToNumber();
        }

        // 📞 incoming → client FROM da
        return call.getFromNumber();
    }
}