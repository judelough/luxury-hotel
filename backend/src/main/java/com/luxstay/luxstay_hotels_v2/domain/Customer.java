package com.luxstay.luxstay_hotels_v2.domain;

import com.luxstay.luxstay_hotels_v2.domain.enums.IdType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "customer",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_customer_idnumber_email", columnNames = {"id_number", "email"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "id_number", nullable = false, length = 255)
    private String idNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_type", nullable = false, length = 255)
    private IdType idType;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (registrationDate == null) registrationDate = LocalDate.now();
        normalize();
    }

    @PreUpdate
    void preUpdate() {
        normalize();
    }

    private void normalize() {
        if (fullName != null) fullName = fullName.trim();
        if (address != null) address = address.trim();
        if (idNumber != null) idNumber = idNumber.trim();
        if (email != null) email = email.trim().toLowerCase(); // IMPORTANT for consistent uniqueness
    }
}
