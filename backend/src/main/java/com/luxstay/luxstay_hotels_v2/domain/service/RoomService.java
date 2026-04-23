package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.Hotel;
import com.luxstay.luxstay_hotels_v2.domain.Room;
import com.luxstay.luxstay_hotels_v2.domain.repo.HotelRepository;
import com.luxstay.luxstay_hotels_v2.domain.repo.ReservationRepository;
import com.luxstay.luxstay_hotels_v2.domain.repo.RoomRepository;
import com.luxstay.luxstay_hotels_v2.web.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepo;
    private final HotelRepository hotelRepo;
    private final ReservationRepository reservationRepo;
    private final RoomImageUrlSelector roomImageUrlSelector;

    public RoomService(RoomRepository roomRepo,
                       HotelRepository hotelRepo,
                       ReservationRepository reservationRepo,
                       RoomImageUrlSelector roomImageUrlSelector) {
        this.roomRepo = roomRepo;
        this.hotelRepo = hotelRepo;
        this.reservationRepo = reservationRepo;
        this.roomImageUrlSelector = roomImageUrlSelector;
    }

    public List<Room> list(Long hotelId, String city, String chainName) {
        if (hotelId != null) return roomRepo.findByHotelId(hotelId);
        if (city != null && !city.isBlank()) return roomRepo.findByHotelCityIgnoreCase(city);
        if (chainName != null && !chainName.isBlank()) return roomRepo.findByHotelChainNameIgnoreCase(chainName);
        return roomRepo.findAll();
    }

    public Room get(Long id) {
        return roomRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Room not found: " + id));
    }

    public Room create(Long hotelId, Room payload) {
        Hotel hotel = hotelRepo.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found: " + hotelId));

        payload.setId(null);
        payload.setHotel(hotel);

        // ✅ auto-assign image if missing
        if (payload.getImageUrl() == null || payload.getImageUrl().isBlank()) {
            payload.setImageUrl(roomImageUrlSelector.nextUrl());
        }

        return roomRepo.save(payload);
    }

    public Room update(Long id, Room payload) {
        Room existing = get(id);
        existing.setRoomNumber(payload.getRoomNumber());
        existing.setPrice(payload.getPrice());
        existing.setCapacity(payload.getCapacity());
        existing.setExtendable(payload.getExtendable());
        existing.setAmenities(payload.getAmenities());
        existing.setProblemsAndDamages(payload.getProblemsAndDamages());
        existing.setImageUrl(payload.getImageUrl());
        return roomRepo.save(existing);
    }

    public void delete(Long id) {
        if (!roomRepo.existsById(id)) throw new ResourceNotFoundException("Room not found: " + id);
        roomRepo.deleteById(id);
    }

    public List<Room> available(LocalDate startDate,
                                LocalDate endDate,
                                Long hotelId,
                                String city,
                                String chainName,
                                Integer capacity,
                                BigDecimal maxPrice) {

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate");
        }

        List<Long> bookedIds = reservationRepo.findBookedRoomIdsInRange(startDate, endDate);

        return roomRepo.searchAvailableRooms(
                hotelId,
                city,
                chainName,
                capacity,
                maxPrice,
                bookedIds.isEmpty() ? null : bookedIds
        );
    }
}
