package com.example.backend.Controller;

import com.example.backend.Entity.CrmCategory;
import com.example.backend.Entity.CrmSubCategory;
import com.example.backend.Repository.CrmCategoryRepo;
import com.example.backend.Repository.CrmLeadRepo;
import com.example.backend.Repository.CrmSubCategoryRepo;
import com.example.backend.Services.CrmExcelExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/crm/statistic")
@RequiredArgsConstructor
public class CrmStatisticController {

    private final CrmCategoryRepo crmCategoryRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;
    private final CrmLeadRepo crmLeadRepo;
    private final CrmExcelExportService excelExportService;  // ← yangi

    // ── Mavjud endpoint ───────────────────────────────────────────────────────
    @GetMapping
    public HttpEntity<?> getStatisticCrm() {

        Map<String, Object> response = new HashMap<>();

        long totalCategories    = crmCategoryRepo.count();
        long totalSubCategories = crmSubCategoryRepo.count();
        long totalLeads         = crmLeadRepo.count();

        response.put("totalCategories",    totalCategories);
        response.put("totalSubCategories", totalSubCategories);
        response.put("totalLeads",         totalLeads);

        Map<String, Long> statusStats = new HashMap<>();
        response.put("statusStats", statusStats);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long todayLeads = crmLeadRepo.countByCreatedAtAfter(todayStart);
        response.put("todayLeads", todayLeads);

        List<Map<String, Object>> categoryTree = new ArrayList<>();
        List<CrmCategory> categories = crmCategoryRepo.findAll();

        for (CrmCategory category : categories) {
            Map<String, Object> categoryMap = new HashMap<>();
            categoryMap.put("id",   category.getId());
            categoryMap.put("name", category.getName());

            List<Map<String, Object>> subList = new ArrayList<>();
            List<CrmSubCategory> subs = crmSubCategoryRepo.findAll()
                    .stream()
                    .filter(s -> s.getCrmCategory().getId().equals(category.getId()))
                    .toList();

            for (CrmSubCategory sub : subs) {
                Map<String, Object> subMap = new HashMap<>();
                subMap.put("id",        sub.getId());
                subMap.put("name",      sub.getName());
                subMap.put("leadCount", crmLeadRepo.countByCrmSubCategory_Id(sub.getId()));
                subList.add(subMap);
            }

            categoryMap.put("subCategories", subList);
            categoryTree.add(categoryMap);
        }

        response.put("categoryTree", categoryTree);

        List<Map<String, Object>> weekly = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day   = LocalDate.now().minusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end   = day.plusDays(1).atStartOfDay();

            long count = crmLeadRepo.countByCreatedAtAfter(start)
                    - crmLeadRepo.countByCreatedAtAfter(end);

            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date",  day.toString());
            dayMap.put("count", count);
            weekly.add(dayMap);
        }

        response.put("weeklyStats", weekly);

        return ResponseEntity.ok(response);
    }

    // ── Yangi Excel export endpoint ───────────────────────────────────────────
    // GET /api/v1/crm/statistic/export-excel
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel() {
        try {
            byte[] excelBytes = excelExportService.generateExcel();

            String fileName = "crm-statistic-"
                    + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                    + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(excelBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export-excel-sub/{categoryId}")
    public ResponseEntity<byte[]> exportExcelBySubCategory(@PathVariable UUID categoryId) {
        try {
            byte[] excelBytes = excelExportService.generateExcelBySubCategory(categoryId);

            String fileName = "crm-sub-"
                    + categoryId + "-"
                    + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                    + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(excelBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}