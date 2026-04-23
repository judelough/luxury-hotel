package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * Overlap rule:
     * Two ranges [start, end) overlap iff:
     *   reqStart < existingEnd AND reqEnd > existingStart
     *
     * We ignore CANCELLED reservations.
     */
    @Query("""
        select (count(r) > 0)
        from Reservation r
        where r.room.id = :roomId
          and upper(r.status) <> 'CANCELLED'
          and :startDate < r.endDate
          and :endDate > r.startDate
          and (:excludeReservationId is null or r.id <> :excludeReservationId)
    """)
    boolean existsOverlappingReservation(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeReservationId") Long excludeReservationId
    );

    /**
     * Fetch conflicts (for detailed 409 error message).
     * Same rule as existsOverlappingReservation but returns the reservations.
     */
    @Query("""
        select r
        from Reservation r
        where r.room.id = :roomId
          and upper(r.status) <> 'CANCELLED'
          and r.startDate < :endDate
          and r.endDate > :startDate
          and (:excludeReservationId is null or r.id <> :excludeReservationId)
        order by r.startDate asc
    """)
    List<Reservation> findOverlappingReservations(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeReservationId") Long excludeReservationId
    );

    @Query("""
        select r
        from Reservation r
        where (:roomId is null or r.room.id = :roomId)
          and (:customerId is null or r.customer.id = :customerId)
          and (:status is null or r.status = :status)
          and (:paymentStatus is null or r.paymentStatus = :paymentStatus)
        order by r.createdAt desc
    """)
    List<Reservation> findAllFiltered(
            @Param("roomId") Long roomId,
            @Param("customerId") Long customerId,
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus
    );

    @Query("""
        select r
        from Reservation r
        where (:roomId is null or r.room.id = :roomId)
          and (:customerId is null or r.customer.id = :customerId)
          and (:status is null or r.status = :status)
          and (:paymentStatus is null or r.paymentStatus = :paymentStatus)
          and r.startDate >= :fromDate
          and r.endDate <= :toDate
        order by r.createdAt desc
    """)
    List<Reservation> findAllFilteredWithDates(
            @Param("roomId") Long roomId,
            @Param("customerId") Long customerId,
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
        select distinct r.room.id
        from Reservation r
        where upper(r.status) <> 'CANCELLED'
          and :startDate < r.endDate
          and :endDate > r.startDate
    """)
    List<Long> findBookedRoomIdsInRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
