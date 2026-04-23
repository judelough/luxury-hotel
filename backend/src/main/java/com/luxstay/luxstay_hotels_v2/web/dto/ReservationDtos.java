package com.luxstay.luxstay_hotels_v2.web.dto;

import com.luxstay.luxstay_hotels_v2.domain.enums.IdType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReservationDtos {

    // ---------- Requests ----------

    public record CustomerRef(
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Size(max = 255) String address,
            @NotNull LocalDate dateOfBirth,
            @NotBlank @Size(max = 255) String idNumber,
            @NotNull IdType idType,
            @NotBlank @Email @Size(max = 255) String email
    ) {}

    public record CreateRequest(
            @NotNull Long roomId,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            @NotNull @Valid CustomerRef customer,
            @Size(max = 1000) String notes
    ) {}

    public record UpdateRequest(
            Long roomId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String paymentStatus,
            LocalDateTime checkedInAt,
            LocalDateTime checkedOutAt,
            @Size(max = 1000) String notes
    ) {}

    public record CancelRequest(
            @Size(max = 1000) String notes
    ) {}

    // ---------- Responses ----------

    public record CustomerSummary(
            Long id,
            String fullName,
            String address,
            LocalDate dateOfBirth,
            String idNumber,
            IdType idType,
            String email,
            LocalDate registrationDate
    ) {}

    public record Response(
            Long id,
            Long roomId,
            Long customerId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String paymentStatus,
            LocalDateTime checkedInAt,
            LocalDateTime checkedOutAt,
            String notes,
            LocalDateTime cancelledAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CustomerSummary customer
    ) {}
}
