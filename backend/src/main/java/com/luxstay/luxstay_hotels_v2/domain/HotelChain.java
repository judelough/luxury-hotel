package com.luxstay.luxstay_hotels_v2.domain;


import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(
        name = "hotel_chain",
        uniqueConstraints = @UniqueConstraint(columnNames = "name")
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotelChain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "chain", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Hotel> hotels;
}

