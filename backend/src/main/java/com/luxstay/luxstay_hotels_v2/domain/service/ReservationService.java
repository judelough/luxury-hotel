package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.Customer;
import com.luxstay.luxstay_hotels_v2.domain.Reservation;
import com.luxstay.luxstay_hotels_v2.domain.Room;
import com.luxstay.luxstay_hotels_v2.domain.repo.CustomerRepository;
import com.luxstay.luxstay_hotels_v2.domain.repo.ReservationRepository;
import com.luxstay.luxstay_hotels_v2.domain.repo.RoomRepository;
import com.luxstay.luxstay_hotels_v2.web.dto.ReservationDtos;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_COMPLETED = "COMPLETED";

    public static final String PAY_UNPAID = "UNPAID";
    public static final String PAY_PAID = "PAID";

    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final CustomerRepository customers;

    public ReservationService(ReservationRepository reservations,
                              RoomRepository rooms,
                              CustomerRepository customers) {
        this.reservations = reservations;
        this.rooms = rooms;
        this.customers = customers;
    }

    @Transactional(readOnly = true)
    public Reservation get(Long id) {
        return reservations.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Reservation> list(Long roomId,
                                  Long customerId,
                                  String status,
                                  String paymentStatus,
                                  LocalDate fromDate,
                                  LocalDate toDate) {

        if (fromDate == null && toDate == null) {
            return reservations.findAllFiltered(roomId, customerId, status, paymentStatus);
        }

        if (fromDate == null || toDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide both fromDate and toDate");
        }

        if (toDate.isBefore(fromDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "toDate must be >= fromDate");
        }

        return reservations.findAllFilteredWithDates(roomId, customerId, status, paymentStatus, fromDate, toDate);
    }

    @Transactional
    public Reservation create(ReservationDtos.CreateRequest req) {
        validateDateRange(req.startDate(), req.endDate());

        Room room = rooms.findById(req.roomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found: " + req.roomId()));

        ensureRoomAvailable(room.getId(), req.startDate(), req.endDate(), null);

        Customer customer = findOrCreateCustomer(req.customer());

        Reservation r = new Reservation();
        r.setRoom(room);
        r.setCustomer(customer);
        r.setStartDate(req.startDate());
        r.setEndDate(req.endDate());
        r.setStatus(STATUS_ACTIVE);
        r.setPaymentStatus(PAY_UNPAID);
        r.setNotes(req.notes());
        r.setCancelledAt(null);
        r.setCheckedInAt(null);
        r.setCheckedOutAt(null);

        return reservations.save(r);
    }

    @Transactional
    public Reservation update(Long id, ReservationDtos.UpdateRequest req) {
        Reservation r = reservations.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found: " + id));

        boolean changesDatesOrRoom =
                (req.roomId() != null) ||
                        (req.startDate() != null) ||
                        (req.endDate() != null);

        // Business rule: once checked-in, you cannot change room/dates
        if (changesDatesOrRoom && r.getCheckedInAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot change room or dates after check-in.");
        }

        Long newRoomId = (req.roomId() != null) ? req.roomId() : r.getRoom().getId();
        LocalDate newStart = (req.startDate() != null) ? req.startDate() : r.getStartDate();
        LocalDate newEnd = (req.endDate() != null) ? req.endDate() : r.getEndDate();

        validateDateRange(newStart, newEnd);

        if (req.roomId() != null) {
            Room room = rooms.findById(req.roomId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found: " + req.roomId()));
            r.setRoom(room);
        }

        if (changesDatesOrRoom) {
            ensureRoomAvailable(newRoomId, newStart, newEnd, r.getId());
        }

        r.setStartDate(newStart);
        r.setEndDate(newEnd);

        if (req.checkedInAt() != null) r.setCheckedInAt(req.checkedInAt());
        if (req.checkedOutAt() != null) r.setCheckedOutAt(req.checkedOutAt());
        if (req.notes() != null) r.setNotes(req.notes());

        if (req.paymentStatus() != null) {
            r.setPaymentStatus(normalizePayment(req.paymentStatus()));
        }

        if (req.status() != null) {
            String next = normalizeStatus(req.status());
            if (STATUS_CANCELLED.equalsIgnoreCase(next)) {
                // Business rule: cannot cancel after check-in
                if (r.getCheckedInAt() != null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cannot cancel a reservation after check-in.");
                }
                r.setStatus(STATUS_CANCELLED);
                r.setCancelledAt(LocalDateTime.now());
            } else {
                r.setStatus(next);
                r.setCancelledAt(null);
            }
        }

        return reservations.save(r);
    }

    @Transactional
    public void delete(Long id) {
        if (!reservations.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found: " + id);
        }
        reservations.deleteById(id);
    }

    @Transactional
    public Reservation cancel(Long id, ReservationDtos.CancelRequest req) {
        Reservation r = reservations.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found: " + id));

        if (STATUS_CANCELLED.equalsIgnoreCase(r.getStatus())) return r;

        // Business rule: cannot cancel after check-in
        if (r.getCheckedInAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot cancel a reservation after check-in.");
        }

        r.setStatus(STATUS_CANCELLED);
        r.setCancelledAt(LocalDateTime.now());

        if (req != null && req.notes() != null && !req.notes().isBlank()) {
            String existing = (r.getNotes() == null) ? "" : r.getNotes().trim();
            String add = req.notes().trim();
            r.setNotes(existing.isEmpty() ? add : (existing + "\n" + add));
        }

        return reservations.save(r);
    }

    @Transactional
    public Reservation pay(Long id) {
        Reservation r = get(id);

        if (STATUS_CANCELLED.equalsIgnoreCase(r.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot pay a cancelled reservation.");
        }

        if (PAY_PAID.equalsIgnoreCase(r.getPaymentStatus())) return r; // idempotent

        r.setPaymentStatus(PAY_PAID);
        return reservations.save(r);
    }

    // ---------- Helpers ----------

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate and endDate are required");
        }
        if (!end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must be after startDate");
        }
    }

    private void ensureRoomAvailable(Long roomId, LocalDate start, LocalDate end, Long excludeReservationId) {

        // Fetch conflicts for a detailed error message (overlap rule: [start,end) )
        List<Reservation> conflicts =
                reservations.findOverlappingReservations(roomId, start, end, excludeReservationId);

        if (conflicts.isEmpty()) return;

        Reservation c = conflicts.get(0); // earliest conflict

        String message = String.format(
                "Room %d is already booked from %s to %s. Your requested dates %s to %s overlap this period.",
                roomId,
                c.getStartDate(), c.getEndDate(),
                start, end
        );

        throw new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private Customer findOrCreateCustomer(ReservationDtos.CustomerRef c) {
        String email = c.email().trim();
        String idNumber = c.idNumber().trim();

        return customers.findByIdNumberAndEmailIgnoreCase(idNumber, email)
                .orElseGet(() -> {
                    Customer created = new Customer();
                    created.setFullName(c.fullName().trim());
                    created.setAddress(c.address().trim());
                    created.setDateOfBirth(c.dateOfBirth());
                    created.setIdNumber(idNumber);
                    created.setIdType(c.idType());
                    created.setEmail(email);
                    return customers.save(created);
                });
    }

    private String normalizeStatus(String raw) {
        String s = raw.trim().toUpperCase();
        return switch (s) {
            case STATUS_ACTIVE, STATUS_CANCELLED, STATUS_COMPLETED -> s;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Use ACTIVE, CANCELLED, or COMPLETED");
        };
    }

    private String normalizePayment(String raw) {
        String p = raw.trim().toUpperCase();
        return switch (p) {
            case PAY_UNPAID, PAY_PAID -> p;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid paymentStatus. Use UNPAID or PAID");
        };
    }

    public String effectiveStatus(Reservation r) {
        if (r == null || r.getStatus() == null) return STATUS_ACTIVE;
        if (STATUS_CANCELLED.equalsIgnoreCase(r.getStatus())) return STATUS_CANCELLED;

        LocalDate today = LocalDate.now();
        if (r.getEndDate() != null && r.getEndDate().isBefore(today) && STATUS_ACTIVE.equalsIgnoreCase(r.getStatus())) {
            return STATUS_COMPLETED;
        }
        return r.getStatus().toUpperCase();
    }
}
