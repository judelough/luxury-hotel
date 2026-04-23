package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.HotelChain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HotelChainRepository extends JpaRepository<HotelChain, Long> {
    Optional<HotelChain> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
