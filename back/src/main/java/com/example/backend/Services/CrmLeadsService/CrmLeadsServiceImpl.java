package com.example.backend.Services.CrmLeadsService;

import com.example.backend.DTO.ChangeOperatorDTO;
import com.example.backend.DTO.CrmLeadCommentDTO;
import com.example.backend.DTO.CrmLeadDTO;
import com.example.backend.DTO.CrmLeadFilterDTO;
import com.example.backend.Entity.*;
import com.example.backend.Repository.CrmLeadCommentRepo;
import com.example.backend.Repository.CrmLeadRepo;
import com.example.backend.Repository.CrmSubCategoryRepo;
import com.example.backend.Repository.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
@Transactional
public class CrmLeadsServiceImpl implements CrmLeadsService {

    @Override
    public Page<CrmLead> filter(UUID subCategoryId, CrmLeadFilterDTO dto) {

        Pageable pageable = PageRequest.of(dto.getPage(), dto.getSize());

        return crmLeadRepo.findAll((root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // 🔹 subcategory
            predicates.add(cb.equal(root.get("crmSubCategory").get("id"), subCategoryId));

            // operator tanlangan
            if (dto.getOperatorId() != null) {
                predicates.add(cb.equal(root.get("operator").get("id"), dto.getOperatorId()));
            }

// 🔥 operator null filter
            if (dto.getOperatorNull() != null && dto.getOperatorNull()) {
                predicates.add(cb.isNull(root.get("operator")));
            }

            // 🔹 agent
            if (dto.getAgentId() != null) {
                predicates.add(cb.equal(root.get("applicant").get("agent").get("id"), dto.getAgentId()));
            }

            // 🔹 date from
            if (dto.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dto.getFromDate()));
            }

            // 🔹 date to
            if (dto.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dto.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));

        }, pageable);
    }


    @Override
    public List<UUID> getAllLeadIdsBySubCategory(UUID subCategoryId) {
        return crmLeadRepo.findAllIdsBySubCategoryId(subCategoryId);
    }


    @Override
    public void completeLead(UUID leadId, UUID userId) {
        CrmLead lead = crmLeadRepo.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        // ✅ completed qilish
        lead.setCompleted(true);
        crmLeadRepo.save(lead);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // 🕒 vaqt
        LocalDateTime now = LocalDateTime.now();
        // 📝 avtomatik comment
        CrmLeadCommentDTO dto = new CrmLeadCommentDTO();
        dto.setCommenterId(user.getId());
        dto.setDescription(user.getName() + " tomonidan lead bajarilgan qilindi");
        dto.setCreatedAt(now);

        // ✅ existing method ishlatamiz
        addComment(leadId, dto);
    }


    @Override
    public List<CrmLead> getFutureReminders() {
        return crmLeadRepo.findAllFutureReminders(LocalDateTime.now());
    }

    @Override
    public List<CrmLead> getRemindersByOperatorId(UUID operatorId) {
        return crmLeadRepo.findFutureRemindersByOperator(operatorId, LocalDateTime.now());
    }


    @Override
    public Page<CrmLead> getBySubCategoryPagedByOperator(UUID operatorId, int page, int size, String query) {
        Pageable pageable = PageRequest.of(page, size);
        if (query != null && !query.isBlank()) {
            return crmLeadRepo.searchByOperator(operatorId, query.trim(), pageable);
        }
        return crmLeadRepo.findByOperatorOrNullPaged(operatorId, pageable);
    }

    @Override
    public Page<CrmLead> getByOperatorAndSubCategoryPaged(UUID operatorId, UUID subCategoryId, int page, int size, String query) {
        Pageable pageable = PageRequest.of(page, size);
        if (query != null && !query.isBlank()) {
            return crmLeadRepo.searchByOperatorAndSubCategory(operatorId, subCategoryId, query.trim(), pageable);
        }
        return crmLeadRepo.findByOperatorAndSubCategoryPaged(operatorId, subCategoryId, pageable);
    }

    private final SimpMessagingTemplate messagingTemplate;

    private final CrmLeadRepo crmLeadRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;
    private final CrmLeadCommentRepo crmLeadCommentRepo;
    private final UserRepo userRepo;

    @Override
    public void changeOperator(ChangeOperatorDTO dto) {
        User operator = userRepo.findById(dto.getOperatorId())
                .orElseThrow(() -> new RuntimeException("Operator not found"));
        List<CrmLead> leads = crmLeadRepo.findAllById(dto.getLeadIds());
        leads.forEach(lead -> {
            lead.setOperator(operator);

            // Create a comment for operator change
            LocalDateTime now = LocalDateTime.now();
            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(lead)
                    .commenter(operator)
                    .description("admin leadni "+operator.getName()+"ga biriktirdi")
                    .historyStatus(1)
                    .createdAt(now)
                    .build();

            crmLeadCommentRepo.save(comment);
        });
        crmLeadRepo.saveAll(leads);
    }

    @Override
    public CrmLead setOperatorForLead(UUID leadId, UUID operatorId, UUID currentUserId) {
        CrmLead lead = crmLeadRepo.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        User operator = userRepo.findById(operatorId)
                .orElseThrow(() -> new RuntimeException("Operator not found"));
        User currentUser = userRepo.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        lead.setOperator(operator);

        // Create a comment for operator change
        LocalDateTime now = LocalDateTime.now();
        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(lead)
                .commenter(currentUser)
                .description(currentUser.getName()+" tomonidan leadni "+operator.getName()+"ga biriktirdi")
                .historyStatus(1)
                .createdAt(now)
                .build();

        crmLeadCommentRepo.save(comment);
        return crmLeadRepo.save(lead);
    }

    @Override
    public List<CrmLead> getBySubCategoriesAll(UUID subCategoryId) {
        return crmLeadRepo.findBySubCategoryId(subCategoryId);
    }

    @Override
    public Page<CrmLead> getBySubCategoryPaged(UUID subCategoryId, int page, int size, String query) {
        Pageable pageable = PageRequest.of(page, size);
        if (query != null && !query.isBlank()) {
            return crmLeadRepo.searchBySubCategory(subCategoryId, query.trim(), pageable);
        }
        return crmLeadRepo.findByCrmSubCategoryId(subCategoryId, pageable);
    }

    @Override
    public List<CrmLeadComment> getCommentsByLeadId(UUID leadId) {
        crmLeadRepo.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        return crmLeadCommentRepo.findByCrmLeadIdOrderByCreatedAtAsc(leadId);
    }

    @Override
    public CrmLead editCrmLead(UUID crmLeadId, CrmLeadDTO dto, UUID commenterId) {

        CrmLead crmLead = crmLeadRepo.findById(crmLeadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // 🟡 OLD values
        String oldSub = crmLead.getCrmSubCategory() != null
                ? crmLead.getCrmSubCategory().getName()
                : "Noma'lum";

        CrmCategory oldCategory = crmLead.getCrmSubCategory() != null
                ? crmLead.getCrmSubCategory().getCrmCategory()
                : null;

        String oldCategoryName = oldCategory != null
                ? oldCategory.getName()
                : "Noma'lum";

        // 🟢 NEW values (default old)
        CrmCategory newCategory = oldCategory;
        String newSub = oldSub;

        // 🔄 UPDATE SUBCATEGORY (va avtomatik CATEGORY ham o‘zgaradi)
        if (dto.getCrmSubCategoryId() != null) {
            CrmSubCategory sub = crmSubCategoryRepo.findById(dto.getCrmSubCategoryId())
                    .orElseThrow(() -> new RuntimeException("SubCategory not found"));

            crmLead.setCrmSubCategory(sub);

            newCategory = sub.getCrmCategory();
            newSub = sub.getName();
        }

        String newCategoryName = newCategory != null
                ? newCategory.getName()
                : "Noma'lum";
        User commenter = userRepo.findById(commenterId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 🔄 Boshqa fieldlar
        if (dto.getSortOrder() != null)          crmLead.setSortOrder(dto.getSortOrder());
        if (dto.getReminderTime() != null){
            crmLead.setCompleted(false);
            crmLead.setReminderTime(dto.getReminderTime());
        };
        if(dto.getOperatorId() != null){
             User operator = userRepo.findById(dto.getOperatorId())
                    .orElseThrow(() -> new RuntimeException("Operator not found"));
            crmLead.setOperator(operator);
        }
        if (dto.getReminderDescription() != null) crmLead.setReminderDescription(dto.getReminderDescription());
        if (dto.getStatus() != null)              crmLead.setStatus(dto.getStatus());

        // 👤 Kommentator

        // 🕒 Time
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        String formattedTime = now.format(formatter);

        // 🧠 CHANGE DETECTION
        boolean isCategoryChanged = oldCategory != null && newCategory != null
                && !oldCategory.getId().equals(newCategory.getId());

        boolean isSubChanged = !oldSub.equals(newSub);

        // 📝 DESCRIPTION LOGIC
        String description;

        if (isCategoryChanged && isSubChanged) {
            description = formattedTime + " da "
                    + commenter.getName()
                    + " tomonidan kategoriya \""
                    + oldCategoryName
                    + "\" dan \""
                    + newCategoryName
                    + "\" ga, subkategoriya \""
                    + oldSub
                    + "\" dan \""
                    + newSub
                    + "\" ga o‘zgartirildi";
        } else if (isSubChanged) {
            description = formattedTime + " da "
                    + commenter.getName()
                    + " tomonidan \""
                    + oldSub
                    + "\" dan \""
                    + newSub
                    + "\" ga o‘zgartirildi";
        } else if (isCategoryChanged) {
            description = formattedTime + " da "
                    + commenter.getName()
                    + " tomonidan kategoriya \""
                    + oldCategoryName
                    + "\" dan \""
                    + newCategoryName
                    + "\" ga o‘zgartirildi";
        } else {
            description = null;
        }

        if (description != null) {
            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(crmLead)
                    .commenter(commenter)
                    .description(description)
                    .historyStatus(1)
                    .createdAt(now)
                    .build();

            CrmLeadComment savedComment = crmLeadCommentRepo.save(comment);
            messagingTemplate.convertAndSend("/topic/lead-comment", savedComment);
        }
        // 💾 LEAD SAVE
        CrmLead savedLead = crmLeadRepo.save(crmLead);
        messagingTemplate.convertAndSend("/topic/lead-update", savedLead);

        return savedLead;
    }

    @Override
    public CrmLeadComment addComment(UUID leadId, CrmLeadCommentDTO dto) {
        CrmLead lead = crmLeadRepo.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        User commenter = userRepo.findById(dto.getCommenterId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(lead)
                .commenter(commenter)
                .description(dto.getDescription())
                .historyStatus(2)
                // ✅ dto da vaqt bo'lsa uni ishlatamiz, bo'lmasa hozirgi vaqt
                .createdAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now())
                .build();

        CrmLeadComment saved = crmLeadCommentRepo.save(comment);
        messagingTemplate.convertAndSend("/topic/lead-comment", saved);
        return saved;
    }

    @Override
    public CrmLeadComment addCommentSipuni(UUID leadId, CrmLeadCommentDTO dto) {
        CrmLead lead = crmLeadRepo.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        User commenter = userRepo.findById(dto.getCommenterId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(lead)
                .commenter(commenter)
                .description(dto.getDescription())
                .historyStatus(3)
                // ✅ dto da vaqt bo'lsa uni ishlatamiz, bo'lmasa hozirgi vaqt
                .createdAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now())
                .build();

        CrmLeadComment saved = crmLeadCommentRepo.save(comment);
        messagingTemplate.convertAndSend("/topic/lead-comment", saved);
        return saved;
    }



}