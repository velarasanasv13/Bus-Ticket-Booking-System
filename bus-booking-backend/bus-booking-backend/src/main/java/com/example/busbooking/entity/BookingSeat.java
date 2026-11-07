package com.example.busbooking.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * One row per reserved seat. The UNIQUE (bus_id, seat_number) constraint is the database-level
 * guarantee that a seat can never be reserved twice. Rows are deleted when a booking is cancelled,
 * which releases the seat for reuse while the Booking row keeps the history.
 */
@Entity
@Table(name = "booking_seats",
        uniqueConstraints = @UniqueConstraint(name = "uk_bus_seat", columnNames = {"bus_id", "seat_number"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber;
}
