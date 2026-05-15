package com.example.backend.Security;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UsersTimetable;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Repository.UsersTimetableRepo;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@CrossOrigin
@Configuration
@RequiredArgsConstructor
public class MyFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final UsersTimetableRepo usersTimetableRepo;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/access",
            "/api/v1/auth/refresh"
    );

    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
            "/api/v1/file/getFile"
    );

    private boolean isPublicPath(HttpServletRequest request) {
        String rawPath = request.getRequestURI();
        // Normalize: if path doesn't start with /api, treat it as public
        if (!rawPath.startsWith("/api")) return true;
        String path = rawPath;
        String method = request.getMethod();

        if (PUBLIC_PATHS.contains(path)) return true;
        if (PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith)) return true;
        if (path.startsWith("/api/v1/auth/login") && "POST".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/test/add/update") && "GET".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/news") && "GET".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/abuturient") && "POST".equalsIgnoreCase(method)) return true;
        if (path.matches("/api/v1/sms/[^/]+/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.startsWith("/api/v1/region") && "GET".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/district") && "GET".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/abuturient/user-info") && "PUT".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/appeal-type") && "GET".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/abuturient/data-form") && "PUT".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/abuturient/user-info/edit") && "PUT".equalsIgnoreCase(method)) return true;
        if (path.startsWith("/api/v1/education-type") && "GET".equalsIgnoreCase(method)) return true;
        if (path.matches("/api/v1/education-field/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/abuturient/contract/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/education-form/active/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/abuturient/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/abuturient/isdtm/[^/]+")
                && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/test/result/[^/]+")
                && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/history-of-abuturient/[^/]+")
                && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/test/score/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/test/[^/]+")
                && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.matches("/api/v1/test/result/[^/]+")
                && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
        response.getWriter().flush();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws IOException, ServletException {

        System.out.println("Filtering request: " + request.getMethod() + " " + request.getRequestURI());

        if (isPublicPath(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || authHeader.isBlank()) {
            sendUnauthorized(response, "Authorization header missing");
            return;
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        try {
            String subject = jwtService.extractSubjectFromJwt(token);
            User user = (User) userRepo.findById(UUID.fromString(subject)).orElseThrow();

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                user.getAuthorities()
                        );
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }

            // ── Timetable: IP + token ni saqlash ──────────────────
            recordUserActivity(user, token, request);
            // ─────────────────────────────────────────────────────

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            sendUnauthorized(response, "Token expired");
        } catch (IllegalArgumentException e) {
            sendUnauthorized(response, "Invalid token format");
        } catch (Exception e) {
            sendUnauthorized(response, "Invalid token");
        }
    }

    /**
     * Har bir authenticated so'rovda user faoliyatini saqlaydi.
     * Har kuni bitta yozuv: firstSeen (birinchi so'rov), lastSeen (har so'rovda yangilanadi),
     * requestCount (oshib boradi), ip va token yangilanadi.
     */
    private void recordUserActivity(User user, String token, HttpServletRequest request) {
        try {
            String ip          = extractIp(request);
            String tokenHash   = sha256(token);
            String tokenPrefix = token.length() > 60 ? token.substring(0, 60) : token;
            LocalDate today    = LocalDate.now();
            LocalDateTime now  = LocalDateTime.now();

            Optional<UsersTimetable> existing = usersTimetableRepo.findByTokenHash(tokenHash);

            if (existing.isPresent()) {
                // Xuddi shu token — requestCount oshiramiz
                UsersTimetable timetable = existing.get();
                timetable.setLastSeen(now);
                timetable.setIp(ip);
                timetable.setRequestCount(timetable.getRequestCount() + 1);
                usersTimetableRepo.save(timetable);
            } else {
                // Yangi token — yangi yozuv
                UsersTimetable timetable = UsersTimetable.builder()
                        .user(user)
                        .ip(ip)
                        .tokenHash(tokenHash)
                        .tokenPrefix(tokenPrefix)
                        .date(today)
                        .firstSeen(now)
                        .lastSeen(now)
                        .requestCount(1)
                        .build();
                usersTimetableRepo.save(timetable);
            }
        } catch (Exception e) {
            System.err.println("[Timetable] Xatolik: " + e.getMessage());
        }
    }

    /** Token ning SHA-256 hashini qaytaradi (64 hex belgi) */
    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            // Fallback: token ning o'zini qaytaramiz (qisqartirilgan)
            return input.length() > 64 ? input.substring(0, 64) : input;
        }
    }

    /**
     * Haqiqiy IP ni aniqlaydi.
     * Proxy/load balancer orqali kelgan so'rovlarda X-Forwarded-For headerini tekshiradi.
     */
    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
