package com.luxstay.luxstay_hotels_v2.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "room",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_room_hotel_room_number",
                columnNames = {"hotel_id", "room_number"}
        )
)

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @Column(name = "room_number", nullable = false)
    private Integer roomNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Boolean extendable;

    @Column(length = 512)
    private String amenities;

    @Column(length = 512)
    private String problemsAndDamages;

    @Column(length = 512)
    private String imageUrl;

}
