package com.example.backend.DTO;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class DiscountStudentDTO {
    private String name;
    @Column(unique = true)
    private String passport_pin;
    private String hemis_login;
    private String group;
    private String asos;
    private String description;
    private List<DiscountByYearDTO> discountByYear;
}

