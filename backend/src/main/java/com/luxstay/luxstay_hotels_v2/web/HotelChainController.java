package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.HotelChain;
import com.luxstay.luxstay_hotels_v2.domain.service.HotelChainService;
import com.luxstay.luxstay_hotels_v2.web.dto.HotelChainDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/chains")
public class HotelChainController {

    private final HotelChainService service;

    public HotelChainController(HotelChainService service) {
        this.service = service;
    }

    @GetMapping
    public List<HotelChainDtos.Response> list() {
        return service.list().stream()
                .map(c -> new HotelChainDtos.Response(c.getId(), c.getName(), c.getHotels() == null ? 0 : c.getHotels().size()))
                .toList();
    }

    @GetMapping("/{id}")
    public HotelChainDtos.Response get(@PathVariable Long id) {
        HotelChain c = service.get(id);
        return new HotelChainDtos.Response(c.getId(), c.getName(), c.getHotels() == null ? 0 : c.getHotels().size());
    }

    @PostMapping
    public HotelChainDtos.Response create(@Valid @RequestBody HotelChainDtos.CreateRequest req) {
        HotelChain c = service.create(req.name());
        return new HotelChainDtos.Response(c.getId(), c.getName(), 0);
    }

    @PutMapping("/{id}")
    public HotelChainDtos.Response update(@PathVariable Long id, @Valid @RequestBody HotelChainDtos.UpdateRequest req) {
        HotelChain c = service.update(id, req.name());
        return new HotelChainDtos.Response(c.getId(), c.getName(), c.getHotels() == null ? 0 : c.getHotels().size());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/seed")
    public List<HotelChainDtos.Response> seed() {
        return service.seedDefaultChains().stream()
                .map(c -> new HotelChainDtos.Response(
                        c.getId(),
                        c.getName(),
                        c.getHotels() == null ? 0 : c.getHotels().size()
                ))
                .toList();
    }

    @PostMapping("/reset-and-seed")
    public List<HotelChainDtos.Response> resetAndSeed() {
        return service.resetAndSeedDefaultChains().stream()
                .map(c -> new HotelChainDtos.Response(
                        c.getId(),
                        c.getName(),
                        c.getHotels() == null ? 0 : c.getHotels().size()
                ))
                .toList();
    }


}
