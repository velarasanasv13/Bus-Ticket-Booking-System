package com.example.busbooking.service;

import com.example.busbooking.dto.BusRequest;
import com.example.busbooking.dto.BusResponse;

import java.time.LocalDate;
import java.util.List;

public interface BusService {
    BusResponse addBus(BusRequest request);
    BusResponse updateBus(Long id, BusRequest request);
    BusResponse getBus(Long id);
    List<BusResponse> getAllBuses();
    List<BusResponse> searchBuses(String source, String destination, LocalDate date);
    void deleteBus(Long id);
}
