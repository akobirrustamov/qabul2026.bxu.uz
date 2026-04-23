package com.example.backend.Services;

import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.CrmCategory;
import com.example.backend.Entity.CrmLead;
import com.example.backend.Entity.CrmSubCategory;
import com.example.backend.Repository.CrmCategoryRepo;
import com.example.backend.Repository.CrmLeadRepo;
import com.example.backend.Repository.CrmSubCategoryRepo;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CrmExcelExportService {

    private final CrmCategoryRepo crmCategoryRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;
    private final CrmLeadRepo crmLeadRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    // Kolonkalar nomi
    private static final String[] HEADERS = {
            "№",
            "Familiya",
            "Ismi",
            "Otasining ismi",
            "Telefon",
            "Qo'shimcha telefon",
            "Pasport raqami",
            "JSHSHIR",
            "Yo'nalish",
            "Murojaat turi",
            "Til",
            "DTM",
            "Universitet",
            "Viloyat/Shahar",
            "Agent",
            "Ro'yxatdan o'tgan sana",
            "Manba",
            "Holat"
    };

    public byte[] generateExcel() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Stillar
            CellStyle titleStyle    = createTitleStyle(workbook);
            CellStyle headerStyle   = createHeaderStyle(workbook);
            CellStyle subTitleStyle = createSubTitleStyle(workbook);
            CellStyle dataStyle     = createDataStyle(workbook);
            CellStyle altDataStyle  = createAltDataStyle(workbook);

            List<CrmCategory> categories = crmCategoryRepo.findAll();

            for (CrmCategory category : categories) {

                // Sheet nomi — 31 belgidan oshmasin (Excel cheklov)
                String sheetName = truncate(category.getName(), 31);
                Sheet sheet = workbook.createSheet(sheetName);

                // Kolonna kengliklarini sozlash
                int[] colWidths = {8, 20, 20, 20, 16, 16, 16, 14, 24, 20, 10, 8, 12, 20, 20, 22, 14, 12};
                for (int i = 0; i < colWidths.length; i++) {
                    sheet.setColumnWidth(i, colWidths[i] * 256);
                }

                // Kategoriya sarlavhasi (1-qator)
                Row titleRow = sheet.createRow(0);
                titleRow.setHeight((short) 600);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("📂 Kategoriya: " + category.getName());
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, HEADERS.length - 1));

                int rowNum = 1; // keyingi yozilishi kerak bo'lgan qator indeksi

                // Shu kategoriyaga tegishli subkategoriyalar
                List<CrmSubCategory> subs = crmSubCategoryRepo.findAll()
                        .stream()
                        .filter(s -> s.getCrmCategory().getId().equals(category.getId()))
                        .sorted((a, b) -> {
                            if (a.getSortOrder() == null) return 1;
                            if (b.getSortOrder() == null) return -1;
                            return a.getSortOrder().compareTo(b.getSortOrder());
                        })
                        .toList();

                for (CrmSubCategory sub : subs) {

                    List<CrmLead> leads = crmLeadRepo.findBySubCategoryId(sub.getId());

                    // SubKategoriya sarlavhasi
                    Row subTitleRow = sheet.createRow(rowNum++);
                    subTitleRow.setHeight((short) 500);
                    Cell subCell = subTitleRow.createCell(0);
                    subCell.setCellValue("▶  " + sub.getName() + "  (" + leads.size() + " ta lead)");
                    subCell.setCellStyle(subTitleStyle);
                    sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, HEADERS.length - 1));

                    // Kolonna header qatori
                    Row headerRow = sheet.createRow(rowNum++);
                    headerRow.setHeight((short) 450);
                    for (int i = 0; i < HEADERS.length; i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(HEADERS[i]);
                        cell.setCellStyle(headerStyle);
                    }

                    // Data qatorlar
                    if (leads.isEmpty()) {
                        Row emptyRow = sheet.createRow(rowNum++);
                        Cell emptyCell = emptyRow.createCell(0);
                        emptyCell.setCellValue("Ma'lumot mavjud emas");
                        emptyCell.setCellStyle(dataStyle);
                        sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, HEADERS.length - 1));
                    } else {
                        int counter = 1;
                        for (CrmLead lead : leads) {
                            Row dataRow = sheet.createRow(rowNum++);
                            dataRow.setHeight((short) 380);
                            CellStyle style = (counter % 2 == 0) ? altDataStyle : dataStyle;

                            Abuturient ab = lead.getApplicant();

                            setCell(dataRow, 0, String.valueOf(counter++), style);
                            setCell(dataRow, 1,  ab != null ? nvl(ab.getLastName())                                          : nvl(lead.getPhone()), style);
                            setCell(dataRow, 2,  ab != null ? nvl(ab.getFirstName())                                         : "",                   style);
                            setCell(dataRow, 3,  ab != null ? nvl(ab.getFatherName())                                        : "",                   style);
                            setCell(dataRow, 4,  ab != null ? nvl(ab.getPhone())     : nvl(lead.getPhone()),                                         style);
                            setCell(dataRow, 5,  ab != null ? nvl(ab.getAdditionalPhone())                                   : "",                   style);
                            setCell(dataRow, 6,  ab != null ? nvl(ab.getPassportNumber())                                    : "",                   style);
                            setCell(dataRow, 7,  ab != null ? nvl(ab.getPassportPin())                                       : "",                   style);
                            setCell(dataRow, 8,  ab != null && ab.getEducationField() != null ? ab.getEducationField().getName() : "",               style);
                            setCell(dataRow, 9,  ab != null && ab.getAppealType()     != null ? ab.getAppealType().getName()     : "",               style);
                            setCell(dataRow, 10, ab != null && ab.getLanguage()       != null ? (ab.getLanguage() ? "O'zbek" : "Rus")               : "", style);
                            setCell(dataRow, 11, ab != null && ab.getIsDtm()          != null ? (ab.getIsDtm()    ? "Ha"     : "Yo'q")              : "", style);
                            setCell(dataRow, 12, ab != null && ab.getIsUniversity()   != null ? (ab.getIsUniversity() ? "Ha" : "Yo'q")              : "", style);
                            setCell(dataRow, 13, ab != null && ab.getDistrict()       != null ? ab.getDistrict().getName()                          : "", style);
                            setCell(dataRow, 14, ab != null && ab.getAgent()          != null ? ab.getAgent().getName()                         : "", style);
                            setCell(dataRow, 15, lead.getCreatedAt() != null ? lead.getCreatedAt().format(DATE_FMT)                                 : "", style);
                            setCell(dataRow, 16, nvl(lead.getSource()),                                                                                   style);
                            setCell(dataRow, 17, ab != null && ab.getStatus() != null ? String.valueOf(ab.getStatus())                              : "", style);
                        }
                    }

                    // Subkategoriyalar orasida bo'sh qator
                    rowNum++;
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateExcelBySubCategory(UUID categoryId) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle titleStyle    = createTitleStyle(workbook);
            CellStyle headerStyle   = createHeaderStyle(workbook);
            CellStyle dataStyle     = createDataStyle(workbook);
            CellStyle altDataStyle  = createAltDataStyle(workbook);

            CrmCategory category = crmCategoryRepo.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + categoryId));

            List<CrmSubCategory> subs = crmSubCategoryRepo.findAll()
                    .stream()
                    .filter(s -> s.getCrmCategory().getId().equals(categoryId))
                    .sorted((a, b) -> {
                        if (a.getSortOrder() == null) return 1;
                        if (b.getSortOrder() == null) return -1;
                        return a.getSortOrder().compareTo(b.getSortOrder());
                    })
                    .toList();

            for (CrmSubCategory sub : subs) {

                // Har bir subkategoriya — alohida sheet
                String sheetName = truncate(sub.getName(), 31);
                Sheet sheet = workbook.createSheet(sheetName);

                int[] colWidths = {8, 20, 20, 20, 16, 16, 16, 14, 24, 20, 10, 8, 12, 20, 20, 22, 14, 12};
                for (int i = 0; i < colWidths.length; i++) {
                    sheet.setColumnWidth(i, colWidths[i] * 256);
                }

                // Sheet sarlavhasi: "Kategoriya › SubKategoriya"
                Row titleRow = sheet.createRow(0);
                titleRow.setHeight((short) 600);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("📂 " + category.getName() + "  ›  " + sub.getName());
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, HEADERS.length - 1));

                // Header qatori
                Row headerRow = sheet.createRow(1);
                headerRow.setHeight((short) 450);
                for (int i = 0; i < HEADERS.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(HEADERS[i]);
                    cell.setCellStyle(headerStyle);
                }

                List<CrmLead> leads = crmLeadRepo.findBySubCategoryId(sub.getId());

                if (leads.isEmpty()) {
                    Row emptyRow = sheet.createRow(2);
                    Cell emptyCell = emptyRow.createCell(0);
                    emptyCell.setCellValue("Ma'lumot mavjud emas");
                    emptyCell.setCellStyle(dataStyle);
                    sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, HEADERS.length - 1));
                } else {
                    int rowNum = 2;
                    int counter = 1;
                    for (CrmLead lead : leads) {
                        Row dataRow = sheet.createRow(rowNum++);
                        dataRow.setHeight((short) 380);
                        CellStyle style = (counter % 2 == 0) ? altDataStyle : dataStyle;

                        Abuturient ab = lead.getApplicant();

                        setCell(dataRow, 0,  String.valueOf(counter++),                                                                                       style);
                        setCell(dataRow, 1,  ab != null ? nvl(ab.getLastName())                                           : nvl(lead.getPhone()),             style);
                        setCell(dataRow, 2,  ab != null ? nvl(ab.getFirstName())                                          : "",                               style);
                        setCell(dataRow, 3,  ab != null ? nvl(ab.getFatherName())                                         : "",                               style);
                        setCell(dataRow, 4,  ab != null ? nvl(ab.getPhone())      : nvl(lead.getPhone()),                                                     style);
                        setCell(dataRow, 5,  ab != null ? nvl(ab.getAdditionalPhone())                                    : "",                               style);
                        setCell(dataRow, 6,  ab != null ? nvl(ab.getPassportNumber())                                     : "",                               style);
                        setCell(dataRow, 7,  ab != null ? nvl(ab.getPassportPin())                                        : "",                               style);
                        setCell(dataRow, 8,  ab != null && ab.getEducationField() != null ? ab.getEducationField().getName() : "",                            style);
                        setCell(dataRow, 9,  ab != null && ab.getAppealType()     != null ? ab.getAppealType().getName()     : "",                            style);
                        setCell(dataRow, 10, ab != null && ab.getLanguage()       != null ? (ab.getLanguage() ? "O'zbek" : "Rus")        : "",               style);
                        setCell(dataRow, 11, ab != null && ab.getIsDtm()          != null ? (ab.getIsDtm()    ? "Ha"     : "Yo'q")       : "",               style);
                        setCell(dataRow, 12, ab != null && ab.getIsUniversity()   != null ? (ab.getIsUniversity() ? "Ha" : "Yo'q")       : "",               style);
                        setCell(dataRow, 13, ab != null && ab.getDistrict()       != null ? ab.getDistrict().getName()                   : "",               style);
                        setCell(dataRow, 14, ab != null && ab.getAgent()          != null ? ab.getAgent().getName()                      : "",               style);
                        setCell(dataRow, 15, lead.getCreatedAt() != null ? lead.getCreatedAt().format(DATE_FMT)                          : "",               style);
                        setCell(dataRow, 16, nvl(lead.getSource()),                                                                                           style);
                        setCell(dataRow, 17, ab != null && ab.getStatus() != null ? String.valueOf(ab.getStatus())                       : "",               style);
                    }
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
    // ── Stil yaratuvchi metodlar ─────────────────────────────────────────────

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setIndention((short) 1);
        return style;
    }

    private CellStyle createSubTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setIndention((short) 1);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(style);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.WHITE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(style);
        return style;
    }

    private CellStyle createAltDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(style);
        return style;
    }

    private void setBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private String nvl(String val) {
        return val != null ? val : "";
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }
}