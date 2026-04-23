package com.luxstay.luxstay_hotels_v2.web.dto;

import com.luxstay.luxstay_hotels_v2.domain.enums.IdType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CustomerDtos {

    public record CreateRequest(
            @NotBlank String fullName,
            @NotBlank String address,
            @NotNull LocalDate dateOfBirth,
            @NotBlank String idNumber,
            @NotNull IdType idType,
            @NotBlank @Email String email
    ) {}

    public record UpdateRequest(
            @NotBlank String fullName,
            @NotBlank String address,
            @NotBlank @Email String email
    ) {}

    public record Response(
            Long id,
            String fullName,
            String address,
            LocalDate dateOfBirth,
            String idNumber,
            IdType idType,
            String email,
            LocalDate registrationDate
    ) {}
}
