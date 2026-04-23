package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.Lock;


import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

import java.math.BigDecimal;
import java.util.Collection;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {


    List<Room> findByHotelId(Long hotelId);
    List<Room> findByHotelCityIgnoreCase(String city);
    List<Room> findByHotelChainNameIgnoreCase(String chainName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    @Query("""
    select r
    from Room r
    where (:hotelId is null or r.hotel.id = :hotelId)
      and (:city is null or r.hotel.city ILIKE :city)
      and (:chainName is null or r.hotel.chain.name ILIKE :chainName)
      and (:capacity is null or r.capacity >= :capacity)
      and (:maxPrice is null or r.price <= :maxPrice)
      and (:excludedRoomIds is null or r.id not in :excludedRoomIds)
""")
    List<Room> searchAvailableRooms(
            @Param("hotelId") Long hotelId,
            @Param("city") String city,
            @Param("chainName") String chainName,
            @Param("capacity") Integer capacity,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("excludedRoomIds") Collection<Long> excludedRoomIds
    );

}
