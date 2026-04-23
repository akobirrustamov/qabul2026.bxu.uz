package com.example.backend.Services.SipuniService;

import com.example.backend.DTO.SipuniCallDTO;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SipuniServiceImpl implements SipuniService {
    private final UserRepo userRepo;

    private static final String SECRET = "0.9hvr22lm18";
    private static final String USER   = "045419";
    private static final String API_URL = "https://sipuni.com/api/statistic/export";

    @Override
    public List<SipuniCallDTO> fetchAndParseCalls(String from, String to) {
        try {
            String hash = buildHash(from, to);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("user",            USER);
            params.add("from",            from);
            params.add("to",              to);
            params.add("type",            "0");
            params.add("state",           "0");
            params.add("timeFrom",        "00:00");
            params.add("timeTo",          "23:59");
            params.add("anonymous",       "0");
            params.add("crmLinks",        "0");
            params.add("dtmfUserAnswer",  "0");
            params.add("firstTime",       "0");
            params.add("fromNumber",      "");
            params.add("hangupinitor",    "");
            params.add("ignoreSpecChar",  "1");
            params.add("names",           "0");
            params.add("numbersInvolved", "0");
            params.add("numbersRinged",   "0");
            params.add("outgoingLine",    "0");
            params.add("rating",          "");
            params.add("showTreeId",      "0");
            params.add("toAnswer",        "");
            params.add("toNumber",        "");
            params.add("tree",            "");
            params.add("hash",            hash);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<String> response = new RestTemplate().postForEntity(
                    API_URL,
                    new HttpEntity<>(params, headers),
                    String.class
            );

            return parseCsv(response.getBody());

        } catch (Exception e) {
            System.err.println(">>> Sipuni API xatosi: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public byte[] getCallAudio(String recordId) {
        try {
            String raw = recordId + "+" + USER + "+" + SECRET;
            byte[] digest = MessageDigest.getInstance("MD5")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            String hash = new String(Hex.encode(digest));

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("id", recordId);
            params.add("user", USER);
            params.add("hash", hash);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<byte[]> response = new RestTemplate().postForEntity(
                    "https://sipuni.com/api/statistic/record",
                    new HttpEntity<>(params, headers),
                    byte[].class
            );

            return response.getBody();

        } catch (Exception e) {
            throw new RuntimeException("Audio olishda xato: " + e.getMessage());
        }
    }

    private String buildHash(String from, String to) throws Exception {
        String raw = String.join("+",
                "0", "0", "0", "0",
                from, "",
                "", "1",
                "0", "0", "0", "0",
                "", "0",
                "0", "00:00", "23:59",
                to, "", "", "",
                "0", USER, SECRET
        );
        byte[] digest = MessageDigest.getInstance("MD5")
                .digest(raw.getBytes(StandardCharsets.UTF_8));
        return new String(Hex.encode(digest));
    }

    private List<SipuniCallDTO> parseCsv(String csv) {
        List<SipuniCallDTO> result = new ArrayList<>();
        if (csv == null || csv.isBlank()) return result;

        csv = csv.replace("\uFEFF", "").replace("\r", "");

        String[] lines = csv.split("\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isBlank()) continue;

            String[] cols = line.split(";", -1);
            if (cols.length < 6) continue;

            try {
                SipuniCallDTO call = new SipuniCallDTO();
                call.setType(cols[0].trim());
                call.setStatus(cols[1].trim());

                // ✅ Sekundsiz vaqtni ham parse qilish
                String timeStr = cols[2].trim();
                if (timeStr.matches("\\d{2}\\.\\d{2}\\.\\d{4} \\d{2}:\\d{2}$")) {
                    timeStr = timeStr + ":00";
                }
                call.setDateTime(LocalDateTime.parse(timeStr, fmt));

                String fromRaw = cols[4].trim();
                String toRaw = cols.length > 5 ? cols[5].trim() : "";

                call.setFromNumber(resolveOperator(fromRaw));
                call.setToNumber(resolveOperator(toRaw));
                call.setDuration(cols.length > 7 ? cols[7].trim() : "");
                call.setRecordId(cols.length > 11 ? cols[11].trim() : "");
                result.add(call);
            } catch (Exception e) {
                System.err.println(">>> Parse xatosi: '" + cols[2].trim() + "'");
            }
        }
        return result;
    }
    private String resolveOperator(String rawNumber) {
        if (rawNumber == null || rawNumber.isBlank()) return rawNumber;

        String digits = rawNumber.replaceAll("[^\\d]", "");

        for (int i = 0; i < digits.length(); i++) {
            for (int len = 3; len <= 4; len++) {
                if (i + len <= digits.length()) {
                    String sub = digits.substring(i, i + len);

                    try {
                        Integer number = Integer.parseInt(sub);

                        Optional<User> userOpt = userRepo.findByCallCenterNumber(number);
                        if (userOpt.isPresent()) {
                            return userOpt.get().getName(); // 🔥 operator name
                        }

                    } catch (Exception ignored) {}
                }
            }
        }

        return rawNumber;
    }
}