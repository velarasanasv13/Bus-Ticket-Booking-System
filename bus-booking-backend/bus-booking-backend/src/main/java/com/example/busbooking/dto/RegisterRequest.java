package com.example.busbooking.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Full name is required") @Size(max = 100) String fullName,
        @NotBlank(message = "Email is required") @Email(message = "Email must be valid") @Size(max = 150) String email,
        @NotBlank(message = "Password is required") @Size(min = 6, max = 72, message = "Password must be 6 to 72 characters") String password) {}
