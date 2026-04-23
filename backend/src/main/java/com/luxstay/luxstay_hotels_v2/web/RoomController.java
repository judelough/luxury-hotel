package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.Room;
import com.luxstay.luxstay_hotels_v2.domain.service.RoomService;
import com.luxstay.luxstay_hotels_v2.web.dto.RoomDtos;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v2/rooms")
public class RoomController {

    private final RoomService service;

    public RoomController(RoomService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoomDtos.Response> list(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String chainName
    ) {
        return service.list(hotelId, city, chainName).stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public RoomDtos.Response get(@PathVariable Long id) {
        return toResponse(service.get(id));
    }

    @PostMapping
    public RoomDtos.Response create(@Valid @RequestBody RoomDtos.CreateRequest req) {
        Room payload = Room.builder()
                .roomNumber(req.roomNumber())
                .price(req.price())
                .capacity(req.capacity())
                .extendable(req.extendable())
                .amenities(req.amenities())
                .problemsAndDamages(req.problemsAndDamages())
                // ✅ no imageUrl here — backend assigns it in RoomService.create(...)
                .build();

        return toResponse(service.create(req.hotelId(), payload));
    }

    @PutMapping("/{id}")
    public RoomDtos.Response update(@PathVariable Long id, @Valid @RequestBody RoomDtos.UpdateRequest req) {
        Room payload = Room.builder()
                .roomNumber(req.roomNumber())
                .price(req.price())
                .capacity(req.capacity())
                .extendable(req.extendable())
                .amenities(req.amenities())
                .problemsAndDamages(req.problemsAndDamages())
                .imageUrl(req.imageUrl()) // ✅ still allowed on update
                .build();

        return toResponse(service.update(id, payload));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/available")
    public List<RoomDtos.Response> available(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String chainName,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return service.available(startDate, endDate, hotelId, city, chainName, capacity, maxPrice)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RoomDtos.Response toResponse(Room r) {
        Long hotelId = (r.getHotel() == null) ? null : r.getHotel().getId();
        String hotelName = (r.getHotel() == null) ? null : r.getHotel().getName();
        String city = (r.getHotel() == null) ? null : r.getHotel().getCity();
        Long chainId = (r.getHotel() == null || r.getHotel().getChain() == null) ? null : r.getHotel().getChain().getId();
        String chainName = (r.getHotel() == null || r.getHotel().getChain() == null) ? null : r.getHotel().getChain().getName();

        return new RoomDtos.Response(
                r.getId(),
                hotelId,
                hotelName,
                city,
                chainId,
                chainName,
                r.getRoomNumber(),
                r.getPrice(),
                r.getCapacity(),
                r.getExtendable(),
                r.getAmenities(),
                r.getProblemsAndDamages(),
                r.getImageUrl()
        );
    }
}
