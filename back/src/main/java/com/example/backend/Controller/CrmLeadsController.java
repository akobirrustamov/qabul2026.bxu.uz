package com.example.backend.Controller;

import com.example.backend.DTO.ChangeOperatorDTO;
import com.example.backend.DTO.CrmLeadCommentDTO;
import com.example.backend.DTO.CrmLeadDTO;
import com.example.backend.DTO.CrmLeadFilterDTO;
import com.example.backend.Entity.CrmLead;
import com.example.backend.Entity.CrmLeadComment;
import com.example.backend.Services.CrmLeadsService.CrmLeadsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/crm/leads")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CrmLeadsController {
    private final CrmLeadsService crmLeadsService;
    @PostMapping("/sub-category/{id}/filter")
    public Page<CrmLead> filter(
            @PathVariable UUID id,
            @RequestBody CrmLeadFilterDTO dto
    ) {
        return crmLeadsService.filter(id, dto);
    }

    @GetMapping("/sub-category/{id}/ids")
    public ResponseEntity<List<UUID>> getAllIdsBySubCategory(@PathVariable UUID id) {
        return ResponseEntity.ok(crmLeadsService.getAllLeadIdsBySubCategory(id));
    }

    @GetMapping("/reminders")
    public ResponseEntity<List<CrmLead>> getFutureReminders() {
        return ResponseEntity.ok(crmLeadsService.getFutureReminders());
    }

    @PutMapping("/{leadId}/{userId}/complete")
    public ResponseEntity<?> completeLead(
            @PathVariable UUID leadId,
            @PathVariable UUID userId
    ) {
        crmLeadsService.completeLead(leadId, userId);
        return ResponseEntity.ok("Lead completed");
    }

    @GetMapping("/operator/{operatorId}/reminders")
    public ResponseEntity<List<CrmLead>> getRemindersByOperator(
            @PathVariable UUID operatorId
    ) {
        return ResponseEntity.ok(crmLeadsService.getRemindersByOperatorId(operatorId));
    }
    @PutMapping("/change-operator")
    public HttpEntity<?> changeOperator(@RequestBody ChangeOperatorDTO dto) {
        crmLeadsService.changeOperator(dto);
        return ResponseEntity.ok("changed");
    }



    @PutMapping("/{leadId}/operator/{operatorId}/{currentUserId}")
    public ResponseEntity<CrmLead> setOperatorForLead(
            @PathVariable UUID leadId,
            @PathVariable UUID operatorId,
            @PathVariable UUID currentUserId) {
        return ResponseEntity.ok(crmLeadsService.setOperatorForLead(leadId, operatorId, currentUserId));
    }

    @GetMapping("/operator/{operatorId}/sub-category/{subCategoryId}/paged")
    public ResponseEntity<Page<CrmLead>> getLeadsByOperatorID(@PathVariable UUID operatorId,
                                              @PathVariable UUID subCategoryId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "100") int size,
                                              @RequestParam(required = false) String query) {
        return ResponseEntity.ok(crmLeadsService.getByOperatorAndSubCategoryPaged(operatorId, subCategoryId, page, size, query));
    }

    @GetMapping("/sub-category/{id}")
    public ResponseEntity<List<CrmLead>> getBySubCategory(@PathVariable UUID id) {
        return ResponseEntity.ok(crmLeadsService.getBySubCategoriesAll(id));
    }

    @GetMapping("/sub-category/{subCategoryId}/paged")
    public ResponseEntity<Page<CrmLead>> getBySubCategoryPaged(
                                                              @PathVariable UUID subCategoryId,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "100") int size,
                                                              @RequestParam(required = false) String query) {
        return ResponseEntity.ok(crmLeadsService.getBySubCategoryPaged( subCategoryId, page, size, query));
    }



    @PutMapping("/{id}/{commenterId}")
    public ResponseEntity<CrmLead> editLead(
            @PathVariable UUID id,
            @RequestBody CrmLeadDTO dto,
            @PathVariable UUID commenterId
    ) {
        return ResponseEntity.ok(crmLeadsService.editCrmLead(id, dto, commenterId));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CrmLeadComment> addComment(
            @PathVariable UUID id,
            @RequestBody CrmLeadCommentDTO dto) {
        return ResponseEntity.ok(crmLeadsService.addComment(id, dto));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CrmLeadComment>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(crmLeadsService.getCommentsByLeadId(id));
    }



}