package com.example.busbooking.service.impl;

import com.example.busbooking.dto.BookingRequest;
import com.example.busbooking.dto.BookingResponse;
import com.example.busbooking.dto.BookingUpdateRequest;
import com.example.busbooking.entity.*;
import com.example.busbooking.exception.BadRequestException;
import com.example.busbooking.exception.ConflictException;
import com.example.busbooking.exception.ResourceNotFoundException;
import com.example.busbooking.exception.UnauthorizedAccessException;
import com.example.busbooking.repository.BookingRepository;
import com.example.busbooking.repository.BookingSeatRepository;
import com.example.busbooking.repository.BusRepository;
import com.example.busbooking.repository.UserRepository;
import com.example.busbooking.service.BookingService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BusRepository busRepository;
    private final UserRepository userRepository;

    public BookingServiceImpl(BookingRepository bookingRepository, BookingSeatRepository bookingSeatRepository,
                              BusRepository busRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.busRepository = busRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest req) {
        User user = currentUser();

        // 1. Lock the bus row (SELECT ... FOR UPDATE) so concurrent bookings on this bus run one at a time.
        Bus bus = busRepository.findByIdForUpdate(req.busId())
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id " + req.busId()));
        if (!bus.getDepartureDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("This bus has already departed");
        }

        // 2. Validate seats
        List<Integer> seats = req.seatNumbers().stream().distinct().sorted().toList();
        if (seats.size() != req.seatNumbers().size()) {
            throw new BadRequestException("Duplicate seat numbers in request");
        }
        for (Integer seat : seats) {
            if (seat < 1 || seat > bus.getTotalSeats()) {
                throw new BadRequestException("Invalid seat number " + seat + ". This bus has seats 1 to " + bus.getTotalSeats());
            }
        }

        // 3. Check availability (safe: we hold the bus lock) and the per-seat ledger
        if (bus.getAvailableSeats() < seats.size()) {
            throw new ConflictException("Not enough seats available. Only " + bus.getAvailableSeats() + " left");
        }
        List<Integer> taken = bookingSeatRepository.findTakenSeats(bus.getId(), seats);
        if (!taken.isEmpty()) {
            throw new ConflictException("Seat(s) already booked: " + taken);
        }

        // 4. Server-side fare
        BigDecimal totalFare = bus.getFarePerSeat().multiply(BigDecimal.valueOf(seats.size()));

        // 5. Save booking + one BookingSeat row per seat
        Booking booking = bookingRepository.save(Booking.builder()
                .bookingReference(newReference())
                .user(user).bus(bus)
                .passengerName(req.passengerName().trim())
                .passengerAge(req.passengerAge())
                .seatNumbers(seats.stream().map(String::valueOf).collect(Collectors.joining(",")))
                .numberOfSeats(seats.size())
                .totalFare(totalFare)
                .bookingStatus(BookingStatus.CONFIRMED)
                .bookedAt(LocalDateTime.now())
                .build());
        try {
            bookingSeatRepository.saveAllAndFlush(seats.stream()
                    .map(s -> BookingSeat.builder().booking(booking).bus(bus).seatNumber(s).build()).toList());
        } catch (DataIntegrityViolationException e) {
            // Unique (bus_id, seat_number) constraint: the database-level safety net
            throw new ConflictException("One or more seats were just booked by someone else");
        }

        // 6. Update availability (flushed on commit, still under the bus lock)
        bus.setAvailableSeats(bus.getAvailableSeats() - seats.size());
        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long id) {
        User user = currentUser();
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + id));
        assertOwnerOrAdmin(booking, user);
        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings() {
        User user = currentUser();
        return bookingRepository.findByUserIdOrderByBookedAtDesc(user.getId()).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, BookingUpdateRequest req) {
        User user = currentUser();
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + id));
        assertOwnerOrAdmin(booking, user);
        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("A cancelled booking cannot be updated");
        }
        if (!booking.getBus().getDepartureDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The bus has already departed, so this booking can no longer be changed");
        }
        booking.setPassengerName(req.passengerName().trim());
        booking.setPassengerAge(req.passengerAge());
        return toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id) {
        User user = currentUser();
        // Lock the booking first: two simultaneous cancels queue up and the second sees CANCELLED.
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + id));
        assertOwnerOrAdmin(booking, user);
        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("This booking is already cancelled");
        }
        // Then lock the bus (same order everywhere: booking -> bus) to update availability safely.
        Bus bus = busRepository.findByIdForUpdate(booking.getBus().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));
        if (!bus.getDepartureDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The bus has already departed, so this booking can no longer be cancelled");
        }
        int released = bookingSeatRepository.deleteByBookingId(booking.getId());
        bus.setAvailableSeats(Math.min(bus.getTotalSeats(), bus.getAvailableSeats() + released));
        booking.setBookingStatus(BookingStatus.CANCELLED);
        return toResponse(booking);
    }

    // ---------- helpers ----------

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new UnauthorizedAccessException("Authenticated user no longer exists"));
    }

    private void assertOwnerOrAdmin(Booking booking, User user) {
        boolean owner = booking.getUser().getId().equals(user.getId());
        if (!owner && user.getRole() != Role.ROLE_ADMIN) {
            throw new UnauthorizedAccessException("You are not allowed to access this booking");
        }
    }

    private String newReference() {
        String ref;
        do {
            StringBuilder sb = new StringBuilder("RW-");
            for (int i = 0; i < 6; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            ref = sb.toString();
        } while (bookingRepository.existsByBookingReference(ref));
        return ref;
    }

    private BookingResponse toResponse(Booking b) {
        Bus bus = b.getBus();
        List<Integer> seats = Arrays.stream(b.getSeatNumbers().split(",")).map(Integer::valueOf).toList();
        return new BookingResponse(b.getId(), b.getBookingReference(), b.getBookingStatus(),
                b.getPassengerName(), b.getPassengerAge(), seats, b.getNumberOfSeats(), b.getTotalFare(), b.getBookedAt(),
                bus.getId(), bus.getBusNumber(), bus.getOperatorName(), bus.getSource(), bus.getDestination(),
                bus.getDepartureDateTime(), bus.getArrivalDateTime());
    }
}
