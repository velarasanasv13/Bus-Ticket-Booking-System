package com.example.busbooking.dto;

import com.example.busbooking.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(Long id, String bookingReference, BookingStatus bookingStatus,
                              String passengerName, Integer passengerAge,
                              List<Integer> seatNumbers, Integer numberOfSeats, BigDecimal totalFare,
                              LocalDateTime bookedAt,
                              Long busId, String busNumber, String operatorName, String source, String destination,
                              LocalDateTime departureDateTime, LocalDateTime arrivalDateTime) {}
