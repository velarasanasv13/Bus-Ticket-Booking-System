package com.example.busbooking.service.impl;

import com.example.busbooking.dto.BusRequest;
import com.example.busbooking.dto.BusResponse;
import com.example.busbooking.entity.Bus;
import com.example.busbooking.exception.BadRequestException;
import com.example.busbooking.exception.ConflictException;
import com.example.busbooking.exception.ResourceNotFoundException;
import com.example.busbooking.repository.BookingRepository;
import com.example.busbooking.repository.BookingSeatRepository;
import com.example.busbooking.repository.BusRepository;
import com.example.busbooking.service.BusService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
public class BusServiceImpl implements BusService {

    private final BusRepository busRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;

    public BusServiceImpl(BusRepository busRepository, BookingRepository bookingRepository,
                          BookingSeatRepository bookingSeatRepository) {
        this.busRepository = busRepository;
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
    }

    @Override
    @Transactional
    public BusResponse addBus(BusRequest r) {
        validate(r);
        if (busRepository.existsByBusNumber(r.busNumber().trim())) {
            throw new ConflictException("A bus with number " + r.busNumber() + " already exists");
        }
        Bus bus = new Bus();
        apply(bus, r);
        bus.setAvailableSeats(r.totalSeats());
        return toResponse(busRepository.save(bus));
    }

    @Override
    @Transactional
    public BusResponse updateBus(Long id, BusRequest r) {
        validate(r);
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id " + id));
        busRepository.findByBusNumber(r.busNumber().trim()).ifPresent(other -> {
            if (!other.getId().equals(id)) throw new ConflictException("A bus with number " + r.busNumber() + " already exists");
        });
        List<Integer> booked = bookingSeatRepository.findSeatNumbersByBusId(id);
        int highest = booked.isEmpty() ? 0 : Collections.max(booked);
        if (r.totalSeats() < highest) {
            throw new BadRequestException("Total seats cannot be lower than the highest booked seat number (" + highest + ")");
        }
        apply(bus, r);
        bus.setAvailableSeats(r.totalSeats() - booked.size());
        return toResponse(bus);
    }

    @Override
    @Transactional(readOnly = true)
    public BusResponse getBus(Long id) {
        return toResponse(busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusResponse> getAllBuses() {
        return busRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusResponse> searchBuses(String source, String destination, LocalDate date) {
        return busRepository.search(source.trim(), destination.trim(), date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteBus(Long id) {
        if (!busRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bus not found with id " + id);
        }
        if (bookingRepository.existsByBusId(id)) {
            throw new ConflictException("This bus has bookings and cannot be deleted");
        }
        busRepository.deleteById(id);
    }

    private void validate(BusRequest r) {
        if (!r.arrivalDateTime().isAfter(r.departureDateTime())) {
            throw new BadRequestException("Arrival must be after departure");
        }
        if (r.source().trim().equalsIgnoreCase(r.destination().trim())) {
            throw new BadRequestException("Source and destination must be different");
        }
    }

    private void apply(Bus bus, BusRequest r) {
        bus.setBusNumber(r.busNumber().trim());
        bus.setOperatorName(r.operatorName().trim());
        bus.setSource(r.source().trim());
        bus.setDestination(r.destination().trim());
        bus.setDepartureDateTime(r.departureDateTime());
        bus.setArrivalDateTime(r.arrivalDateTime());
        bus.setTotalSeats(r.totalSeats());
        bus.setFarePerSeat(r.farePerSeat());
    }

    private BusResponse toResponse(Bus b) {
        return new BusResponse(b.getId(), b.getBusNumber(), b.getOperatorName(), b.getSource(), b.getDestination(),
                b.getDepartureDateTime(), b.getArrivalDateTime(), b.getTotalSeats(), b.getAvailableSeats(),
                b.getFarePerSeat(), bookingSeatRepository.findSeatNumbersByBusId(b.getId()));
    }
}
