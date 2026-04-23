package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findByChainId(Long chainId);
    List<Hotel> findByCityIgnoreCase(String city);
}
