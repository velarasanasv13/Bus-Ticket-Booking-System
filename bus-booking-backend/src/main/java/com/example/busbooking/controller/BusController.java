package com.example.busbooking.controller;

import com.example.busbooking.dto.BusRequest;
import com.example.busbooking.dto.BusResponse;
import com.example.busbooking.service.BusService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @GetMapping
    public List<BusResponse> getAll() {
        return busService.getAllBuses();
    }

    @GetMapping("/search")
    public List<BusResponse> search(@RequestParam String source, @RequestParam String destination,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return busService.searchBuses(source, destination, date);
    }

    @GetMapping("/{id}")
    public BusResponse getOne(@PathVariable Long id) {
        return busService.getBus(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BusResponse> add(@Valid @RequestBody BusRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(busService.addBus(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BusResponse update(@PathVariable Long id, @Valid @RequestBody BusRequest request) {
        return busService.updateBus(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        busService.deleteBus(id);
        return ResponseEntity.noContent().build();
    }
}
