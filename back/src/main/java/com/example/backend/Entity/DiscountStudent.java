package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Builder
@Table(name = "discount_student")
public class DiscountStudent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String passport_pin;
    private String hemis_login;
    private String groupName;
    @ManyToMany
    private List<DiscountByYear> discountByYear;
    private LocalDateTime createdAt;
    private Integer status;
    private String asos;
    private String description;

    @ManyToOne
    private Attachment file;

}
