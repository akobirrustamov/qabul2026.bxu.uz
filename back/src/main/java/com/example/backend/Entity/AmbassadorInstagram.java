package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "ambassador_instagram")
public class AmbassadorInstagram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Specifies auto-increment behavior
    private Integer id;
    private Integer posts;
    private Integer followers;
    private Integer following;
    private LocalDateTime createdAt;
    private Boolean active;
    private Integer status;
    private String description;
    @ManyToOne
    @JoinColumn(name = "ambassador_id", unique = true, nullable = false)
    private User ambassador;
    @Column(unique = true, nullable = false)
    private String url;

    public AmbassadorInstagram(LocalDateTime createdAt, Boolean active, Integer status, String description, User ambassador, String url) {
        this.createdAt = createdAt;
        this.active = active;
        this.status = status;
        this.description = description;
        this.ambassador = ambassador;
        this.url = url;
    }
}
