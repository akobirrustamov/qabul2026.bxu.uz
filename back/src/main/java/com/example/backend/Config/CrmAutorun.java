package com.example.backend.Config;

import com.example.backend.Entity.*;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.CrmCategoryRepo;
import com.example.backend.Repository.CrmSubCategoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class CrmAutorun implements CommandLineRunner {
    private final CrmCategoryRepo crmCategoryRepo;
    private final CrmSubCategoryRepo crmSubCategoryRepo;

    @Override
    public void run(String... args) {

        if (crmCategoryRepo.count() == 0) {
            saveCrmCategory("Dastlabki aloqa");
        }
    }

    private void saveCrmCategory(String name) {

        CrmCategory category = CrmCategory.builder()
                .name(name)
                .sortOrder(1)
                .description("Dastlabki aloqa jarayoni")
                .status(true)
                .build();

        crmCategoryRepo.save(category);

        List<CrmSubCategory> subCategories = List.of(
                CrmSubCategory.builder()
                        .name("Nomer kiritdi")
                        .description("Foydalanuvchi telefon raqamini kiritdi")
                        .crmCategory(category)
                        .sortOrder(1)
                        .status(true)
                        .build(),





                CrmSubCategory.builder()
                        .name("Shaxsiy ma'lumotlarni kiritgan")
                        .description("Foydalanuvchi shaxsiy ma'lumotlarni kiritgan")
                        .crmCategory(category)
                        .sortOrder(2)
                        .status(true)
                        .build(),

                CrmSubCategory.builder()
                        .name("Yo'nalish tanlagan")
                        .description("Foydalanuvchi yo'nalish tanlagan")
                        .crmCategory(category)
                        .sortOrder(3)
                        .status(true)
                        .build(),

                CrmSubCategory.builder()
                        .name("Test topshirgan")
                        .description("Foydalanuvchining test topshirgan")
                        .crmCategory(category)
                        .sortOrder(4)
                        .status(true)
                        .build(),
                CrmSubCategory.builder()
                        .name("Shartnoma olgan")
                        .description("Foydalanuvchining shartnoma olgan")
                        .crmCategory(category)
                        .sortOrder(5)
                        .status(true)
                        .build()
        );

        crmSubCategoryRepo.saveAll(subCategories);
    }
}
