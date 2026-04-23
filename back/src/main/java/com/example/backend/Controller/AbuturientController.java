package com.example.backend.Controller;

import com.example.backend.DTO.AbuturientDTO;
import com.example.backend.DTO.ForeignAbuturientDTO;
import com.example.backend.Entity.*;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.*;
import com.example.backend.Services.AmbassadorPaymentService;
import com.example.backend.Services.SmsCodeService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.itextpdf.text.*;
import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;


@RestController
@RequestMapping("/api/v1/abuturient")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AbuturientController {
    private final AbuturientAmocrmRepo abuturientAmocrmRepo;
    private final AbuturientRepo abuturientRepo;
    private final UserRepo userRepo;
    private final AppealTypeRepo appealTypeRepo;
    private final EducationFieldRepo educationFieldRepo;
    private final AgentPathRepo agentPathRepo;
    private final DistrictRepo districtRepo;
    private final BrowserTokenRepository browserTokenRepository;
    private final HistoryOfAbuturientRepo historyOfAbuturientRepo;
    private final HistoryRepo historyRepo;
    private final TestScoreRepo testScoreRepo;
    private final SmsCodeRepo smsCodeRepo;
    private final SmsCodeService smsCodeService;
    private final AbuturientDocumentRepo abuturientDocumentRepo;
    private final PaymentAgentsRepo paymentAgentsRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;
    private final CrmCategoryRepo crmCategoryRepo;
    private final CrmLeadRepo crmLeadRepo;
    private final CrmLeadCommentRepo crmLeadCommentRepo;
    private final SimpMessagingTemplate messagingTemplate;


    private final AmbassadorPaymentService ambassadorPaymentService;

    @PutMapping("/agent/{abuturientId}/{agentId}")
    public HttpEntity<?> updateAbuturient(@PathVariable UUID abuturientId, @PathVariable UUID agentId) {
        Optional<Abuturient> byId = abuturientRepo.findById(abuturientId);
        Optional<User> agent = userRepo.findById(agentId);

        if (agent.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        if (byId.isPresent()) {
            Abuturient abuturent = byId.get();
            abuturent.setAgent(agent.get());
            abuturientRepo.save(abuturent);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }


    @GetMapping("/student/{passportNumber}")
    public HttpEntity<?> getStudent(@PathVariable String passportNumber) {
        Optional<Abuturient> byAbuturientByJshshR = abuturientRepo.findByAbuturientByJshshR(passportNumber);
        if(byAbuturientByJshshR.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        Abuturient abuturient = byAbuturientByJshshR.get();
        return ResponseEntity.ok().body(abuturient);
    }

    @GetMapping("/student-online/{passportNumber}")
    public HttpEntity<?> getStudentOnline(@PathVariable String passportNumber) {
        Optional<Abuturient> byAbuturientByJshshR = abuturientRepo.findByAbuturientByJshshR(passportNumber);
        if(byAbuturientByJshshR.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        Abuturient abuturient = byAbuturientByJshshR.get();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "phoneNumber", abuturient.getPhone()
        ));
    }


    @GetMapping("/student/{agentId}/{passportNumber}")
    public HttpEntity<?> getStudent(@PathVariable UUID agentId, @PathVariable String passportNumber ) {
        Optional<Abuturient> byAbuturientByJshshR = abuturientRepo.findByAbuturientByJshshRAndAgentId(passportNumber, agentId);
        if(byAbuturientByJshshR.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        Abuturient abuturient = byAbuturientByJshshR.get();
        return ResponseEntity.ok().body(abuturient);
    }


    @PostMapping("/isdtm/{id}")
    public ResponseEntity<Boolean> isdtm(@PathVariable UUID id, @RequestBody Map<String, Boolean> request) {
        Optional<Abuturient> abuturientOpt = abuturientRepo.findById(id);
        if(abuturientOpt.isEmpty()){
            return ResponseEntity.notFound().build();

        }
        Boolean isdtm = request.get("isdtm");
        if (isdtm == null) {
            return ResponseEntity.badRequest().build();
        }

        Abuturient abuturient = abuturientOpt.get();
        abuturient.setIsDtm(isdtm);
        abuturientRepo.save(abuturient);
        CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
        CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 4).orElseThrow();
        Optional<CrmLead> crmLead = crmLeadRepo.findByApplicantId(abuturient.getId());
        if (crmLead.isEmpty()) {
            throw new RuntimeException("Lead is required");
        }

        CrmLead lead = crmLead.get();
        lead.setCrmSubCategory(crmSubCategory);
        CrmLead savedLead = crmLeadRepo.save(lead);
        User commenter = userRepo.findByPhone("crm-bot")
                .orElseThrow(() -> new RuntimeException("User not found"));

        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(savedLead)
                .commenter(commenter)
                .description("Qabul saytida DTM ballni kiritdi")
                .historyStatus(4)
                .createdAt( LocalDateTime.now())
                .build();
        CrmLeadComment saved = crmLeadCommentRepo.save(comment);
        messagingTemplate.convertAndSend("/topic/lead-comment", saved);
        messagingTemplate.convertAndSend("/topic/lead-update", savedLead);

        return ResponseEntity.ok(true);
    }


    

    @DeleteMapping("/{abuturientId}")
    public HttpEntity<?> deleteAbuturient(@PathVariable UUID abuturientId) {
        smsCodeRepo.deleteByAbuturient_Id(abuturientId);
        paymentAgentsRepo.deleteByAbuturient_Id(abuturientId);
        abuturientAmocrmRepo.deleteById(abuturientId);
        historyOfAbuturientRepo.deleteByAbuturientId(abuturientId);
        historyRepo.deleteByAbuturientId(abuturientId);
        testScoreRepo.deleteByAbuturientId(abuturientId);
        abuturientDocumentRepo.deleteByAbuturientId(abuturientId);
        abuturientRepo.deleteById(abuturientId);
        return new HttpEntity<>(HttpStatus.OK);
    }


    @PostMapping("/foreign")
    public HttpEntity<?> addForeign(@RequestBody ForeignAbuturientDTO request) {
        System.out.println(request);
        Abuturient abuturient = abuturientRepo.findByPhone(request.getPhone());
        if (Objects.isNull(abuturient)) {
            abuturient = new Abuturient();
        }
        if (abuturient.getStatus() == null) {
            abuturient.setStatus(1);
            abuturient.setFirstName(request.getFirstName());
            abuturient.setLastName(request.getLastName());
            abuturient.setPhone(request.getPhone());
            abuturient.setFatherName(request.getFatherName());
            abuturient.setAppealType(appealTypeRepo.findById(request.getAppealTypeId()).orElseThrow());
            abuturient.setEducationField(educationFieldRepo.findById(request.getEducationFieldId()).orElseThrow());
            abuturient.setEnrolledAt(LocalDateTime.now());
            abuturient.setIsForeign(true);
            abuturient.setCountry(request.getCountry());
            abuturient.setCity(request.getCity());
            abuturientRepo.save(abuturient);
        }
        return ResponseEntity.ok(abuturient);

    }
    @PostMapping("/without-sms")
    public HttpEntity<?> addAbuturientWithoutSms(@RequestBody AbuturientDTO request) {
        Optional<Abuturient> byPhone = abuturientRepo.findByPhoneOptional(request.getPhone());

        System.out.println("hi");
        // 🔥 Agar mavjud bo‘lsa
        if (byPhone.isPresent()) {
            Optional<CrmLead> crmLeadOptional = crmLeadRepo.findByApplicantId(byPhone.get().getId());
            String text = "Bu telefon raqam allaqachon mavjud: " + request.getPhone()+" Kategoriya: "+crmLeadOptional.get().getCrmSubCategory().getCrmCategory().getName()+" bosqichi: "+ crmLeadOptional.get().getCrmSubCategory().getName() +" biriktirilgan operator: "+ crmLeadOptional.get().getOperator().getName();
            System.out.println(text);
            return ResponseEntity.ok(text);
        }
        Optional<AgentPath> byAgentNumber = agentPathRepo.findByAgentId(request.getAgent());
        User agent = null;

        if (byAgentNumber.isPresent()) {
            agent = byAgentNumber.get().getAgent();
        }
        try {
            // 🧑‍🎓 Abuturient yaratish
            Abuturient abuturient = new Abuturient(
                    request.getPhone(),
                    agent,
                    0, // Bu yerda abituriyent holatini belgilash
                    LocalDateTime.now(),
                    contractNumber()
            );

            abuturient.setIsDtm(request.getIsDtm());

            Abuturient saved = abuturientRepo.save(abuturient);

            // 📊 CRM Lead yaratish
            CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
            CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 1).orElseThrow();
            Optional<User> userOptional = userRepo.findById(request.getCommenterId());
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            CrmLead crmLead = CrmLead.builder()
                    .createdAt(LocalDateTime.now())
                    .phone(saved.getPhone())
                    .operator(userOptional.get())
                    .source("Operator tomonidan qo'shilgan")
                    .status(true)
                    .applicant(saved)
                    .crmSubCategory(crmSubCategory)
                    .build();

            crmLeadRepo.save(crmLead);

            User user = userOptional.get();
            // 📝 Izoh yaratish
            String description = user.getName() + " tomonidan yangi abituriyent qo‘shildi: " + saved.getPhone();

            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(crmLead)
                    .commenter(user)  // Izohni agent qo'shadi
                    .description(description)
                    .historyStatus(4)  // status: 1 - o'zgartirilgan
                    .createdAt(LocalDateTime.now())
                    .build();

            CrmLeadComment save = crmLeadCommentRepo.save(comment);
            messagingTemplate.convertAndSend("/topic/new-lead", crmLead);
            messagingTemplate.convertAndSend("/topic/lead-comment", save);

            // ✅ SMS o‘rniga response
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error saving Abuturient: " + e.getMessage());
        }
    }

    @PostMapping("/without-sms-sipuni")
    public HttpEntity<?> addAbuturientWithoutSmsSipuni(@RequestBody AbuturientDTO request) {
        Optional<Abuturient> byPhone = abuturientRepo.findByPhoneOptional(request.getPhone());

        // 🔥 Agar mavjud bo‘lsa
        if (byPhone.isPresent()) {
            // ❌ SMS o‘rniga to‘g‘ridan-to‘g‘ri qaytaramiz
            return ResponseEntity.ok(byPhone.get());
        }
        Optional<AgentPath> byAgentNumber = agentPathRepo.findByAgentId(request.getAgent());
        User agent = null;

        if (byAgentNumber.isPresent()) {
            agent = byAgentNumber.get().getAgent();
        }

        try {
            // 🧑‍🎓 Abuturient yaratish
            Abuturient abuturient = new Abuturient(
                    request.getPhone(),
                    agent,
                    0, // Bu yerda abituriyent holatini belgilash
                    LocalDateTime.now(),
                    contractNumber()
            );

            abuturient.setIsDtm(request.getIsDtm());

            Abuturient saved = abuturientRepo.save(abuturient);

            // 📊 CRM Lead yaratish
            CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
            CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 1).orElseThrow();

            CrmLead crmLead = CrmLead.builder()
                    .createdAt(LocalDateTime.now())
                    .phone(saved.getPhone())
                    .source("SIPUNI")
                    .status(true)
                    .applicant(saved)
                    .crmSubCategory(crmSubCategory)
                    .build();

            crmLeadRepo.save(crmLead);
            Optional<User> userOptional = userRepo.findByPhone("crm-bot");
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            User user = userOptional.get();
            // 📝 Izoh yaratish
            String description = user.getName() + " tomonidan yangi abituriyent qo‘shildi: " + saved.getPhone();
            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(crmLead)
                    .commenter(user)  // Izohni agent qo'shadi
                    .description(description)
                    .historyStatus(3)  // status: 1 - o'zgartirilgan
                    .createdAt(LocalDateTime.now())
                    .build();

            CrmLeadComment save = crmLeadCommentRepo.save(comment);
            messagingTemplate.convertAndSend("/topic/new-lead", crmLead);
            messagingTemplate.convertAndSend("/topic/lead-comment", save);

            // ✅ SMS o‘rniga response
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error saving Abuturient: " + e.getMessage());
        }
    }



    @PostMapping
    public HttpEntity<?> addAbuturient(@RequestBody AbuturientDTO request) {
        Optional<Abuturient> byPhone = abuturientRepo.findByPhoneOptional(request.getPhone());
        if(byPhone.isPresent()){
//            bu smsga tegishli
//            if (byPhone.get().getStatus() <1) {
//               return sendSmsCode(byPhone.get(), byPhone.get());
//            }
            return ResponseEntity.ok(byPhone.get());
        }
        Optional<AgentPath> byAgentNumber = agentPathRepo.findByAgentNumber(request.getAgentId());
        User agent = null;
        if (byAgentNumber.isPresent()) {
            agent = byAgentNumber.get().getAgent();
        }
        try {

            Abuturient abuturient = new Abuturient(request.getPhone(), agent, 1, LocalDateTime.now(), contractNumber());
            abuturient.setIsDtm(request.getIsDtm());
            Abuturient save = abuturientRepo.save(abuturient);
            CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
            CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 1).orElseThrow();
            CrmLead crmLead = CrmLead.builder()
                    .createdAt(LocalDateTime.now())
                    .phone(save.getPhone())
                    .source("qabul website")
                    .status(true)
                    .applicant(save)
                    .crmSubCategory(crmSubCategory)
                    .build();
            CrmLead savedLead = crmLeadRepo.save(crmLead);


            User commenter = userRepo.findByPhone("crm-bot")
                    .orElseThrow(() -> new RuntimeException("User not found"));

            CrmLeadComment comment = CrmLeadComment.builder()
                    .crmLead(savedLead)
                    .commenter(commenter)
                    .description("Qabul saytidan ro'yxatdan o'tdi ")
                    .historyStatus(4)
                    .createdAt( LocalDateTime.now())
                    .build();
            CrmLeadComment saved = crmLeadCommentRepo.save(comment);
            messagingTemplate.convertAndSend("/topic/lead-comment", saved);
            messagingTemplate.convertAndSend("/topic/new-lead", crmLead);
//            return sendSmsCode(save, abuturient);
            return ResponseEntity.ok(abuturient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving Abuturient: " + e.getMessage());
        }
    }
    private HttpEntity<?> sendSmsCode(Abuturient save, Abuturient abuturient) {
        Random random = new Random();
        int code = 1000 + random.nextInt(9000); // 1000–9999 oralig‘ida
        Boolean b =false;
        System.out.printf("code: %s\n", code);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(2);
        Optional<SmsCode> byAbuturientId = smsCodeRepo.findByAbuturientId(save.getId());
        if (byAbuturientId.isPresent()) {
            if (LocalDateTime.now().isAfter(byAbuturientId.get().getExpireTime())){
                smsCodeRepo.delete(byAbuturientId.get());
            }
            return ResponseEntity.noContent().build();
        }
        SmsCode smsCode = new SmsCode(code,save,LocalDateTime.now(), expiryTime);
        smsCodeRepo.save(smsCode);
        try {
            b = smsCodeService.sendSmsCode(abuturient.getPhone(), code);
        }catch (Exception e){
            System.out.printf("error sebding message: %s\n", abuturient);
        }
        if (b) {
            System.out.printf("smsCode: %s\n", smsCode);
            return ResponseEntity.ok(save);
        } else {
            return ResponseEntity.notFound().build();
        }
    }



    public Integer contractNumber() {
        Integer randomPathNumber = ThreadLocalRandom.current().nextInt(100000, 1000000);
        Optional<Abuturient> byContractNumber = abuturientRepo.findByContractNumber(randomPathNumber);
        if (byContractNumber.isPresent()) {
            contractNumber();
        }
        return randomPathNumber;
    }

    @PutMapping("/user-info")
    public HttpEntity<?> updateAbuturientUserInfo(@RequestBody AbuturientDTO request) throws IOException {

        Abuturient abuturient = abuturientRepo.findByPhone(request.getPhone());
        if (Objects.isNull(abuturient)) {
            return ResponseEntity.ok(null);
        }
        Optional<Abuturient> abuturient1 = abuturientRepo.findByAbuturientByJshshR(request.getPassportPin());
        if (abuturient1.isPresent()) {
            return ResponseEntity.ok(abuturient1.get());
        }

        if (abuturient.getStatus() == 0) {
            District district = null;
            Optional<District> byId = districtRepo.findById(request.getDistrictId());
            if (byId.isPresent()) {
                district = byId.get();
            }
            abuturient.setStatus(1);
            abuturient.setFirstName(request.getFirstName());
            abuturient.setLastName(request.getLastName());
            abuturient.setPhone(request.getPhone());
            abuturient.setFatherName(request.getFatherName());
            abuturient.setPassportNumber(request.getPassportNumber());
            abuturient.setPassportPin(request.getPassportPin());
            if (request.getLevel() != null) {
                abuturient.setLevel(abuturient.getLevel());
            }
            abuturient.setDistrict(district);

            abuturientRepo.save(abuturient);
            try{
                CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
                CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 2).orElseThrow();
                Optional<CrmLead> crmLead = crmLeadRepo.findByApplicantId(abuturient.getId());
                if (crmLead.isEmpty()) {
                    throw new RuntimeException("Lead is required");
                }

                CrmLead lead = crmLead.get();
                lead.setCrmSubCategory(crmSubCategory);
                CrmLead savedLead = crmLeadRepo.save(lead);
                User commenter = userRepo.findByPhone("crm-bot")
                        .orElseThrow(() -> new RuntimeException("User not found"));

                CrmLeadComment comment = CrmLeadComment.builder()
                        .crmLead(savedLead)
                        .commenter(commenter)
                        .description("Qabul saytida shaxsiy ma'lumotlarini kiritdi ")
                        .historyStatus(3)
                        .createdAt( LocalDateTime.now())
                        .build();
                CrmLeadComment saved = crmLeadCommentRepo.save(comment);
                messagingTemplate.convertAndSend("/topic/lead-update", savedLead);
                messagingTemplate.convertAndSend("/topic/lead-comment", saved);

            }catch (Exception e){
                System.out.printf("Error in: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(abuturient);
    }
    @PutMapping("/user-info/edit")
    public HttpEntity<?> updateAbuturientUserInfoEdit(@RequestBody AbuturientDTO request) throws IOException {
        Abuturient abuturient = abuturientRepo.findByPhone(request.getPhone());
        if (Objects.isNull(abuturient)) {
            return ResponseEntity.ok(null);
        }

        // ✅ Faqat BOSHQA odamning PIN i bo'lsa bloklash
        Optional<Abuturient> byPin = abuturientRepo.findByAbuturientByJshshR(request.getPassportPin());
        if (byPin.isPresent() && !byPin.get().getId().equals(abuturient.getId())) {
            return ResponseEntity.ok(byPin.get());
        }

        District district = null;
        if (request.getDistrictId() != null) {
            districtRepo.findById(request.getDistrictId()).ifPresent(d -> abuturient.setDistrict(d));
        }

        abuturient.setFirstName(request.getFirstName());
        abuturient.setLastName(request.getLastName());
        abuturient.setFatherName(request.getFatherName());
        abuturient.setPassportNumber(request.getPassportNumber());
        abuturient.setPassportPin(request.getPassportPin());
        if (request.getLevel() != null) {
            abuturient.setLevel(request.getLevel());
        }

        abuturientRepo.save(abuturient);
        return ResponseEntity.ok(abuturient);
    }

    @PutMapping("/data-form")
    public HttpEntity<?> updateAbuturientDataForm(@RequestBody AbuturientDTO request) throws IOException {
        Abuturient abuturient = abuturientRepo.findByPhone(request.getPhone());
        if (Objects.isNull(abuturient)) {
            return ResponseEntity.ok(null);
        }

        // ✅ Status tekshiruvi olib tashlandi — istalgan holatda yangilash mumkin
        abuturient.setAppealType(appealTypeRepo.findById(request.getAppealTypeId()).orElseThrow());
        abuturient.setEducationField(educationFieldRepo.findById(request.getEducationFieldId()).orElseThrow());

        // Faqat birinchi marta to'ldirilganda status va sana o'rnatiladi
        if (abuturient.getStatus() != null && abuturient.getStatus() == 1) {
            abuturient.setStatus(2);
            abuturient.setEnrolledAt(LocalDateTime.now());
        }

        if (request.getLevel() != null) {
            abuturient.setLevel(request.getLevel()); // ✅ abuturient.getLevel() emas, request dan olish kerak
        }
        abuturientRepo.save(abuturient);
        // CRM lead ni yangilash
        CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
        CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 3).orElseThrow();
        Optional<CrmLead> crmLead = crmLeadRepo.findByApplicantId(abuturient.getId());
        if (crmLead.isEmpty()) {
            throw new RuntimeException("Lead is required");
        }

        CrmLead lead = crmLead.get();
        lead.setCrmSubCategory(crmSubCategory);
        CrmLead save = crmLeadRepo.save(lead);

        User commenter = userRepo.findByPhone("crm-bot")
                .orElseThrow(() -> new RuntimeException("User not found"));

        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(save)
                .commenter(commenter)
                .description("Qabul saytida yo'nalish tanladi ")
                .historyStatus(4)
                .createdAt( LocalDateTime.now())
                .build();
        CrmLeadComment saved = crmLeadCommentRepo.save(comment);
        messagingTemplate.convertAndSend("/topic/lead-update", save);
        messagingTemplate.convertAndSend("/topic/lead-comment", saved);

        return ResponseEntity.ok(abuturient);
    }

    @PutMapping
    public HttpEntity<?> updateAbuturient(@RequestBody AbuturientDTO request) throws IOException {
        System.out.println(request);
        Abuturient abuturient = abuturientRepo.findByPhone(request.getPhone());
        if (Objects.isNull(abuturient)) {
            return ResponseEntity.ok(null);
        }
        if (abuturient.getStatus() == 0) {
            District district = null;
            Optional<District> byId = districtRepo.findById(request.getDistrictId());
            if (byId.isPresent()) {
                district = byId.get();
            }
            abuturient.setStatus(1);
            abuturient.setFirstName(request.getFirstName());
            abuturient.setLastName(request.getLastName());
            abuturient.setPhone(request.getPhone());
            abuturient.setFatherName(request.getFatherName());
            abuturient.setMotherName(request.getMotherName());
            abuturient.setAppealType(appealTypeRepo.findById(request.getAppealTypeId()).orElseThrow());
            abuturient.setEducationField(educationFieldRepo.findById(request.getEducationFieldId()).orElseThrow());
            abuturient.setEnrolledAt(LocalDateTime.now());
            abuturient.setPassportNumber(request.getPassportNumber());
            abuturient.setPassportPin(request.getPassportPin());
            if (request.getLevel() != null) {
                abuturient.setLevel(abuturient.getLevel());
            }
            abuturient.setDistrict(district);

            abuturientRepo.save(abuturient);
            try{
                if (abuturient.getAgent()!= null) {
                    UUID targetAgentId = UUID.fromString("cf8aeeef-c3ab-439e-8b77-8ef05f13e425");

                    if (abuturient.getAgent().getId().equals(targetAgentId)) {
                        return ResponseEntity.ok(abuturient);

                    }
                }

            }catch (Exception e){
                System.out.println("hi");
            }
        }
        return ResponseEntity.ok(abuturient);
    }


    @GetMapping("/{phone}")
    public HttpEntity<?> getAllAbuturient(@PathVariable String phone) {
        Abuturient abuturient = abuturientRepo.findByPhone(phone);
        if (Objects.isNull(abuturient)) {
            System.out.println(1);
            return ResponseEntity.ok(null);
        }
        if (abuturient.getStatus() == 0) {
            System.out.println(2);

            return ResponseEntity.ok(abuturient);
        }

        return ResponseEntity.ok(abuturient);

    }


    @GetMapping("/app/{abuturientId}")
    public HttpEntity<?> getAbuturientById(@PathVariable UUID abuturientId) {
        Optional<Abuturient> abuturientOptional = abuturientRepo.findById(abuturientId);
        if (abuturientOptional.isEmpty()) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(abuturientOptional.get());
    }













    @GetMapping("/contract/{phone}")
    public void getAllAbuturientContract(@PathVariable String phone, HttpServletResponse response) throws IOException {
        Abuturient abuturient = abuturientRepo.findByPhone(phone);
        abuturient.setStatus(4);
        abuturientRepo.save(abuturient);
        if (abuturient == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        CrmCategory crmCategory = crmCategoryRepo.findBySortOrder(1).orElseThrow();
        CrmSubCategory crmSubCategory = crmSubCategoryRepo.findBySortOrderAndCategoryId(crmCategory.getId(), 5).orElseThrow();
        Optional<CrmLead> crmLead = crmLeadRepo.findByApplicantId(abuturient.getId());
        if (crmLead.isEmpty()) {
            throw new RuntimeException("Lead is required");
        }

        CrmLead lead = crmLead.get();
        lead.setCrmSubCategory(crmSubCategory);
        CrmLead savedLead = crmLeadRepo.save(lead);
        User commenter = userRepo.findByPhone("crm-bot")
                .orElseThrow(() -> new RuntimeException("User not found"));

        CrmLeadComment comment = CrmLeadComment.builder()
                .crmLead(savedLead)
                .commenter(commenter)
                .description("Qabul saytidan shartnoma berildi ")
                .historyStatus(4)
                .createdAt( LocalDateTime.now())
                .build();
        CrmLeadComment saved = crmLeadCommentRepo.save(comment);
        messagingTemplate.convertAndSend("/topic/lead-update", savedLead);
        messagingTemplate.convertAndSend("/topic/lead-comment", saved);
        Document document = new Document(PageSize.A4);
        String filePath = "./Contract_" + phone + ".pdf";


        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font boldFont = new Font(Font.FontFamily.TIMES_ROMAN, 8, Font.BOLD);
            Font regularFont = new Font(Font.FontFamily.TIMES_ROMAN, 8, Font.NORMAL);


            // Header
            Paragraph paragraph1 = new Paragraph("SHARTNOMA Nº K-" + abuturient.getContractNumber(), boldFont);
            paragraph1.setAlignment(Element.ALIGN_CENTER);
            paragraph1.setSpacingBefore(5f);
            document.add(paragraph1);

            Paragraph paragraph = new Paragraph("Ta'lim xizmatlarini ko'rsatish uchun", boldFont);
            paragraph.setAlignment(Element.ALIGN_CENTER);
            paragraph.setSpacingAfter(5f);
            document.add(paragraph);


            PdfPTable headerTable = new PdfPTable(4);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new int[]{1, 2, 3, 2}); // Column ratios: logo, date, payment, QR

// ====== 1. LOGO CELL ======
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.BOX);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            try {
                Image logo = Image.getInstance("./logo.png");
                logo.scaleToFit(50, 50);
                logoCell.addElement(logo);
            } catch (Exception e) {
                logoCell.addElement(new Paragraph("Logo not found", regularFont));
            }
            headerTable.addCell(logoCell);

// ====== 2. DATE CELL ======
            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(Rectangle.BOX);
            dateCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            dateCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
//            LocalDate today = LocalDate.now();
            LocalDate today = abuturient.getCreatedAt().toLocalDate();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
            String formattedDate = today.format(formatter);
            dateCell.addElement(new Paragraph("Shartnoma berilgan sana:", regularFont));
            dateCell.addElement(new Paragraph(formattedDate + " yil", regularFont));
            headerTable.addCell(dateCell);

// ====== 3. PAYMENT CELL ======
            PdfPCell paymentCell = new PdfPCell();
            paymentCell.setBorder(Rectangle.BOX);
            paymentCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            paymentCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            String fullName = abuturient.getLastName().toUpperCase() + " " +
                    abuturient.getFirstName().toUpperCase() + " " +
                    abuturient.getFatherName().toUpperCase();

            paymentCell.addElement(new Paragraph("TO'LOV UCHUN!!!", boldFont));
            if (abuturient.getPassportPin() != null) {
                paymentCell.addElement(new Paragraph("JSHSHIR:" + abuturient.getPassportPin(), regularFont));
            }
            paymentCell.addElement(new Paragraph("SHARTNOMA Nº K-" + abuturient.getContractNumber() + " shartnomaga asosan", regularFont));
            paymentCell.addElement(new Paragraph(fullName + "ning kontrakt puli ko'chirildi", regularFont));
            headerTable.addCell(paymentCell);

// ====== 4. QR CODE CELL ======
            PdfPCell qrCell = new PdfPCell();
            qrCell.setBorder(Rectangle.BOX);
            qrCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            qrCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            try {
                String rawPhone = abuturient.getPhone();
                String encodedPhone = URLEncoder.encode(rawPhone, StandardCharsets.UTF_8.toString());
                String qrContent = "https://qabul.bxu.uz/api/v1/abuturient/contract/" + encodedPhone;

                int qrSize = 100;
                BitMatrix bitMatrix = new MultiFormatWriter().encode(qrContent, BarcodeFormat.QR_CODE, qrSize, qrSize);
                ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
                MatrixToImageWriter.writeToStream(bitMatrix, "png", qrBaos);
                Image qrImage = Image.getInstance(qrBaos.toByteArray());
                qrImage.scaleToFit(50, 50);

                qrCell.addElement(qrImage);
            } catch (Exception qrEx) {
                qrCell.addElement(new Paragraph("QR code not available", regularFont));
            }
            headerTable.addCell(qrCell);

// Add table to document
            document.add(headerTable);


            Paragraph paragraph2 = new Paragraph("O'zbekiston Respublikasi Prezidentining 2021 yil 22-iyundagi PQ-5157 son qarori, Vazirlar Mahkamasining 2025 yil 13 sentabr 578-sonli Qarorida va universitet kengashining tegishli qarori asosida, bir tomondan BUXORO XALQARO UNIVERSITETI (keyingi o' rinlarda \"Ta'lim muassasasi\") nomidan rektor Baratov Sharif Ramazonovich , ikkinchi tomondan talabalikka tavsiya etilgan talabgor " + fullName + " (keyingi o'rinlarda \"Ta'lim oluvchi\"), birgalikda ”tomonlar” deb ataladigan shaxslar mazkur shartnomani quyidagicha tuzdilar.", regularFont);
            paragraph2.setSpacingBefore(2f);
            document.add(paragraph2);
            //                -----
            Paragraph paragraph3 = new Paragraph("I. SHARTNOMA PREDMETI", boldFont);
            paragraph3.setSpacingBefore(2f);
            paragraph3.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph3);
            //    -----------
            Paragraph paragraph4 = new Paragraph("        1.1 Ta'lim muassasasi ta'lim xizmatini ko'rsatishni, Ta'lim oluvchi o'qish uchun belgilangan to'lovni o'z vaqtida amalga oshirishni va tasdiqlangan o'quv reja bo'yicha darslarga to'liq qatnashishni o'z zimmalariga oladi. Ta'lim oluvchining ta'lim ma'lumotlari quyidagicha:", regularFont);
            paragraph4.setSpacingAfter(2f);
            document.add(paragraph4);

            //   -----------------
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setWidths(new int[]{3, 1});
            PdfPCell leftDetailCell = new PdfPCell();
            leftDetailCell.setBorder(Rectangle.BOX);
            leftDetailCell.addElement(new Paragraph("Ta'lim bosqichi: " + abuturient.getEducationField().getEducationForm().getEducationType().getName(), regularFont));
            String educationFormText = abuturient.getEducationField().getEducationForm().getDescription() != null && !abuturient.getEducationField().getEducationForm().getDescription().isEmpty()

                    ? abuturient.getEducationField().getEducationForm().getDescription()
                    : abuturient.getEducationField().getEducationForm().getName();

            leftDetailCell.addElement(new Paragraph("Ta'lim shakli: " + educationFormText, regularFont));
            leftDetailCell.addElement(new Paragraph("Ta'lim yo'nalishi: " + abuturient.getEducationField().getName(), regularFont));
            detailsTable.addCell(leftDetailCell);

            PdfPCell rightDetailCell = new PdfPCell();
            rightDetailCell.setBorder(Rectangle.BOX);

// Get the education duration (number of years)
            int educationDuration = abuturient.getEducationField().getEducationDuration();

// Base year for the first course
            int startYear = 2026;

// Loop through the duration and add each course year
            Integer level = abuturient.getLevel();
            if (level == null) {
                level = 1;

            }
            for (int i = level; i <= educationDuration; i++) {
                int endYear = startYear + 1; // End year is start year + 1
                String courseYear = i + "-kurs: " + startYear + "-" + endYear + " o'quv yili";
                rightDetailCell.addElement(new Paragraph(courseYear, regularFont));
                startYear = endYear; // Update the start year for the next course
            }

// Add the cell to the table
            detailsTable.addCell(rightDetailCell);

// Add the table to the document
            document.add(detailsTable);


            //   -----------------
            Paragraph paragraph6 = new Paragraph("        1.2 ”Ta'lim muassasasi\"ga o'qishga qabul qilingan ”Ta'lim oluvchi”lar O'zbekiston Respublikasining ”Ta'lim to'g'risida”gi Qonuni va davlat ta'lim standartlarga muvofiq ishlab chiqilgan o'quv rejalar va fan dasturlari asosida ta'lim oladilar.", regularFont);
            paragraph6.setSpacingAfter(2f);
            document.add(paragraph6);
            //   -----------------
            Paragraph paragraph5 = new Paragraph("II. TA'LIM XIZMATINI KO'RSATISH NARXI, TO'LASH MUDDATI VA TARTIBI", boldFont);
            paragraph5.setSpacingBefore(2f);
            paragraph5.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph5);
            //    -----------
            Paragraph paragraph7 = new Paragraph("        2.1 ”Ta'lim muassasasi”da o'qish davrida ta'lim xizmatini ko'rsatish narxi universitet haqiqiy xarajatlarining kalkulyatsiyasi asosida hisoblanadi.\n" +
                    "        2.2 Ushbu shartnoma bo'yicha ta'lim oluvchini bir o'quv yili davomida o'qitish uchun to'lov miqdori " + abuturient.getEducationField().getPrice().toString() + "  so'mni (stipendiyasiz) tashkil etadi va ushbu to'lov miqdorining 50 % har o'quv yilining 1-oktyabr kuniga qadar, qolgan qismi esa keyingi yilning 1-mayigacha to'lanishi shart. Bunda to'lov miqdorini hisoblash ta'lim oluvchini talabalikka qabul qilingan kundan boshlab hisoblanadi.\n" +
                    "        2.3 Talabalar orasidan joriy o'quv yili (sentyabrdan-iyul oyigacha) davrida o'qishini boshqa davlat va nodavlat oliy ta'lim muassasalariga ko'chirishi yoki o'z xoxishiga binoan talabalik safidan chetlashtirish maqsadida murojaat qilganda, shartnomada belgilangan bir yillik to'lov-kontrakt miqdori O'zbekiston Respublikasi Oliy va o'rta maxsus ta'lim vazirining 2012 yil 28 dekabr kunidagi 508- sonli buyrug'ida ko'rsatilgan tartibda talabadan saqlanib qolinadi.", regularFont);
            paragraph7.setSpacingAfter(2f);
            document.add(paragraph7);
            //   -----------------


            //   -----------------
            Paragraph paragraph8 = new Paragraph("III. TOMONLARNING MAJBURIYATLARI", boldFont);
            paragraph8.setSpacingBefore(2f);
            paragraph8.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph8);
            //    -----------
            Paragraph paragraph9 = new Paragraph("   3.1. Ta'lim muassasasi majburiyatlari:\n" +
                    "         -O'qitish uchun belgilangan dastlabki to'lov miqdorini (50% dan kam bo'lmagan) amalga oshirgandan so'ng, ”Ta'lim oluvchi”ni buyruq asosida talabalikka qabul qilish;\n" +
                    "         -Ta'lim oluvchi kontrakt to'lovini amalga oshirgandan so'ng ”Talabalikka qabul qilish” burug'i o'quv jarayonlari boshlangan kundan chiqariladi.\n" +
                    "         -Ta'lim oluvchiga o'qishi uchun O'zbekiston Respublikasining ”Ta'lim to'g'risida”gi Qonuni va ”Ta'lim muassasasi” Ustavida nazarda tutilgan zarur shart-sharoitlarga muvofiq sharoitlarni yaratib berish;\n" +
                    "         -Ta'lim oluvchining huquq va erkinliklari, qonuniy manfaatlari hamda ta'lim muassasasi Ustaviga muvofiq professor o'qituvchilar tomonidan o'zlarining funksional vazifalarini to'laqonli bajarishini ta'minlash;\n" +
                    "         -Ta'lim oluvchini tahsil olayotgan ta'lim yo'nalishi (mutaxassisligi) bo'yicha tasdiqlangan o'quv rejasi va dasturlariga muvofiq davlat ta'lim standarti talablari darajasida tayyorlash;\n" +
                    "         -Respublikada belgilangan Mehnatga haq to'lashning eng kam miqdori yoki sifatli ta'lim xizmatlari ko'rsatish bilan bog'liq tariflar o'zgargan taqdirda o'qitish uchun belgilangan to'lov miqdori universitet kengashi qarori asosida ta'lim oluvchini 1 oy oldin xabardor qilish.", regularFont);
            paragraph9.setSpacingAfter(2f);
            document.add(paragraph9);
            //    -----------
            Paragraph paragraph10 = new Paragraph("   3.2. Ta'lim oluvchining majburiyatlari:\n" +
                    "         -Shartnomaning 2.2. bandida belgilangan to'lov summasini shu bandda ko'rsatilgan muddatlarda to'lab borish;\n" +
                    "         -Respublikada belgilangan Mehnatga haq to'lashning eng kam miqdori yoki tariflar o'zgarishi natijasida o'qitish uchun belgilangan to'lov miqdori o'zgargan taqdirda, o'qishning qolgan muddati uchun ta'lim muassasasiga haq to'lash bo'yicha bir oy muddat ichida shartnomaga qo'shimcha bitim rasmiylashtirish va to'lov farqini to'lash;\n" +
                    "         -Ta'lim oluvchi o'qitish uchun belgilangan to'lov miqdorini to'laganlik to'g'risidagi bank tasdiqnomasi va shartnomaning bir nusxasini o'z vaqtida hujjatlarni rasmiylashtirish uchun ta'lim muassasasiga topshirish;\n" +
                    "         -Tahsil olayotgan ta'lim yo'nalishining (mutaxassisligining) tegishli malaka tavsifnomasiga muvofiq kelajakda mustaqil faoliyat yuritishga zarur bo'lgan barcha bilimlarni egallash, dars va mashg'ulotlarga to'liq qatnashish;", regularFont);
            paragraph10.setSpacingAfter(2f);
            document.add(paragraph10);


            //   -----------------
            Paragraph paragraph11 = new Paragraph("IV. TOMONLARNING HUQUQLARI", boldFont);
            paragraph11.setSpacingBefore(3f);
            paragraph11.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph11);
            //   -----------------
            Paragraph paragraph12 = new Paragraph("    4.1. Talim muassasasi huquqlari:\n" +
                    "         -O'quv jarayonini mustaqil ravishda amalga oshirish, ”Ta'lim oluvchi”ning oraliq va yakuniy nazoratlarni topshirish, qayta topshirish tartibi hamda vaqtlarini belgilash;\n" +
                    "         -O'zbekiston Respublikasi qonunlari, ”Ta'lim muassasasi” nizomi hamda mahalliy normativ-huquqiy hujjatlarga muvofiq ”Ta'lim oluvchi\"ga rag'batlantiruvchi yoki intizomiy choralarni qo'llash;\n" +
                    "         -Agar ”Ta'lim oluvchi” o'quv yili semestrlarida yakuniy nazoratlarni topshirish, qayta topshirish natijalariga ko'ra akademik qarzdor bo'lib qolgan taqdirda, mazkur talabani kredit-modul tizimi talablari asosida rasmiy ogohlantirish;\n" +
                    "         -Ta'lim muassasasi, ”Ta'lim oluvchi\"ning darslarga sababsiz qatnashmaslik, intizomni buzish, ”Ta'lim muassasasi\"ning ichki tartib qoidalariga amal qilmaganda, respublikaning normativ-huquqiy hujjatlarida nazarda tutilgan boshqa sabablarga ko'ra hamda o'qitish uchun belgilangan to'lov o'z vaqtida amalga oshirilmaganda ”Ta'lim oluvchi”ni talabalar safidan chetlashtirish huquqiga ega. Ta'lim oluvchi o'qishini boshqa oliy ta'lim muassasasiga ko'chirmoqchi bo'lganda faqatgina \"Davlat oliygohlariga\" belgilangan tartibda ya'ni O'zbekiston Respublikasi Vazirlar Mahkamasining 2025 yil 13 sentabr 578-sonli Qarorida ko'rsatilgan tartibda amalga oshiriladi", regularFont);
            paragraph12.setSpacingAfter(2f);
            document.add(paragraph12);
            //   -----------------
            Paragraph paragraph13 = new Paragraph("         -Talaba o'quv intizomiy va oliy ta'lim muassasasining ichki tartib-qoidalarini buzganligi, bir semester davomida darslarni uzrli sabablarsiz 74 (yetmish to'rt) soatdan ortiq qoldirganligi yoki o'qitish uchun belgilangan miqdordagi to'lovni o'z vaqtida amalga oshirmaganligi sababli talabalar safidan chetlashtirilganda yoxud belgilangan muddatlarda fanlarni o'zlashtira olmaganligi (akademik qarzdor bo'lganligi) sababli kursdan qoldirilganda oliy ta'lim muassasasi tomonidan uning tegishli o'quv semestri uchun amalga oshirilgan to'lovi qaytarib berilmaydi.\n" +
                    "         -Bunda, oshirilgan to'lov-kontrakt asosida talabalikka qabul qilinganlar birinchi kursning birinchi semestri davomida talabalar safidan chetlashtirilganda ular amalga oshirilgan to'lovning 50 % qaytarib berilmaydi.\n" +
                    "         -Belgilangan muddatlarda fanlarni o'zlashtira olmagan (akademik qarzdor bo'lgan) talaba kursdan qoldirilganda to'lov miqdori o'qishi davom etadigan o'quv semestri uchun amalga oshiriladi.\n" +
                    "    4.2. Ta'lim oluvchining huquqlari:\n" +
                    "         -O'quv yili uchun shartnoma summasini semestrlarga yoki choraklarga bo'lmasdan bir yo'la to'liqligicha to'lash;\n" +
                    "         -Ta'lim oluvchi mazkur kontrakt bo'yicha naqd pul, bank plastik kartasi, bankdagi omonat hisob raqami orqali, ish joyidan arizasiga asosan oylik maoshini o'tkazishi yoki banklardan ta'lim krediti olish orqali to'lovni amalga oshirish;", regularFont);
            paragraph13.setSpacingAfter(2f);
            document.add(paragraph13);


            //   -----------------
            Paragraph paragraph_5 = new Paragraph("V. SHARTNOMANING AMAL QILISH MUDDATI, UNGA O'ZGARTIRISH VA QO'SHIMCHALAR KIRITISH HAMDA BEKOR QILISH TARTIBI", boldFont);
            paragraph_5.setSpacingBefore(3f);
            paragraph_5.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph_5);

            Paragraph paragraph_5_b = new Paragraph(
                    "        5.1. Ushbu shartnoma ikki tomonlama imzolangandan so'ng kuchga kiradi hamda o'quv davri tugagunga qadar amalda bo'ladi.\n" +
                            "        5.2. Ushbu shartnoma shartlariga ikkala tomon kelishuviga asosan tuzatish, o'zgartirish va qo'shimchalar kiritilishi mumkin.\n" +
                            "        5.3. Shartnomaga tuzatish, o'zgartirish va qo'shimchalar faqat yozma ravishda ”Shartnomaga qo'shimcha bitim” tarzida kiritiladi va imzolanadi.\n" +
                            "        5.4. Shartnoma quyidagi hollarda bekor qilinishi mumkin:\n" +
                            "        -Tomonlarning o'zaro kelishuviga binoan;\n" +
                            "        -Ta'lim oluvchi” talabalar safidan chetlashtirganda; O'zbekiston Respublikasi Vazirlar Mahkamasining 2025 yil 13 sentabr 578-sonli Qarorining tegishli bandlari bo'yicha.\n" +
                            "        -Tomonlardan biri o'z majburiyatlarini bajarmaganda yoki lozim darajada bajarmaganda;\n" +
                            "        -Ta'lim oluvchi” tomonidan taqdim etilgan xujjatlarda qalbakilik xolatlari aniqlanganda;\n" +
                            "        -Talabgor (talaba) o'qishini boshqa oliy ta'lim muassasasidan (respublika va xorijiy OTM) o'qishini ko'chirishda mazkur universitet qabul komissiyasiga taqdim qilgan xujjatlarda qalbakilik yoki noqonuniy xolatlar aniqlanganda ushbu shartnoma bekor qilinadi va talabaga xabar beriladi”\n" +
                            "        -Ta'lim oluvchi”ning tashabbusiga ko'ra;\n" +
                            "        -Ta'lim muassasi” tugatilganda, muassasa tomonidan ko'rsatilmagan ta'lim xizmati uchungina ta'lim oluvchi bilan amaldagi qonunchilik asosida hisob-kitob qilinadi.", regularFont);
            paragraph_5_b.setSpacingAfter(2f);
            document.add(paragraph_5_b);

            //   -----------------
            Paragraph paragraph_6 = new Paragraph("VI. YAKUNIY QOIDALAR VA NIZOLARNI HAL QILISH TARTIBI", boldFont);
            paragraph_6.setSpacingBefore(3f);
            paragraph_6.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph_6);
            Paragraph paragraph_6_b = new Paragraph(" 6.1. Ushbu shartnomani bajarish jarayonida kelib chiqishi mumkin bo'lgan nizo va ziddiyatlar tomonlar o'rtasida muzokaralar olib borish yo'li bilan hal etiladi.\n" +
                    "        6.2. Muzokaralar olib borish yo'li bilan nizoni hal etish imkoniyati bo'lmagan taqdirda, tomonlar nizolarni hal etish uchun amaldagi qonunchilikka muvofiq sudga murojaat etishlari mumkin.\n" +
                    "        6.3. Ta'lim muassasasi” axborotlar va xabarnomalarni internetdagi veb-saytida, axborot tizimida yoki e'lonlar taxtasida e'lon joylashtirish orqali xabar berishi mumkin.\n" +
                    "        6.4. Shartnoma 2 (ikki) nusxada, tomonlarning har biri uchun bir nusxadan tuziladi va ikkala nusxa ham bir xil huquqiy kuchga ega.\n" +
                    "        6.5. . Ushbu shartnomaga qo'shimcha bitim kiritilgan taqdirda, barcha kiritilgan qo'shimcha bitimlar shartnomaning ajralmas qismi hisoblanadi.\n" +
                    "        6.6. Qabul komissiyasiga taqdim etilgan hujjatlarning haqqoniyligi o'rnatilgan tartibda tasdiqlangandan so'ng talabgor tegishli buyruq asosida talabalar safiga qabul qilinadi.", regularFont);
            paragraph_6_b.setSpacingAfter(2f);
            document.add(paragraph_6_b);


            //   -----------------
            Paragraph paragraph_7 = new Paragraph("VII. TOMONLARNING REKVIZITLARI VA IMZOLARI", boldFont);
            paragraph_7.setSpacingBefore(3f);
            paragraph_7.setSpacingAfter(3f);
            paragraph_7.setAlignment(Element.ALIGN_CENTER);
            document.add(paragraph_7);

//   -----------------
// Jadval yaratish (2 ta ustun)
            PdfPTable endTable = new PdfPTable(2);
            endTable.setWidthPercentage(100);
            endTable.setWidths(new int[]{3, 1}); // Ustun kengliklari

// CHAP USTUN
            PdfPCell leftCell1 = new PdfPCell();
            leftCell1.setBorder(Rectangle.BOX);

// Institut haqida ma'lumot qo‘shish
            leftCell1.addElement(new Paragraph("BUXORO XALQARO UNIVERSITETI", boldFont));
            leftCell1.addElement(new Paragraph("Manzil: Buxoro viloyati, Kogon tumani, B.Naqshband M.F.Y Abay ko'chasi 20 uy", regularFont));
            leftCell1.addElement(new Paragraph("Telefon raqami: 55-309-99-99, 99-773-17-37, 94-322-5775", regularFont));
            leftCell1.addElement(new Paragraph("STIR: 308196898", regularFont));
            leftCell1.addElement(new Paragraph("MFO: 00873", regularFont));
            leftCell1.addElement(new Paragraph("Bank nomi: 'Asaka bank' AJ Buxoro BXM", regularFont));

            String text = "Hisob raqami: 20208000105439719001";
            leftCell1.addElement(new Paragraph(text, regularFont));



// Rektor matnini qo‘shish
            PdfPTable rectorTable = new PdfPTable(2); // 2 ta ustunli ichki jadval (matn + logo)
            rectorTable.setWidths(new float[]{1, 1}); // Ustun kengligi 50% - 50%

            PdfPCell rectorTextCell = new PdfPCell(new Paragraph("Rektor: Sh.R.Barotov", regularFont));
            rectorTextCell.setBorder(Rectangle.NO_BORDER);
            rectorTextCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            rectorTable.addCell(rectorTextCell);

// Logo rasmni joylashtirish
            PdfPCell logoCell1 = new PdfPCell(); // Yangi nom
            logoCell1.setBorder(Rectangle.NO_BORDER);
            logoCell1.setHorizontalAlignment(Element.ALIGN_LEFT);
            logoCell1.setVerticalAlignment(Element.ALIGN_MIDDLE);

            try {
//                    Image logo1 = Image.getInstance(System.getProperty("user.home") + "/Downloads/logo1.png");
                Image logo1 = Image.getInstance("./logo1.png");
                logo1.scaleToFit(100, 100); // Logoni o‘lchamini moslashtirish
                logoCell1.addElement(logo1); // TO‘G‘RI ISHLATISH
            } catch (Exception e) {
                logoCell1.addElement(new Paragraph("Logo not found", regularFont));
            }

            rectorTable.addCell(logoCell1);

// Ichki jadvalni asosiy jadvalga qo‘shish
            leftCell1.addElement(rectorTable);
            endTable.addCell(leftCell1);

// O‘NG USTUN (Talaba ma‘lumotlari)
            PdfPCell rightCell1 = new PdfPCell();
            rightCell1.setBorder(Rectangle.BOX);
            rightCell1.addElement(new Paragraph("FISH: " + fullName, boldFont));
            rightCell1.addElement(new Paragraph("Men shartnoma bilan to'liq tanishdim", regularFont));
            rightCell1.addElement(new Paragraph("F.I.O: _____", regularFont));
            rightCell1.addElement(new Paragraph("Ta'lim oluvchining imzosi: (_____)", regularFont));
            endTable.addCell(rightCell1);

// Jadvalni hujjatga qo‘shish
            document.add(endTable);


            // Close document
            document.close();

            // Save the document to the file system
            try (FileOutputStream fileOutputStream = new FileOutputStream(filePath)) {
                outputStream.writeTo(fileOutputStream);
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }

        // Send the file as a response
        File file = new File(filePath);
        abuturient.setStatus(4);
        abuturientRepo.save(abuturient);
        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=" + file.getName());

        try {
            response.getOutputStream().write(java.nio.file.Files.readAllBytes(file.toPath()));
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }




}
