package com.example.busbooking.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BusRequest(
        @NotBlank(message = "Bus number is required") @Size(max = 30) String busNumber,
        @NotBlank(message = "Operator name is required") @Size(max = 100) String operatorName,
        @NotBlank(message = "Source is required") @Size(max = 80) String source,
        @NotBlank(message = "Destination is required") @Size(max = 80) String destination,
        @NotNull(message = "Departure time is required") @Future(message = "Departure must be in the future") LocalDateTime departureDateTime,
        @NotNull(message = "Arrival time is required") LocalDateTime arrivalDateTime,
        @NotNull(message = "Total seats is required") @Min(value = 1, message = "Total seats must be at least 1") @Max(value = 60, message = "Total seats cannot exceed 60") Integer totalSeats,
        @NotNull(message = "Fare is required") @Positive(message = "Fare must be positive") BigDecimal farePerSeat) {}
