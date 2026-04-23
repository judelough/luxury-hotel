package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.Customer;
import com.luxstay.luxstay_hotels_v2.domain.Reservation;
import com.luxstay.luxstay_hotels_v2.domain.service.ReservationService;
import com.luxstay.luxstay_hotels_v2.web.dto.ReservationDtos;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v2/reservations")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    public ReservationDtos.Response create(@Valid @RequestBody ReservationDtos.CreateRequest req) {
        return toDto(service.create(req));
    }

    @GetMapping("/{id}")
    public ReservationDtos.Response get(@PathVariable Long id) {
        return toDto(service.get(id));
    }

    @GetMapping
    public List<ReservationDtos.Response> list(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        if (status != null) status = status.trim().toUpperCase();
        if (paymentStatus != null) paymentStatus = paymentStatus.trim().toUpperCase();

        return service.list(roomId, customerId, status, paymentStatus, fromDate, toDate)
                .stream().map(this::toDto).toList();
    }


    @PutMapping("/{id}")
    public ReservationDtos.Response update(@PathVariable Long id,
                                           @Valid @RequestBody ReservationDtos.UpdateRequest req) {
        return toDto(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/cancel")
    public ReservationDtos.Response cancel(@PathVariable Long id,
                                           @RequestBody(required = false) ReservationDtos.CancelRequest req) {
        return toDto(service.cancel(id, req));
    }

    @PostMapping("/{id}/pay")
    public ReservationDtos.Response pay(@PathVariable Long id) {
        return toDto(service.pay(id));
    }

    // ---------- Mapping ----------

    private ReservationDtos.Response toDto(Reservation r) {
        Customer c = r.getCustomer();

        ReservationDtos.CustomerSummary customer = (c == null) ? null :
                new ReservationDtos.CustomerSummary(
                        c.getId(),
                        c.getFullName(),
                        c.getAddress(),
                        c.getDateOfBirth(),
                        c.getIdNumber(),
                        c.getIdType(),
                        c.getEmail(),
                        c.getRegistrationDate()
                );

        return new ReservationDtos.Response(
                r.getId(),
                (r.getRoom() == null ? null : r.getRoom().getId()),
                (r.getCustomer() == null ? null : r.getCustomer().getId()),
                r.getStartDate(),
                r.getEndDate(),
                service.effectiveStatus(r),
                (r.getPaymentStatus() == null ? null : r.getPaymentStatus().toUpperCase()),
                r.getCheckedInAt(),
                r.getCheckedOutAt(),
                r.getNotes(),
                r.getCancelledAt(),
                r.getCreatedAt(),
                r.getUpdatedAt(),
                customer
        );
    }
}
