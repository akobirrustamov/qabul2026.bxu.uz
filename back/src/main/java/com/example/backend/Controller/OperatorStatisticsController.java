package com.example.backend.Controller;


import com.example.backend.Entity.CrmLeadComment;
import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.CrmLeadCommentRepo;
import com.example.backend.Repository.CrmLeadRepo;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/operator-statistics")
public class OperatorStatisticsController {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final CrmLeadRepo crmLeadRepo;
    private final CrmLeadCommentRepo crmLeadCommentRepo;

    /**
     * Barcha ROLE_OPERATOR userlar uchun, berilgan sana oralig'ida
     * har bir operatorning historyStatus bo'yicha comment sonini qaytaradi.
     *
     * GET /api/v1/operator-statistics/all?startDate=2024-01-01&endDate=2024-12-31
     */
    private static final Map<Integer, String> STATUS_LABELS = new LinkedHashMap<>();
    static {
        STATUS_LABELS.put(1, "Lead almashdi");
        STATUS_LABELS.put(2, "Comment yozildi");
        STATUS_LABELS.put(3, "Qo'ngiroq (sipuni)");
        STATUS_LABELS.put(4, "Sayt avtomatik qabuldan");
        STATUS_LABELS.put(5, "Qo'lda qo'shildi");
        STATUS_LABELS.put(6, "Budulnik qoydi");
        STATUS_LABELS.put(7, "Budulnik olib tashladi");
        STATUS_LABELS.put(8, "Shartnoma olib berdi");
    }

    private LocalDateTime[] resolveDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (startDate == null && endDate == null) {
            // ikkalasi ham null → bugungi kun
            return new LocalDateTime[]{today.atStartOfDay(), today.atTime(23, 59, 59)};
        } else if (startDate == null) {
            // faqat endDate bor → shu kun
            return new LocalDateTime[]{endDate.atStartOfDay(), endDate.atTime(23, 59, 59)};
        } else if (endDate == null) {
            // faqat startDate bor → shu kun
            return new LocalDateTime[]{startDate.atStartOfDay(), startDate.atTime(23, 59, 59)};
        }
        return new LocalDateTime[]{startDate.atStartOfDay(), endDate.atTime(23, 59, 59)};
    }

    private Map<String, Object> buildStatsByStatus(List<CrmLeadComment> comments) {
        Map<String, Object> statsByStatus = new LinkedHashMap<>();
        for (Map.Entry<Integer, String> entry : STATUS_LABELS.entrySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", entry.getValue());
            item.put("count", 0L);
            statsByStatus.put(String.valueOf(entry.getKey()), item);
        }
        for (CrmLeadComment comment : comments) {
            if (comment.getHistoryStatus() != null) {
                int status = comment.getHistoryStatus();
                if (STATUS_LABELS.containsKey(status)) {
                    Map<String, Object> item = (Map<String, Object>) statsByStatus.get(String.valueOf(status));
                    item.put("count", (Long) item.get("count") + 1);
                }
            }
        }
        return statsByStatus;
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllOperatorsStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDateTime[] range = resolveDateRange(startDate, endDate);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];

        Role operatorRole = roleRepo.findByName(UserRoles.ROLE_ACCOUNTANT);
        System.out.print(operatorRole);
        List<User> operators = userRepo.findAllByRole(operatorRole);
        System.out.print(operators);


        List<Map<String, Object>> result = new ArrayList<>();

        for (User operator : operators) {
            List<CrmLeadComment> comments = crmLeadCommentRepo
                    .findByCommenterIdAndCreatedAtBetween(operator.getId(), start, end);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", operator.getId());
            entry.put("name", operator.getName());
            entry.put("phone", operator.getPhone());
            entry.put("totalComments", (long) comments.size());
            entry.put("statsByStatus", buildStatsByStatus(comments));
            result.add(entry);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Bitta operator uchun, berilgan sana oralig'ida
     * historyStatus bo'yicha comment sonini qaytaradi.
     *
     * GET /api/v1/operator-statistics/operator/{operatorId}?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<?> getOperatorStatistics(
            @PathVariable UUID operatorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDateTime[] range = resolveDateRange(startDate, endDate);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];

        Optional<User> optOperator = userRepo.findById(operatorId);
        if (optOperator.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User operator = optOperator.get();

        List<CrmLeadComment> comments = crmLeadCommentRepo
                .findByCommenterIdAndCreatedAtBetween(operatorId, start, end);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", operator.getId());
        result.put("name", operator.getName());
        result.put("phone", operator.getPhone());
        result.put("totalComments", (long) comments.size());
        result.put("statsByStatus", buildStatsByStatus(comments));

        return ResponseEntity.ok(result);
    }

    /**
     * Barcha ROLE_OPERATOR statistikasini Excel fayl sifatida yuklab olish.
     *
     * GET /api/v1/operator-statistics/download-excel?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/download-excel")
    public ResponseEntity<byte[]> downloadExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) throws IOException {
        LocalDateTime[] range = resolveDateRange(startDate, endDate);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];
        LocalDate resolvedStart = start.toLocalDate();
        LocalDate resolvedEnd = end.toLocalDate();

        Role operatorRole = roleRepo.findByName(UserRoles.ROLE_ACCOUNTANT);
        List<User> operators = userRepo.findAllByRole(operatorRole);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Operator Statistics");

            // ── Styles ──────────────────────────────────────────────
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle boldDataStyle = workbook.createCellStyle();
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldDataStyle.setFont(boldFont);
            boldDataStyle.setBorderBottom(BorderStyle.THIN);
            boldDataStyle.setBorderTop(BorderStyle.THIN);
            boldDataStyle.setBorderLeft(BorderStyle.THIN);
            boldDataStyle.setBorderRight(BorderStyle.THIN);

            // ── Title row ───────────────────────────────────────────
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Operator Statistikasi: " + resolvedStart + " — " + resolvedEnd);
            titleCell.setCellStyle(titleStyle);
            // total columns = 2 (№ + Name) + 8 statuses + 1 total = 11
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            // ── Header row ──────────────────────────────────────────
            Row headerRow = sheet.createRow(1);
            String[] headers = {
                    "№", "Operator",
                    "1-Lead almashdi holatini almashtirdi",
                    "2-Komment yozdi",
                    "3-Qo'ngiroq (sipuni)",
                    "4-Sayt avtomatik ",
                    "5-Qo'lda qo'shildi",
                    "6-Budulnik qo'ydi",
                    "7-Budulnik olindi",
                    "8-Shartnoma berdi",

                    "Jami"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── Data rows ───────────────────────────────────────────
            int rowNum = 2;
            int operatorIndex = 1;
            long[] columnTotals = new long[8];

            for (User operator : operators) {
                List<CrmLeadComment> comments = crmLeadCommentRepo
                        .findByCommenterIdAndCreatedAtBetween(operator.getId(), start, end);

                long[] counts = new long[8];
                for (CrmLeadComment comment : comments) {
                    if (comment.getHistoryStatus() != null) {
                        int s = comment.getHistoryStatus();
                        if (s >= 1 && s <= 8) {
                            counts[s - 1]++;
                            columnTotals[s - 1]++;
                        }
                    }
                }

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(operatorIndex++);
                row.getCell(0).setCellStyle(dataStyle);
                Cell nameCell = row.createCell(1);
                nameCell.setCellValue(operator.getName());
                nameCell.setCellStyle(boldDataStyle);

                long rowTotal = 0;
                for (int i = 0; i < 8; i++) {
                    Cell c = row.createCell(i + 2);
                    c.setCellValue(counts[i]);
                    c.setCellStyle(dataStyle);
                    rowTotal += counts[i];
                }
                Cell totalCell = row.createCell(10);
                totalCell.setCellValue(rowTotal);
                totalCell.setCellStyle(boldDataStyle);
            }

            // ── Totals row ──────────────────────────────────────────
            Row totalsRow = sheet.createRow(rowNum);
            Cell totalLabelCell = totalsRow.createCell(0);
            totalLabelCell.setCellValue("JAMI");
            totalLabelCell.setCellStyle(headerStyle);
            totalsRow.createCell(1).setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, 1));

            long grandTotal = 0;
            for (int i = 0; i < 8; i++) {
                Cell c = totalsRow.createCell(i + 2);
                c.setCellValue(columnTotals[i]);
                c.setCellStyle(headerStyle);
                grandTotal += columnTotals[i];
            }
            Cell grandTotalCell = totalsRow.createCell(10);
            grandTotalCell.setCellValue(grandTotal);
            grandTotalCell.setCellStyle(headerStyle);

            // ── Auto-size columns ────────────────────────────────────
            for (int i = 0; i <= 10; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            String filename = "operator-statistics-" + resolvedStart + "-" + resolvedEnd + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }
}
