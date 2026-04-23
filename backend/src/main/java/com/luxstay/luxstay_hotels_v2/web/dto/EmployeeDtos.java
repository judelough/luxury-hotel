package com.luxstay.luxstay_hotels_v2.web.dto;

import jakarta.validation.constraints.NotBlank;

public class EmployeeDtos {

    public record CreateRequest(
            @NotBlank String fullName,
            @NotBlank String address,
            @NotBlank String position,
            @NotBlank String sinNumber
    ) {}

    public record UpdateRequest(
            @NotBlank String fullName,
            @NotBlank String address,
            @NotBlank String position
    ) {}

    public record Response(
            Long id,
            String fullName,
            String address,
            String position
    ) {}
}
