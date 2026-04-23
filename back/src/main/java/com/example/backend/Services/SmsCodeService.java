package com.example.backend.Services;

import com.example.backend.DTO.SmsBatchRequestDTO;
import com.example.backend.Entity.SmsTemplates;
import com.example.backend.Repository.SmsTemplatesRepo;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SmsCodeService {
//    private final SmsTemplatesRepo smsTemplatesRepo;
//    public Boolean sendBatchSms(SmsBatchRequestDTO dto) {
//        try {
//            RestTemplate restTemplate = new RestTemplate();
//
//            // 🔐 1. TOKEN
//            String token = getEskizToken(restTemplate);
//
//            // 📩 2. TEMPLATE DB dan
//            SmsTemplates smsTemplate = smsTemplatesRepo.findById(dto.getTemplateId())
//                    .orElseThrow(() -> new RuntimeException("Template topilmadi"));
//
//            String template = smsTemplate.getTemplate();
//
//            // 🔧 3. PARAM qo‘yish
//            String finalMessage = String.format(template, dto.getParams().toArray());
//
//            // 📦 4. MESSAGE LIST
//            List<Map<String, Object>> messages = new ArrayList<>();
//
//            int i = 1;
//            for (String phone : dto.getPhones()) {
//                Map<String, Object> msg = new HashMap<>();
//                msg.put("user_sms_id", "sms_" + i++);
//                msg.put("to", Long.parseLong(phone));
//                msg.put("text", finalMessage);
//
//                messages.add(msg);
//            }
//
//            // 🚀 5. REQUEST
//            Map<String, Object> requestBody = new HashMap<>();
//            requestBody.put("messages", messages);
//            requestBody.put("from", "4546");
//
//            HttpEntity<Map<String, Object>> entity =
//                    new HttpEntity<>(requestBody, createHeaders(token));
//
//            String url = "https://notify.eskiz.uz/api/message/sms/send-batch";
//
//            Map response = restTemplate.postForObject(url, entity, Map.class);
//
//            System.out.println(response);
//
//            return true;
//
//        } catch (Exception e) {
//            System.out.println("Error: " + e.getMessage());
//            return false;
//        }
//    }

    public Boolean sendSmsCode(String phoneNumber, Integer code){
        try {
            RestTemplate restTemplate = new RestTemplate();
            String email = "akobirjavadev10@gmail.com";
            String password = "qCfkQTHQbQAJLJeElWWI9bv1stjoh3Unt6dNiE04";
            String loginUrl = "https://notify.eskiz.uz/api/auth/login";

            // 1. Auth - token olish
            Map<String, String> loginPayload = new HashMap<>();
            loginPayload.put("email", email);
            loginPayload.put("password", password);

            Map loginResponse = restTemplate.postForObject(loginUrl, loginPayload, Map.class);
            String token = (String) ((Map) loginResponse.get("data")).get("token");

            // 2. Template olish
            // 2. Template olish
            String templateUrl = "https://notify.eskiz.uz/api/user/templates";
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(token));




            Map templatesResponse = restTemplate
                    .exchange(templateUrl, HttpMethod.GET, entity, Map.class)
                    .getBody();

            List<Map<String, Object>> templates =
                    (List<Map<String, Object>>) templatesResponse.get("result");

            Map<String, Object> otpTemplate = templates.stream()
                    .filter(t -> Integer.valueOf(47174).equals(t.get("id")))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("OTP template not found"));

            String template = (String) otpTemplate.get("template");


//            String template = (String) ((Map) ((java.util.List) templatesResponse.get("result")).get(5)).get("template");
            String finalMessage = String.format(template, code); // %d joyga kod qo‘yiladi
            System.out.printf("SMS Code: %s\n", finalMessage);
            // 4. SMS yuborish
            String smsUrl = "https://notify.eskiz.uz/api/message/sms/send";
            Map<String, String> smsPayload = new HashMap<>();
            smsPayload.put("mobile_phone", phoneNumber);
            smsPayload.put("message", finalMessage);
            smsPayload.put("from", "4546");

            HttpEntity<Map<String, String>> smsEntity = new HttpEntity<>(smsPayload, createHeaders(token));
            restTemplate.postForObject(smsUrl, smsEntity, Map.class);
            System.out.printf("SMS Code: %s\n", smsEntity);
            return true;
        } catch (Exception e) {
            System.out.printf("Error: %s%n", e.getMessage());
            return false;
        }
    }


    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

//    private String getEskizToken(RestTemplate restTemplate) {
//        String email = "akobirjavadev10@gmail.com";
//        String password = "********";
//
//        String loginUrl = "https://notify.eskiz.uz/api/auth/login";
//
//        Map<String, String> payload = new HashMap<>();
//        payload.put("email", email);
//        payload.put("password", password);
//
//        Map response = restTemplate.postForObject(loginUrl, payload, Map.class);
//
//        return (String) ((Map) response.get("data")).get("token");
//    }
}
