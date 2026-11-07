package com.example.busbooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BusResponse(Long id, String busNumber, String operatorName, String source, String destination,
                          LocalDateTime departureDateTime, LocalDateTime arrivalDateTime,
                          Integer totalSeats, Integer availableSeats, BigDecimal farePerSeat,
                          List<Integer> bookedSeats) {}
