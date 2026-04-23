package com.luxstay.luxstay_hotels_v2.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "reservation",
        indexes = {
                @Index(name = "idx_reservation_customer", columnList = "customer_id"),
                @Index(name = "idx_reservation_room_dates", columnList = "room_id,start_date,end_date")
        }
)
@Check(constraints = "status IN ('ACTIVE','CANCELLED','COMPLETED')")
@Check(constraints = "payment_status IN ('UNPAID','PAID')")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"customer", "room"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * IMPORTANT:
     * We treat reservations as [startDate, endDate) (end exclusive).
     * endDate must be AFTER startDate (validated in service).
     */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Allowed values: ACTIVE, CANCELLED, COMPLETED
     */
    @Column(nullable = false, length = 255)
    private String status;

    /**
     * Allowed values: UNPAID, PAID
     */
    @Column(name = "payment_status", nullable = false, length = 255)
    private String paymentStatus;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "checked_out_at")
    private LocalDateTime checkedOutAt;

    @Column(length = 1000)
    private String notes;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;

        if (status == null || status.isBlank()) status = "ACTIVE";
        if (paymentStatus == null || paymentStatus.isBlank()) paymentStatus = "UNPAID";

        // Normalize to uppercase to match checks/logic
        status = status.trim().toUpperCase();
        paymentStatus = paymentStatus.trim().toUpperCase();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();

        if (status != null) status = status.trim().toUpperCase();
        if (paymentStatus != null) paymentStatus = paymentStatus.trim().toUpperCase();
    }
}
