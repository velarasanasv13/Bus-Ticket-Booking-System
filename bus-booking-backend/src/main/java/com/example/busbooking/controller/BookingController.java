package com.example.busbooking.controller;

import com.example.busbooking.dto.BookingRequest;
import com.example.busbooking.dto.BookingResponse;
import com.example.busbooking.dto.BookingUpdateRequest;
import com.example.busbooking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<BookingResponse> mine() {
        return bookingService.getMyBookings();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse getOne(@PathVariable Long id) {
        return bookingService.getBooking(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse update(@PathVariable Long id, @Valid @RequestBody BookingUpdateRequest request) {
        return bookingService.updateBooking(id, request);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse cancel(@PathVariable Long id) {
        return bookingService.cancelBooking(id);
    }

    /** Alias of PATCH /{id}/cancel for clients that prefer DELETE. Booking is soft-cancelled, not erased. */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse cancelViaDelete(@PathVariable Long id) {
        return bookingService.cancelBooking(id);
    }
}
