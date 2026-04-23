package com.example.backend.Services.CrmLeadsService;

import com.example.backend.DTO.ChangeOperatorDTO;
import com.example.backend.DTO.CrmLeadCommentDTO;
import com.example.backend.DTO.CrmLeadDTO;
import com.example.backend.DTO.CrmLeadFilterDTO;
import com.example.backend.Entity.CrmLead;
import com.example.backend.Entity.CrmLeadComment;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface CrmLeadsService {

    List<UUID> getAllLeadIdsBySubCategory(UUID subCategoryId);
    Page<CrmLead> filter(UUID subCategoryId, CrmLeadFilterDTO dto);

    void changeOperator(ChangeOperatorDTO dto);
    CrmLead setOperatorForLead(UUID leadId, UUID operatorId, UUID currentUserId);
    List<CrmLead> getBySubCategoriesAll(UUID subCategoryId);
    List<CrmLead> getFutureReminders();
    void completeLead(UUID leadId, UUID userId);
    List<CrmLead> getRemindersByOperatorId(UUID operatorId);
    Page<CrmLead> getBySubCategoryPaged(UUID subCategoryId, int page, int size, String query);

    // ─── Lead commentlarini olish ─────────────────────────────────────────────
    List<CrmLeadComment> getCommentsByLeadId(UUID leadId);


    CrmLead editCrmLead(UUID crmLeadId, CrmLeadDTO crmLeadDTO, UUID commenterId );

    CrmLeadComment addComment(UUID leadId, CrmLeadCommentDTO dto); // YANGI
    CrmLeadComment addCommentSipuni(UUID leadId, CrmLeadCommentDTO dto); // YANGI

    Page<CrmLead> getBySubCategoryPagedByOperator(UUID operatorId, int page, int size, String query);

    Page<CrmLead> getByOperatorAndSubCategoryPaged(UUID operatorId, UUID subCategoryId, int page, int size, String query);

}
