package com.example.busbooking.dto;

import jakarta.validation.constraints.*;

import java.util.List;

/** Note: there is deliberately no userId. The owner is always the authenticated user. */
public record BookingRequest(
        @NotNull(message = "Bus id is required") Long busId,
        @NotBlank(message = "Passenger name is required") @Size(max = 100) String passengerName,
        @NotNull(message = "Passenger age is required") @Min(value = 1, message = "Age must be at least 1") @Max(value = 120, message = "Age must be at most 120") Integer passengerAge,
        @NotEmpty(message = "Select at least one seat") @Size(max = 6, message = "You can book at most 6 seats at a time") List<@NotNull @Positive Integer> seatNumbers) {}
