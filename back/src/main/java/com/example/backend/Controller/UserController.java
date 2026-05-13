package com.example.backend.Controller;

import com.example.backend.Entity.Attachment;
import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final AttachmentRepo attachmentRepo;
    private final PasswordEncoder passwordEncoder;

    // ================================================================
    // GET ALL USERS
    // ================================================================

    /** GET /api/v1/users — barcha userlarni qaytaradi */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepo.findAll();
        return ResponseEntity.ok(users);
    }

    /** GET /api/v1/users/by-role?role=ROLE_OPERATOR — roli bo'yicha filter */
    @GetMapping("/by-role")
    public ResponseEntity<?> getUsersByRole(@RequestParam UserRoles role) {
        Role foundRole = roleRepo.findByName(role);
        if (foundRole == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Rol topilmadi: " + role);
        }
        List<User> users = userRepo.findAllByRole(foundRole);
        return ResponseEntity.ok(users);
    }

    // ================================================================
    // GET ONE USER
    // ================================================================

    /** GET /api/v1/users/{id} — bitta user */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        Optional<User> user = userRepo.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        return ResponseEntity.ok(user.get());
    }

    /** GET /api/v1/users/by-phone?phone=+998901234567 — telefon raqami bo'yicha */
    @GetMapping("/by-phone")
    public ResponseEntity<?> getUserByPhone(@RequestParam String phone) {
        Optional<User> user = userRepo.findByPhone(phone);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        return ResponseEntity.ok(user.get());
    }

    // ================================================================
    // CREATE USER
    // ================================================================

    /**
     * POST /api/v1/users
     * Body (JSON):
     * {
     *   "name": "Ali Valiyev",
     *   "phone": "+998901234567",
     *   "password": "secret123",
     *   "callCenterNumber": 201,
     *   "roles": ["ROLE_OPERATOR"]
     * }
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        // Phone unique tekshiruv
        if (userRepo.findByPhone(request.getPhone()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Bu telefon raqam allaqachon mavjud: " + request.getPhone());
        }

        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            return ResponseEntity.badRequest().body("Kamida bitta rol ko'rsatilishi kerak");
        }

        List<Role> roles = new ArrayList<>();
        for (UserRoles roleName : request.getRoles()) {
            Role role = roleRepo.findByName(roleName);
            if (role == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Rol topilmadi: " + roleName);
            }
            roles.add(role);
        }

        User user = User.builder()
                .phone(request.getPhone())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .callCenterNumber(request.getCallCenterNumber())
                .roles(roles)
                .build();

        User saved = userRepo.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ================================================================
    // UPDATE USER
    // ================================================================

    /**
     * PUT /api/v1/users/{id}
     * Body (JSON):
     * {
     *   "name": "Yangi ism",
     *   "phone": "+998901234567",
     *   "password": "newpass",        ← null / blank bo'lsa o'zgartirilmaydi
     *   "callCenterNumber": 202,
     *   "roles": ["ROLE_OPERATOR", "ROLE_ADMIN"]
     * }
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable UUID id,
            @RequestBody CreateUserRequest request
    ) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        User user = optUser.get();

        // Phone unique tekshiruv (boshqa userda bo'lmasin)
        Optional<User> byPhone = userRepo.findByPhone(request.getPhone());
        if (byPhone.isPresent() && !byPhone.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Bu telefon raqam boshqa foydalanuvchida mavjud: " + request.getPhone());
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getCallCenterNumber() != null) {
            user.setCallCenterNumber(request.getCallCenterNumber());
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            List<Role> roles = new ArrayList<>();
            for (UserRoles roleName : request.getRoles()) {
                Role role = roleRepo.findByName(roleName);
                if (role == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Rol topilmadi: " + roleName);
                }
                roles.add(role);
            }
            user.setRoles(roles);
        }

        userRepo.save(user);
        return ResponseEntity.ok(user);
    }

    // ================================================================
    // CHANGE ROLE
    // ================================================================

    /**
     * PATCH /api/v1/users/{id}/role
     * Body (JSON): ["ROLE_OPERATOR", "ROLE_ADMIN"]
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<?> changeUserRole(
            @PathVariable UUID id,
            @RequestBody List<UserRoles> roleNames
    ) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        if (roleNames == null || roleNames.isEmpty()) {
            return ResponseEntity.badRequest().body("Kamida bitta rol ko'rsatilishi kerak");
        }

        List<Role> roles = new ArrayList<>();
        for (UserRoles roleName : roleNames) {
            Role role = roleRepo.findByName(roleName);
            if (role == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Rol topilmadi: " + roleName);
            }
            roles.add(role);
        }

        User user = optUser.get();
        user.setRoles(roles);
        userRepo.save(user);
        return ResponseEntity.ok(user);
    }

    // ================================================================
    // CHANGE PASSWORD
    // ================================================================

    /**
     * PATCH /api/v1/users/{id}/password
     * Body (JSON): { "password": "newpass123" }
     */
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Parol bo'sh bo'lishi mumkin emas");
        }

        User user = optUser.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        return ResponseEntity.ok("Parol muvaffaqiyatli o'zgartirildi");
    }

    // ================================================================
    // IMAGE CRUD
    // ================================================================

    /** PUT /api/v1/users/{id}/image?attachmentId=... — rasm bog'lash */
    @PutMapping("/{id}/image")
    public ResponseEntity<?> setImage(
            @PathVariable UUID id,
            @RequestParam UUID attachmentId
    ) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        Optional<Attachment> optAtt = attachmentRepo.findById(attachmentId);
        if (optAtt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Attachment topilmadi");
        }

        User user = optUser.get();

        // Eski rasmni o'chiramiz
        if (user.getImage() != null) {
            Attachment old = user.getImage();
            new File("backend/files" + old.getPrefix() + "/" + old.getName()).delete();
            user.setImage(null);
            userRepo.save(user);
            attachmentRepo.delete(old);
        }

        user.setImage(optAtt.get());
        userRepo.save(user);
        return ResponseEntity.ok(optAtt.get());
    }

    /** GET /api/v1/users/{id}/image — rasmni ko'rish */
    @GetMapping("/{id}/image")
    public ResponseEntity<?> getImage(@PathVariable UUID id) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        User user = optUser.get();
        if (user.getImage() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rasm topilmadi");
        }

        Attachment att = user.getImage();
        File file = new File("backend/files" + att.getPrefix() + "/" + att.getName());
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Fayl topilmadi");
        }
        try {
            byte[] bytes = Files.readAllBytes(file.toPath());
            String contentType = Files.probeContentType(file.toPath());
            if (contentType == null) contentType = "application/octet-stream";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Faylni o'qishda xatolik: " + e.getMessage());
        }
    }

    /** DELETE /api/v1/users/{id}/image — rasmni o'chirish */
    @DeleteMapping("/{id}/image")
    public ResponseEntity<?> deleteImage(@PathVariable UUID id) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        User user = optUser.get();
        if (user.getImage() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rasm topilmadi");
        }

        Attachment old = user.getImage();
        new File("backend/files" + old.getPrefix() + "/" + old.getName()).delete();
        user.setImage(null);
        userRepo.save(user);
        attachmentRepo.delete(old);
        return ResponseEntity.ok("Rasm o'chirildi");
    }

    // ================================================================
    // DELETE USER
    // ================================================================

    /** DELETE /api/v1/users/{id} — userni o'chirish */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Foydalanuvchi topilmadi");
        }
        User user = optUser.get();

        // Rasmni ham o'chiramiz
        if (user.getImage() != null) {
            Attachment img = user.getImage();
            new File("backend/files" + img.getPrefix() + "/" + img.getName()).delete();
            user.setImage(null);
            userRepo.save(user);
            attachmentRepo.delete(img);
        }

        userRepo.delete(user);
        return ResponseEntity.ok("Foydalanuvchi o'chirildi");
    }

    // ================================================================
    // INNER DTO
    // ================================================================

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CreateUserRequest {
        private String name;
        private String phone;
        private String password;
        private Integer callCenterNumber;
        private List<UserRoles> roles;
    }
}

