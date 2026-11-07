package com.example.busbooking.repository;

import com.example.busbooking.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {

    Optional<BookingSeat> findByBusIdAndSeatNumber(Long busId, Integer seatNumber);

    @Query("select s.seatNumber from BookingSeat s where s.bus.id = :busId and s.seatNumber in :seats")
    List<Integer> findTakenSeats(@Param("busId") Long busId, @Param("seats") Collection<Integer> seats);

    @Query("select s.seatNumber from BookingSeat s where s.bus.id = :busId order by s.seatNumber")
    List<Integer> findSeatNumbersByBusId(@Param("busId") Long busId);

    @Modifying(flushAutomatically = true)
    @Query("delete from BookingSeat s where s.booking.id = :bookingId")
    int deleteByBookingId(@Param("bookingId") Long bookingId);
}
