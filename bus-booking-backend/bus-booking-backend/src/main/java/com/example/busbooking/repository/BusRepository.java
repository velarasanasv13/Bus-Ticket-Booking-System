package com.example.busbooking.repository;

import com.example.busbooking.entity.Bus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BusRepository extends JpaRepository<Bus, Long> {

    boolean existsByBusNumber(String busNumber);

    Optional<Bus> findByBusNumber(String busNumber);

    /** SELECT ... FOR UPDATE: serialises bookings/cancellations on the same bus. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Bus b where b.id = :id")
    Optional<Bus> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select b from Bus b
            where lower(b.source) = lower(:source)
              and lower(b.destination) = lower(:destination)
              and b.departureDateTime >= :start and b.departureDateTime < :end
            order by b.departureDateTime
            """)
    List<Bus> search(@Param("source") String source, @Param("destination") String destination,
                     @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
