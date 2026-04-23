package com.luxstay.luxstay_hotels_v2.web.dto;

import jakarta.validation.constraints.NotBlank;

public class HotelChainDtos {
    public record CreateRequest(@NotBlank String name) {}
    public record UpdateRequest(@NotBlank String name) {}
    public record Response(Long id, String name, Integer hotelsCount) {}
}
