package com.example.backend.Controller;

import com.example.backend.DTO.AddUserDto;
import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/operator")
public class OperatorController {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;

    private static final String SIPUNI_USER   = "045419";
    private static final String SIPUNI_SECRET = "0.9hvr22lm18";

    // ================================================================
    // OPERATOR CRUD
    // ================================================================

    @GetMapping
    public HttpEntity<?> getAllOperators() {
        Role byName = roleRepo.findByName(UserRoles.ROLE_ACCOUNTANT);
        List<User> users = userRepo.findAllByRole(byName);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public HttpEntity<?> addAgent(@RequestBody AddUserDto agent) {
        Role byName = roleRepo.findByName(UserRoles.ROLE_ACCOUNTANT);
        List<Role> roles = new ArrayList<>();
        roles.add(byName);

        User user = new User(
                agent.getLogin(),
                passwordEncoder.encode(agent.getPassword()),
                roles,
                agent.getName(),
                agent.getCallCenterNumber() != null ? agent.getCallCenterNumber() : null
        );

        userRepo.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public HttpEntity<?> updateAgent(@RequestBody AddUserDto agent, @PathVariable UUID id) {
        Optional<User> byId = userRepo.findById(id);

        if (byId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Operator topilmadi");
        }

        User user = byId.get();

        if (agent.getPassword() != null && !agent.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(agent.getPassword()));
        }

        if (agent.getCallCenterNumber() != null) {
            user.setCallCenterNumber(agent.getCallCenterNumber());
        }

        user.setPhone(agent.getLogin());
        user.setName(agent.getName());

        userRepo.save(user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public HttpEntity<?> deleteAgent(@PathVariable UUID id) {
        Optional<User> byId = userRepo.findById(id);

        if (byId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Operator topilmadi");
        }

        userRepo.delete(byId.get());
        return ResponseEntity.ok("O'chirildi");
    }

    // ================================================================
    // SIPUNI STATISTIKA
    // ================================================================

    @GetMapping("/sipuni-statistic")
    public HttpEntity<?> getSipuniStatistic(
            @RequestParam String from,
            @RequestParam String to
    ) {
        try {
            // 1. Sipunidan operatorlar ro'yxatini olish
            Map<Integer, String> sipuniOperators = fetchSipuniOperators();

            // 2. DB operatorlari
            List<User> dbUsers = userRepo.findAllByCallCenterNumberIsNotNull();
            Map<Integer, User> dbMap = new HashMap<>();
            for (User u : dbUsers) {
                if (u.getCallCenterNumber() != null) {
                    dbMap.put(u.getCallCenterNumber(), u);
                }
            }

            // 3. Statistika CSV ni olish
            String csv = fetchStatisticCsv(from, to);
            if (csv == null || csv.toLowerCase().contains("<html")) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("Sipuni noto'g'ri javob qaytardi");
            }

            // 4. CSV → parse → summary
            List<Map<String, String>> rows = parseCsv(csv);
            List<Map<String, Object>> summary = buildOperatorSummary(rows, sipuniOperators, dbMap);

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Sipuni xatolik: " + e.getMessage());
        }
    }

    // ----------------------------------------------------------------
    // Sipuni dan operatorlar ro'yxatini olish
    // URL: https://sipuni.com/api/statistic/operators
    // Hash: md5(user + "+" + secret)
    // ----------------------------------------------------------------
    private Map<Integer, String> fetchSipuniOperators() {
        Map<Integer, String> result = new LinkedHashMap<>();
        try {
            String hash = md5(SIPUNI_USER + "+" + SIPUNI_SECRET);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("user", SIPUNI_USER);
            body.add("hash", hash);

            ResponseEntity<String> resp = postForm(
                    "https://sipuni.com/api/statistic/operators", body);

            String csv = resp.getBody();
            if (csv == null || csv.isBlank()) return result;

            String[] lines = csv.replace("\uFEFF", "").split("\\r?\\n");
            if (lines.length < 2) return result;

            String[] headers = lines[0].split(";");
            int numIdx  = findHeaderIndex(headers, "number", "номер", "num", "id");
            int nameIdx = findHeaderIndex(headers, "name", "имя", "пользователь", "user");

            if (numIdx  < 0) numIdx  = 0;
            if (nameIdx < 0) nameIdx = 1;

            for (int i = 1; i < lines.length; i++) {
                if (lines[i].isBlank()) continue;
                String[] parts = lines[i].split(";", -1);
                if (parts.length <= Math.max(numIdx, nameIdx)) continue;
                try {
                    Integer num = extractLeadingInt(parts[numIdx].trim());
                    if (num == null) continue;
                    String name = nameIdx < parts.length ? parts[nameIdx].trim() : "";
                    if (!name.isBlank()) result.put(num, name);
                } catch (Exception ignore) {}
            }

        } catch (Exception e) {
            System.err.println("[Sipuni] Operatorlar olishda xatolik: " + e.getMessage());
        }
        return result;
    }

    // ----------------------------------------------------------------
    // Sipuni export CSV ni olish
    // ----------------------------------------------------------------
    private String fetchStatisticCsv(String from, String to) throws Exception {
        String rating = "";

        String hashString = String.join("+",
                "1",        // anonymous
                "0",        // crmLinks
                "0",        // dtmfUserAnswer
                "0",        // firstTime
                from,       // from
                "",         // fromNumber
                "1",        // hangupinitor
                "1",        // ignoreSpecChar
                "1",        // names
                "1",        // numbersInvolved
                "1",        // numbersRinged
                "1",        // outgoingLine
                rating,     // rating
                "1",        // showTreeId
                "0",        // state
                "00:00",    // timeFrom
                "23:59",    // timeTo
                to,         // to
                "",         // toAnswer
                "",         // toNumber
                "",         // tree
                "0",        // type
                SIPUNI_USER,
                SIPUNI_SECRET
        );
        String hash = md5(hashString);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("anonymous",       "1");
        body.add("crmLinks",        "0");
        body.add("dtmfUserAnswer",  "0");
        body.add("firstTime",       "0");
        body.add("from",            from);
        body.add("fromNumber",      "");
        body.add("hangupinitor",    "1");
        body.add("ignoreSpecChar",  "1");
        body.add("names",           "1");
        body.add("numbersInvolved", "1");
        body.add("numbersRinged",   "1");
        body.add("outgoingLine",    "1");
        body.add("rating",          rating);
        body.add("showTreeId",      "1");
        body.add("state",           "0");
        body.add("timeFrom",        "00:00");
        body.add("timeTo",          "23:59");
        body.add("to",              to);
        body.add("toAnswer",        "");
        body.add("toNumber",        "");
        body.add("tree",            "");
        body.add("type",            "0");
        body.add("user",            SIPUNI_USER);
        body.add("hash",            hash);

        ResponseEntity<String> resp = postForm(
                "https://sipuni.com/api/statistic/export", body);
        return resp.getBody();
    }

    // ----------------------------------------------------------------
    // Asosiy statistika hisoblash
    // ----------------------------------------------------------------
    private List<Map<String, Object>> buildOperatorSummary(
            List<Map<String, String>> rows,
            Map<Integer, String>      sipuniOperators,
            Map<Integer, User>        dbMap
    ) {
        Map<Integer, Map<String, Object>> summaryMap = new LinkedHashMap<>();

        // Barcha Sipuni operatorlarni avval init qilamiz
        for (Map.Entry<Integer, String> e : sipuniOperators.entrySet()) {
            int num = e.getKey();
            String sipuniName = e.getValue();
            User dbUser = dbMap.get(num);

            summaryMap.put(num, initEntry(
                    num,
                    dbUser != null ? dbUser.getName() : sipuniName

            ));
        }

        // Har bir qo'ng'iroq qatorini qayta ishlash
        for (Map<String, String> row : rows) {
            Integer opNum = detectOperatorNumber(row, sipuniOperators.keySet());
            if (opNum == null) continue;

            summaryMap.computeIfAbsent(opNum, k -> {
                User dbUser = dbMap.get(k);
                String name = dbUser != null ? dbUser.getName() : "Operator " + k;
                return initEntry(k, name);
            });

            Map<String, Object> stat = summaryMap.get(opNum);

            String callType  = detectCallType(row);
            String callState = detectCallState(row);
            int    duration  = parseDurationSeconds(row);

            boolean isAnswered = "ANSWERED".equals(callState);
            boolean isMissed   = "MISSED".equals(callState);
            boolean isOutgoing = "OUTGOING".equals(callType);
            // O'tkazib yuborilganlar ba'zan callType=="" keladi — ular ham kiruvchi
            boolean isIncoming = "INCOMING".equals(callType) || isMissed;

            inc(stat, "Jami qo'ng'iroqlar");

            if (isIncoming) {
                inc(stat, "Kiruvchi");
                if (isAnswered) {
                    inc(stat, "Kiruvchi (qabul qilingan)");
                    addInt(stat, "_incomingTime",     duration);
                    inc(stat, "_incomingAnswered");
                }
                if (isMissed) {
                    inc(stat, "Kiruvchi (o'tkazib yuborilgan)");
                }
            }

            if (isOutgoing) {
                inc(stat, "Chiquvchi");
                addInt(stat, "_outgoingTotalTime", duration);
                if (isAnswered) {
                    inc(stat, "Javob berilgan chiquvchi");
                    addInt(stat, "_outgoingTime",    duration);
                    inc(stat, "_outgoingAnswered");
                }
                // Unikal raqamlar (chiquvchi)
                String toNum = getFirstValue(row, "Куда", "toNumber");
                if (!toNum.isBlank()) {
                    @SuppressWarnings("unchecked")
                    Set<String> uniq = (Set<String>) stat.get("_uniqueContacts");
                    uniq.add(toNum);
                }
            }

            // Javob tezligi (kiruvchi + javob berilgan)
            if (isIncoming && isAnswered) {
                int waitSec = parseWaitTime(row);
                if (waitSec > 0) {
                    addInt(stat, "_waitTime", waitSec);
                    inc(stat, "_waitCount");
                }
            }
        }

        // Final format
        for (Map<String, Object> stat : summaryMap.values()) {
            int inTime   = getIntStat(stat, "_incomingTime");
            int inAns    = getIntStat(stat, "_incomingAnswered");
            int outTime  = getIntStat(stat, "_outgoingTime");
            int outTotal = getIntStat(stat, "_outgoingTotalTime");
            int outAns   = getIntStat(stat, "_outgoingAnswered");
            int waitTime = getIntStat(stat, "_waitTime");
            int waitCnt  = getIntStat(stat, "_waitCount");
            int incoming = getIntStat(stat, "Kiruvchi");
            int outgoing = getIntStat(stat, "Chiquvchi");
            stat.put("Jami qo'ng'iroqlar", incoming + outgoing);

            @SuppressWarnings("unchecked")
            Set<String> uniq = (Set<String>) stat.get("_uniqueContacts");

            int totalAnsCount = inAns + outAns;
            int avgTalk    = totalAnsCount > 0 ? (inTime + outTime) / totalAnsCount : 0;
            int avgInTime  = inAns  > 0 ? inTime  / inAns  : 0;
            int avgOutTime = outAns > 0 ? outTime / outAns  : 0;
            int avgWait    = waitCnt > 0 ? waitTime / waitCnt : 0;

            stat.put("Jami gaplashgan vaqt",      fmt(inTime + outTime));
            stat.put("O'rtacha gaplashish vaqti",  fmt(avgTalk));
            stat.put("O'rtacha javob tezligi",     fmt(avgWait));
            stat.put("Vaqt (chiquvchi)",            fmt(outTotal));
            stat.put("O'rtacha kiruvchi vaqt",      fmt(avgInTime));
            stat.put("O'rtacha chiquvchi vaqt",     fmt(avgOutTime));
            stat.put("Unikal kontaktlar (chiq.)",   uniq != null ? uniq.size() : 0);

            // Ichki maydonlarni o'chirish
            stat.remove("_incomingTime");
            stat.remove("_incomingAnswered");
            stat.remove("_outgoingTime");
            stat.remove("_outgoingTotalTime");
            stat.remove("_outgoingAnswered");
            stat.remove("_waitTime");
            stat.remove("_waitCount");
            stat.remove("_uniqueContacts");
        }

        return new ArrayList<>(summaryMap.values());
    }

    // ================================================================
    // YORDAMCHI METODLAR
    // ================================================================

    /** Yangi operator statistika entry'sini yaratadi */
    private Map<String, Object> initEntry(Integer num, String name) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("Operator",                   name);
        e.put("Sipuni raqami",              num == null ? "Noma'lum" : num);
        e.put("Kiruvchi",                         0);
        e.put("Kiruvchi (qabul qilingan)",        0);
        e.put("Kiruvchi (o'tkazib yuborilgan)",   0);
        e.put("Chiquvchi",                  0);
        e.put("Javob berilgan chiquvchi",   0);
        e.put("Jami qo'ng'iroqlar",         0);
        // Ichki yig'ish maydonlari
        e.put("_incomingTime",     0);
        e.put("_incomingAnswered", 0);
        e.put("_outgoingTime",     0);
        e.put("_outgoingTotalTime",0);
        e.put("_outgoingAnswered", 0);
        e.put("_waitTime",         0);
        e.put("_waitCount",        0);
        e.put("_uniqueContacts",   new HashSet<String>());
        return e;
    }

    /**
     * Operator raqamini aniqlaydi.
     * "201 (Yangi hodim)" → 201
     * Hardcode emas — barcha Sipuni operatorlari uchun ishlaydi.
     */
    private Integer detectOperatorNumber(Map<String, String> row, Set<Integer> knownNumbers) {
        String toAnswer        = getFirstValue(row, "Кто ответил", "toAnswer", "Ответил");
        String fromNumber      = getFirstValue(row, "Откуда", "fromNumber", "С какого номера");
        String toNumber        = getFirstValue(row, "Куда", "toNumber");
        String numbersInvolved = getFirstValue(row, "Кто разговаривал", "numbersInvolved");
        String callType        = detectCallType(row);

        // Kiruvchi: kim javob berdi
        Integer toAns = extractOperatorCode(toAnswer, knownNumbers);
        if (toAns != null) return toAns;

        // Chiquvchi: kim qo'ng'iroq qildi
        if ("OUTGOING".equals(callType)) {
            Integer from = extractOperatorCode(fromNumber, knownNumbers);
            if (from != null) return from;
        }

        // numbersInvolved dan qidirish
        if (numbersInvolved != null && !numbersInvolved.isBlank()) {
            for (Integer num : knownNumbers) {
                if (numbersInvolved.contains(String.valueOf(num))) return num;
            }
        }

        Integer toNum = extractOperatorCode(toNumber, knownNumbers);
        if (toNum != null) return toNum;

        return extractOperatorCode(fromNumber, knownNumbers);
    }

    /**
     * Matndan operator raqamini regex bilan ajratib oladi.
     * "201 (Новый сотрудник)" → 201
     * Faqat knownNumbers ichidagi raqamlarni qaytaradi.
     */
    private Integer extractOperatorCode(String value, Set<Integer> known) {
        if (value == null || value.isBlank()) return null;
        Matcher m = Pattern.compile("\\b(\\d{3,4})\\b").matcher(value.trim());
        while (m.find()) {
            try {
                int n = Integer.parseInt(m.group(1));
                if (known.isEmpty() || known.contains(n)) return n;
            } catch (Exception ignore) {}
        }
        return null;
    }

    /** Qo'ng'iroq turi: INCOMING / OUTGOING / "" */
    private String detectCallType(Map<String, String> row) {
        String type = getFirstValue(row, "type", "TYPE", "Тип", "callType", "CALLTYPE");
        if (type == null || type.isBlank()) return "";
        type = type.trim().toLowerCase();
        if (type.contains("вход") || "1".equals(type)) return "INCOMING";
        if (type.contains("исход") || "2".equals(type)) return "OUTGOING";
        return "";
    }

    /** Qo'ng'iroq holati: ANSWERED / MISSED / "" */
    private String detectCallState(Map<String, String> row) {
        String state = getFirstValue(row, "Статус", "state", "STATUS",
                "Статус звонка", "Состояние");
        if (state == null || state.isBlank()) return "";
        state = state.trim().toLowerCase();
        // MISSED avval (chunki "отвечен" "не отвечен" ichida ham bor)
        if (state.contains("не отвеч") || state.contains("пропущ")
                || state.contains("нет ответа") || "1".equals(state)) return "MISSED";
        if (state.contains("отвечен") || state.contains("принят")
                || state.contains("разговор") || state.contains("соедин")
                || "2".equals(state)) return "ANSWERED";
        return "";
    }

    /**
     * Gaplashgan vaqtni sekundda qaytaradi.
     * "00:02:35" → 155  |  "155" → 155
     */
    private int parseDurationSeconds(Map<String, String> row) {
        for (Map.Entry<String, String> entry : row.entrySet()) {
            String key = entry.getKey().toLowerCase();
            if (!key.contains("duration") && !key.contains("разговор") &&
                    !key.contains("talk")     && !key.contains("billsec")  &&
                    !key.contains("длитель") && !key.contains("время разг")) continue;

            String raw = entry.getValue();
            if (raw == null || raw.isBlank()) continue;
            return parseTimeValue(raw.trim());
        }
        return 0;
    }

    /** Kutish vaqtini (ring time) sekundda qaytaradi */
    private int parseWaitTime(Map<String, String> row) {
        for (Map.Entry<String, String> entry : row.entrySet()) {
            String key = entry.getKey().toLowerCase();
            if (!key.contains("ожидан") && !key.contains("wait") &&
                    !key.contains("ring")   && !key.contains("ringtime")) continue;
            String val = entry.getValue();
            if (val == null || val.isBlank()) continue;
            return parseTimeValue(val.trim());
        }
        return 0;
    }

    /** "00:02:35" yoki "155" ni sekundga o'tkazadi */
    private int parseTimeValue(String raw) {
        if (raw == null || raw.isBlank()) return 0;
        try {
            if (raw.matches("\\d+")) return Integer.parseInt(raw);
            if (raw.contains(":")) {
                String[] parts = raw.split(":");
                if (parts.length == 3)
                    return Integer.parseInt(parts[0]) * 3600
                            + Integer.parseInt(parts[1]) * 60
                            + Integer.parseInt(parts[2]);
                if (parts.length == 2)
                    return Integer.parseInt(parts[0]) * 60
                            + Integer.parseInt(parts[1]);
            }
        } catch (Exception ignore) {}
        return 0;
    }

    /** CSV ni parse qiladi */
    private List<Map<String, String>> parseCsv(String csv) {
        List<Map<String, String>> result = new ArrayList<>();
        if (csv == null || csv.isBlank()) return result;

        String[] lines = csv.replace("\uFEFF", "").split("\\r?\\n");
        if (lines.length < 2) return result;

        String[] headers = lines[0].split(";", -1);

        for (int i = 1; i < lines.length; i++) {
            if (lines[i].isBlank()) continue;
            String[] vals = lines[i].split(";", -1);
            Map<String, String> row = new LinkedHashMap<>();
            for (int j = 0; j < headers.length; j++) {
                row.put(headers[j].trim(),
                        j < vals.length ? vals[j].trim() : "");
            }
            result.add(row);
        }
        return result;
    }

    /** Ko'p nomli ustunlardan birinchi bo'sh bo'lmagan qiymatni oladi */
    private String getFirstValue(Map<String, String> row, String... keys) {
        if (row == null || row.isEmpty()) return "";
        for (String target : keys) {
            for (Map.Entry<String, String> e : row.entrySet()) {
                if (e.getKey() != null &&
                        e.getKey().trim().equalsIgnoreCase(target.trim())) {
                    String v = e.getValue();
                    if (v != null && !v.isBlank()) return v.trim();
                }
            }
        }
        return "";
    }

    /** HTTP POST form so'rov */
    private ResponseEntity<String> postForm(String url,
                                            MultiValueMap<String, String> body) {
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        return rt.postForEntity(url, new HttpEntity<>(body, headers), String.class);
    }

    /** MD5 hash */
    private String md5(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes("UTF-8"));
        BigInteger num = new BigInteger(1, digest);
        String hex = num.toString(16);
        while (hex.length() < 32) hex = "0" + hex;
        return hex;
    }

    /** Sekundni HH:mm:ss ga o'giradi */
    private String fmt(int sec) {
        int h = sec / 3600;
        int m = (sec % 3600) / 60;
        int s = sec % 60;
        return String.format("%02d:%02d:%02d", h, m, s);
    }

    // int stat yordamchilari
    private void inc(Map<String, Object> m, String key) {
        m.put(key, getIntStat(m, key) + 1);
    }

    private void addInt(Map<String, Object> m, String key, int val) {
        m.put(key, getIntStat(m, key) + val);
    }

    private int getIntStat(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Integer) return (Integer) v;
        if (v instanceof Long)    return ((Long) v).intValue();
        return 0;
    }

    /** Header indeksini qidiradi (case-insensitive) */
    private int findHeaderIndex(String[] headers, String... candidates) {
        for (int i = 0; i < headers.length; i++) {
            String h = headers[i].trim().toLowerCase();
            for (String c : candidates) {
                if (h.contains(c.toLowerCase())) return i;
            }
        }
        return -1;
    }

    /** "201 (Имя)" kabi stringdan birinchi integer raqamni oladi */
    private Integer extractLeadingInt(String s) {
        Matcher m = Pattern.compile("^(\\d+)").matcher(s);
        if (m.find()) {
            try { return Integer.parseInt(m.group(1)); }
            catch (Exception ignore) {}
        }
        return null;
    }
}