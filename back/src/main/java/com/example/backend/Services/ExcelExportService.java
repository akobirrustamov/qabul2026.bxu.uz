package com.example.backend.Services;

import com.example.backend.Entity.*;
import com.example.backend.Repository.AbuturientDocumentRepo;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.ContractRepo;
import com.example.backend.Repository.DiscountStudentRepo;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ExcelExportService {
    private final AbuturientRepo abuturientRepo;
    private final AbuturientDocumentRepo abuturientDocumentRepo;


    public ExcelExportService(AbuturientRepo abuturientRepo,
                              AbuturientDocumentRepo abuturientDocumentRepo) {
        this.abuturientRepo = abuturientRepo;
        this.abuturientDocumentRepo = abuturientDocumentRepo;


    }

    /** 🔹 Helper method to write safely into a cell */
    private void safeSetCellValue(Row row, int colIdx, Object value) {
        try {
            Cell cell = row.createCell(colIdx);
            if (value == null) {
                cell.setCellValue("");
            } else if (value instanceof Number) {
                cell.setCellValue(((Number) value).doubleValue());
            } else if (value instanceof LocalDateTime) {
                cell.setCellValue(((LocalDateTime) value).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
            } else if (value instanceof LocalDate) {
                cell.setCellValue(((LocalDate) value).format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            } else {
                cell.setCellValue(value.toString());
            }
        } catch (Exception e) {
            System.out.printf("fuck");
            // ignore error, leave cell blank
        }
    }

    public ByteArrayInputStream exportToExcel(String firstName, String lastName, String fatherName,
                                              String passportNumber, String passportPin, String phone,
                                              Integer appealTypeId, Integer educationFieldId, UUID agentId, Integer isStudy,
                                              LocalDate createdAt) throws IOException {
        List<Abuturient> abuturients;
        if (isStudy != null) {
            abuturients = abuturientRepo.findByFiltersOneWithIsStudy(
                    firstName, lastName, fatherName, passportNumber, passportPin, phone,
                    appealTypeId, educationFieldId, agentId, isStudy, createdAt);
        } else {
            abuturients = abuturientRepo.findByFiltersOne(
                    firstName, lastName, fatherName, passportNumber, passportPin, phone,
                    appealTypeId, educationFieldId, agentId, createdAt);
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Abuturients");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "№", "Ism", "Familia", "Otasining ismi", "Onasining ismi",
                    "Passport raqami", "JSHR", "Telefon", "Ro'yxatdan o'tgan sana",
                    "Ta'lim turi", "Ta'lim shakli", "Yo'nalishi", "To'plangan bal",
                    "Agent", "Viloyat", "Tuman", "Shartnoma olgan", "Hujjat holati",
                    "Batafsil", "O'qish holati","O'qishni bekor qilgan sana","Agentga berilgan pul"
            };
            for (int i = 0; i < headers.length; i++) {
                safeSetCellValue(headerRow, i, headers[i]);
            }

            // Data Rows
            int rowIdx = 1;
            int counter = 1;
            for (Abuturient abuturient : abuturients) {
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;

                safeSetCellValue(row, colIdx++, counter++); // №
                safeSetCellValue(row, colIdx++, abuturient.getFirstName());
                safeSetCellValue(row, colIdx++, abuturient.getLastName());
                safeSetCellValue(row, colIdx++, abuturient.getFatherName());
                safeSetCellValue(row, colIdx++, abuturient.getMotherName());
                safeSetCellValue(row, colIdx++, abuturient.getPassportNumber());
                safeSetCellValue(row, colIdx++, abuturient.getPassportPin());
                safeSetCellValue(row, colIdx++, abuturient.getPhone());
                LocalDateTime createdAtDateTime = abuturient.getCreatedAt();
                safeSetCellValue(row, colIdx++, createdAtDateTime);

                // Education
                try {
                    if (abuturient.getEducationField() != null) {
                        EducationField ef = abuturient.getEducationField();
                        EducationForm form = ef.getEducationForm();
                        EducationType type = (form != null) ? form.getEducationType() : null;
                        safeSetCellValue(row, colIdx++, type != null ? type.getName() : "");
                        safeSetCellValue(row, colIdx++, form != null ? form.getName() : "");
                        safeSetCellValue(row, colIdx++, ef.getName());
                    } else {
                        safeSetCellValue(row, colIdx++, "");
                        safeSetCellValue(row, colIdx++, "");
                        safeSetCellValue(row, colIdx++, "");
                    }
                } catch (Exception e) {
                    safeSetCellValue(row, colIdx++, "");
                    safeSetCellValue(row, colIdx++, "");
                    safeSetCellValue(row, colIdx++, "");
                }

                // Ball
                safeSetCellValue(row, colIdx++, abuturient.getBall());

                // Agent
                safeSetCellValue(row, colIdx++, abuturient.getAgent() != null ? abuturient.getAgent().getName() : "");

                // Region / District
                try {
                    District d = abuturient.getDistrict();
                    Region r = (d != null) ? d.getRegion() : null;
                    safeSetCellValue(row, colIdx++, r != null ? r.getName() : "");
                    safeSetCellValue(row, colIdx++, d != null ? d.getName() : "");
                } catch (Exception e) {
                    safeSetCellValue(row, colIdx++, "");
                    safeSetCellValue(row, colIdx++, "");
                }

                // Status
                String statusText = "";
                try {
                    Integer status = abuturient.getStatus();
                    if (status != null) {
                        switch (status) {
                            case 1 -> statusText = "Telefon raqam kiritgan";
                            case 2 -> statusText = "Ma'lumot kiritgan";
                            case 3 -> statusText = "Test yechgan";
                            case 4 -> statusText = "Shartnoma olgan";
                        }
                    }
                } catch (Exception ignored) {}
                safeSetCellValue(row, colIdx++, statusText);

                // Document status
                String documentStatusText = "Hujjat topshirmagan";
                try {
                    Integer ds = abuturient.getDocumentStatus();
                    if (ds != null) {
                        if (ds == 1) documentStatusText = "Chala topshirgan";
                        else if (ds == 2) documentStatusText = "To'liq hujjat topshirgan";
                    }
                } catch (Exception ignored) {}
                safeSetCellValue(row, colIdx++, documentStatusText);

                // Description
                String description = "";
                try {
                    Optional<AbuturientDocument> ad = abuturientDocumentRepo.findByAbuturientId(abuturient.getId());
                    if (ad.isPresent()) description = ad.get().getDescription();
                } catch (Exception ignored) {}
                safeSetCellValue(row, colIdx++, description);
                String statsStudy = "";
                LocalDateTime day = null;
                try {
                    Integer status2 = abuturient.getIsStudy();
                    if (status2 != null) {
                        if (status2 == 1) {
                            statsStudy = "O'qiydi";
                        } else if (status2 == 0) {
                            statsStudy = "O'qimaydi";
                            day = abuturient.getIsStudyUpdatedAt();
                        } else {
                            statsStudy = "";
                        }
                    } else {
                        statsStudy = "";
                    }
                } catch (Exception ignored) {}
                safeSetCellValue(row, colIdx++, statsStudy);
                safeSetCellValue(row, colIdx++, day != null ? day.toString() : "");

                Integer agentPayment=0;
                if(abuturient.getIsPayed()!=null) {
                    if (abuturient.getIsPayed()) {
                        agentPayment = abuturient.getAmount();
                    }
                }
                safeSetCellValue(row, colIdx++, agentPayment != null ? agentPayment.toString() : "");




            }

            // Auto-size
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream exportToExcelSecondJob(
            String firstName,
            String lastName,
            String fatherName,
            String passportNumber,
            String passportPin,
            String phone,
            Integer appealTypeId,
            Integer educationFieldId,
            UUID agentId,
            Integer isStudy,
            LocalDate createdAt
    ) {
        List<Abuturient> abuturients = abuturientRepo.findByFilters(
                firstName, passportNumber, passportPin, phone,
                appealTypeId, educationFieldId, agentId, createdAt,
                Pageable.unpaged()
        ).getContent();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("SecondJob");

            String[] headers = {"#", "Ism", "Familiya", "Passport", "Telefon"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                safeSetCellValue(headerRow, i, headers[i]);
            }

            int rowIdx = 1, counter = 1;
            for (Abuturient a : abuturients) {
                Row row = sheet.createRow(rowIdx++);
                safeSetCellValue(row, 0, counter++);
                safeSetCellValue(row, 1, a.getFirstName());
                safeSetCellValue(row, 2, a.getLastName());
                safeSetCellValue(row, 3, a.getPassportNumber());
                safeSetCellValue(row, 4, a.getPhone());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }
}
