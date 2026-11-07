package com.example.busbooking.dto;

import jakarta.validation.constraints.*;

public record BookingUpdateRequest(
        @NotBlank(message = "Passenger name is required") @Size(max = 100) String passengerName,
        @NotNull(message = "Passenger age is required") @Min(1) @Max(120) Integer passengerAge) {}
