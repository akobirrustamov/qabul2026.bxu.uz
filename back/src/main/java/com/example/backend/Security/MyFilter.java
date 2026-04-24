package com.example.backend.Security;

import com.example.backend.Repository.UserRepo;
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
import java.util.List;
import java.util.UUID;

@Component
@CrossOrigin
@Configuration
@RequiredArgsConstructor
public class MyFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepo userRepo;

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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        System.out.println(request.getRequestURI());
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
            UserDetails userDetails = userRepo.findById(UUID.fromString(subject)).orElseThrow();

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            sendUnauthorized(response, "Token expired");
        } catch (IllegalArgumentException e) {
            sendUnauthorized(response, "Invalid token format");
        } catch (Exception e) {
            sendUnauthorized(response, "Invalid token");
        }
    }
}
