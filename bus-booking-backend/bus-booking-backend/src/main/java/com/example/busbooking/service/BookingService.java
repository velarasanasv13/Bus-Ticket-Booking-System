package com.example.busbooking.service;

import com.example.busbooking.dto.BookingRequest;
import com.example.busbooking.dto.BookingResponse;
import com.example.busbooking.dto.BookingUpdateRequest;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request);
    BookingResponse getBooking(Long id);
    List<BookingResponse> getMyBookings();
    BookingResponse updateBooking(Long id, BookingUpdateRequest request);
    BookingResponse cancelBooking(Long id);
}
