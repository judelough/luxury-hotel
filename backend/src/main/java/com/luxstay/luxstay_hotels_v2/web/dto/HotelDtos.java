package com.luxstay.luxstay_hotels_v2.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class HotelDtos {

    public record Response(
            Long id,
            Long chainId,
            String chainName,
            String name,
            String address,
            String city,
            String email,
            Integer rating,
            String imageUrl
    ) {}

    // ✅ No imageUrl here anymore (backend assigns on create)
    public record CreateRequest(
            @NotNull Long chainId,
            @NotBlank String name,
            @NotBlank String address,
            @NotBlank String city,
            String email,
            Integer rating
    ) {}

    // ✅ Keep imageUrl on update (optional)
    public record UpdateRequest(
            @NotBlank String name,
            @NotBlank String address,
            @NotBlank String city,
            String email,
            Integer rating,
            String imageUrl
    ) {}
}
