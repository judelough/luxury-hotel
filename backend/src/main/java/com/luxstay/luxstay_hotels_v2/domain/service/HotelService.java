package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.Hotel;
import com.luxstay.luxstay_hotels_v2.domain.HotelChain;
import com.luxstay.luxstay_hotels_v2.domain.repo.HotelChainRepository;
import com.luxstay.luxstay_hotels_v2.domain.repo.HotelRepository;
import com.luxstay.luxstay_hotels_v2.web.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HotelService {

    private final HotelRepository hotelRepo;
    private final HotelChainRepository chainRepo;
    private final HotelImageUrlSelector imageUrlSelector;

    public HotelService(HotelRepository hotelRepo,
                        HotelChainRepository chainRepo,
                        HotelImageUrlSelector imageUrlSelector) {
        this.hotelRepo = hotelRepo;
        this.chainRepo = chainRepo;
        this.imageUrlSelector = imageUrlSelector;
    }

    public List<Hotel> list(Long chainId, String city) {
        if (chainId != null) return hotelRepo.findByChainId(chainId);
        if (city != null && !city.isBlank()) return hotelRepo.findByCityIgnoreCase(city);
        return hotelRepo.findAll();
    }

    public Hotel get(Long id) {
        return hotelRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found: " + id));
    }

    public Hotel create(Long chainId, Hotel payload) {
        HotelChain chain = chainRepo.findById(chainId)
                .orElseThrow(() -> new ResourceNotFoundException("HotelChain not found: " + chainId));

        payload.setId(null);
        payload.setChain(chain);

        // ✅ Auto-assign an image if missing
        if (payload.getImageUrl() == null || payload.getImageUrl().isBlank()) {
            payload.setImageUrl(imageUrlSelector.nextUrl());
        }

        return hotelRepo.save(payload);
    }

    public Hotel update(Long id, Hotel payload) {
        Hotel hotel = hotelRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found: " + id));

        hotel.setName(payload.getName());
        hotel.setAddress(payload.getAddress());
        hotel.setCity(payload.getCity());
        hotel.setEmail(payload.getEmail());
        hotel.setRating(payload.getRating());
        hotel.setImageUrl(payload.getImageUrl());

        return hotelRepo.save(hotel);
    }

    public void delete(Long id) {
        if (!hotelRepo.existsById(id)) throw new ResourceNotFoundException("Hotel not found: " + id);
        hotelRepo.deleteById(id);
    }
}
