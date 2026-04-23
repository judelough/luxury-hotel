package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.Hotel;
import com.luxstay.luxstay_hotels_v2.domain.service.HotelService;
import com.luxstay.luxstay_hotels_v2.web.dto.HotelDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/hotels")
public class HotelController {

    private final HotelService service;

    public HotelController(HotelService service) {
        this.service = service;
    }

    @GetMapping
    public List<HotelDtos.Response> list(
            @RequestParam(required = false) Long chainId,
            @RequestParam(required = false) String city
    ) {
        return service.list(chainId, city).stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public HotelDtos.Response get(@PathVariable Long id) {
        return toDto(service.get(id));
    }

    @PostMapping
    public HotelDtos.Response create(@Valid @RequestBody HotelDtos.CreateRequest req) {
        Hotel payload = Hotel.builder()
                .name(req.name())
                .address(req.address())
                .city(req.city())
                .email(req.email())
                .rating(req.rating())
                // ✅ NO imageUrl here — backend assigns it
                .build();

        return toDto(service.create(req.chainId(), payload));
    }

    @PutMapping("/{id}")
    public HotelDtos.Response update(@PathVariable Long id, @Valid @RequestBody HotelDtos.UpdateRequest req) {
        Hotel payload = Hotel.builder()
                .name(req.name())
                .address(req.address())
                .city(req.city())
                .email(req.email())
                .rating(req.rating())
                .imageUrl(req.imageUrl()) // ✅ still allowed on update
                .build();

        return toDto(service.update(id, payload));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private HotelDtos.Response toDto(Hotel h) {
        return new HotelDtos.Response(
                h.getId(),
                h.getChain().getId(),
                h.getChain().getName(),
                h.getName(),
                h.getAddress(),
                h.getCity(),
                h.getEmail(),
                h.getRating(),
                h.getImageUrl()
        );
    }
}
