package com.example.backend.Controller;

import com.example.backend.Entity.Attachment;
import com.example.backend.Entity.Contract;
import com.example.backend.Entity.ContractFile;
import com.example.backend.Repository.AttachmentRepo;
import com.example.backend.Repository.ContractFileRepo;
import com.example.backend.Repository.ContractRepo;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static javax.print.attribute.standard.MediaSizeName.C;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/contract-file")
public class ContractFileController {
    private final ContractFileRepo contractFileRepo;
    private final AttachmentRepo attachmentRepo;
    private final ContractRepo contractRepo;
    @GetMapping
    public HttpEntity<?> getContractFile(){
        List<ContractFile> contractFiles = contractFileRepo.findAll();
        return ResponseEntity.ok(contractFiles);
    }

    @GetMapping("/{fileId}")
    public HttpEntity<?> addContractFile(@PathVariable UUID fileId){
        Attachment attachment = attachmentRepo.findById(fileId).orElse(null);
        ContractFile contractFile1 = new ContractFile(attachment, LocalDateTime.now());
        contractFileRepo.save(contractFile1);
        importContractsFromExcel(fileId);
        return ResponseEntity.ok().build();
    }



    public void importContractsFromExcel(@PathVariable UUID fileId) {
        System.out.print(fileId);
        contractRepo.deleteAll();
        Attachment attachment = attachmentRepo.findById(fileId).orElse(null);
        if (attachment == null) {
            return;
        }
        String filePath = "backend/files" + attachment.getPrefix() + "/" + attachment.getName();
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             Workbook workbook = WorkbookFactory.create(fis)) {
            for (String sheetName : new String[]{"1-kurs", "2-kurs", "3-kurs", "4-kurs", "5-kurs"}) {
                Sheet sheet = workbook.getSheet(sheetName);
                if (sheet == null) continue;
                for (Row row : sheet) {

                    if (row.getRowNum() == 0) continue; // Header qatorini tashlab ketish
                    String fullName = getCellValue(row.getCell(1)).toString(); // B column
                    String passportNumber = getCellValue(row.getCell(2)).toString();
                    Long hemisId = parseLong(getCellValue(row.getCell(3))); // D column
                    Integer amount = parseInteger(getCellValue(row.getCell(26))); // Z column
                    Integer payment = parseInteger(getCellValue(row.getCell(27))); // AA column
                    Integer debt = parseInteger(getCellValue(row.getCell(28))); // AB column
                    Integer extra = parseInteger(getCellValue(row.getCell(29))); // AC column
                    Contract contract = new Contract(fullName, sheetName, hemisId, amount, payment, debt, extra, LocalDateTime.now(),passportNumber);
                    contractRepo.save(contract);
                }
            }
            return;

        } catch (Exception e) {
            return;
        }
    }

    // Yangi yaxshilangan integer parse funksiyasi
    private Integer parseInteger(Object value) {
        if (value == null) return null;
        try {
            String strValue = value.toString().trim();
            if (strValue.isEmpty()) return null; // Bo‘sh qiymatlarni null qilib yuborish
            return (int) Double.parseDouble(strValue); // Double orqali butun songa o'tkazish
        } catch (Exception e) {
            return null; // Agar o‘tkazishda xatolik bo‘lsa, null qaytarish
        }
    }
    private Long parseLong(Object value) {
        if (value == null) return null;
        try {
            String strValue = value.toString().trim();
            if (strValue.isEmpty()) return null; // Bo‘sh qiymatlarni null qilib yuborish
            return Long.parseLong(strValue); // To‘g‘ridan-to‘g‘ri Long ga o‘tkazish
        } catch (NumberFormatException e) {
            return null; // Agar xatolik bo‘lsa, null qaytarish
        }
    }


    private Object getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // Check if the cell contains a date or a number
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue(); // Return date if formatted as a date
                } else {
                    // For large numbers, convert them to String to avoid scientific notation
                    return String.format("%.0f", cell.getNumericCellValue());
                }
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case FORMULA:
                // Evaluate the formula and return its computed value
                FormulaEvaluator evaluator = cell.getSheet().getWorkbook().getCreationHelper().createFormulaEvaluator();
                CellValue cellValue = evaluator.evaluate(cell);
                switch (cellValue.getCellType()) {
                    case STRING:
                        return cellValue.getStringValue();
                    case NUMERIC:
                        return String.format("%.0f", cellValue.getNumberValue());
                    case BOOLEAN:
                        return cellValue.getBooleanValue();
                    default:
                        return ""; // Return empty string for unknown formula results
                }
            default:
                return ""; // Return empty string for unknown cell types
        }
    }





//    @GetMapping("/contract/{passportPin}/{level}")
//    public HttpEntity<?> getContractByPassportPin(@PathVariable String passportPin, @PathVariable String level) {
//
//        List<ContractFile> all = contractFileRepo.findAll();
//        if (all.isEmpty()) {
//            return new ResponseEntity<>("No contract files found", HttpStatus.NOT_FOUND);
//        }
//
//        ContractFile contractFile = all.get(all.size() - 1);
//        Attachment attachment = attachmentRepo.findById(contractFile.getFile().getId()).orElse(null);
//        if (attachment == null) {
//            return new ResponseEntity<>("Attachment not found", HttpStatus.NOT_FOUND);
//        }
//
//        // Construct the file path from the attachment
//        String filePath = "backend/files" + attachment.getPrefix() + "/" + attachment.getName();
//        String sheetName = level; // Sheet name based on the level
//
//        try (FileInputStream fis = new FileInputStream(new File(filePath));
//             Workbook workbook = WorkbookFactory.create(fis)) {
//
//            Sheet sheet = workbook.getSheet(sheetName); // Get the sheet by level name
//            if (sheet == null) {
//                return new ResponseEntity<>("Sheet not found: " + sheetName, HttpStatus.BAD_REQUEST);
//            }
//
//            for (Row row : sheet) {
//                String cellValue = getCellValue(row.getCell(2)).toString(); // Retrieve value from the 3rd column (passport pin)
//                if (cellValue.equals(passportPin)) {
//                    DecimalFormat decimalFormat = new DecimalFormat("#");
//
//                    Map<String, Object> data = new HashMap<>();
//                    data.put("kontrakt", decimalFormat.format(row.getCell(26).getNumericCellValue()));
//                    data.put("tolov", decimalFormat.format(row.getCell(27).getNumericCellValue()));
//                    data.put("qarzi", decimalFormat.format(row.getCell(28).getNumericCellValue()));
//                    data.put("ortiqcha", decimalFormat.format(row.getCell(29).getNumericCellValue()));
//                    return ResponseEntity.ok(data);
//                }
//            }
//
//            return new ResponseEntity<>("Passport PIN not found", HttpStatus.NOT_FOUND);
//        } catch (Exception e) {
//            return new ResponseEntity<>("Error occurred while reading contract data", HttpStatus.INTERNAL_SERVER_ERROR);
//        }
//    }
//
//    private Object getCellValue(Cell cell) {
//        if (cell == null) {
//            return "";
//        }
//        switch (cell.getCellType()) {
//            case STRING:
//                return cell.getStringCellValue();
//            case NUMERIC:
//                // Check if the cell contains a date or a number
//                if (DateUtil.isCellDateFormatted(cell)) {
//                    return cell.getDateCellValue(); // Return date if formatted as a date
//                } else {
//                    // For large numbers, convert them to String to avoid scientific notation
//                    return String.format("%.0f", cell.getNumericCellValue());
//                }
//            case BOOLEAN:
//                return cell.getBooleanCellValue();
//            case FORMULA:
//                return cell.getCellFormula();
//            default:
//                return ""; // Return empty string for unknown cell types
//        }
//    }




}
