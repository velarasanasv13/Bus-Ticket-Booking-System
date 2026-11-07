package com.example.busbooking.config;

import com.example.busbooking.entity.Bus;
import com.example.busbooking.entity.Role;
import com.example.busbooking.entity.User;
import com.example.busbooking.repository.BusRepository;
import com.example.busbooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Creates the first ADMIN from environment variables and (optionally) a few sample buses. */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BusRepository busRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final boolean seedBuses;

    public DataInitializer(UserRepository userRepository, BusRepository busRepository, PasswordEncoder passwordEncoder,
                           @Value("${app.admin.email}") String adminEmail,
                           @Value("${app.admin.password}") String adminPassword,
                           @Value("${app.seed.sample-buses}") boolean seedBuses) {
        this.userRepository = userRepository;
        this.busRepository = busRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.seedBuses = seedBuses;
    }

    @Override
    public void run(String... args) {
        if (!adminEmail.isBlank() && !adminPassword.isBlank() && !userRepository.existsByEmail(adminEmail.toLowerCase())) {
            userRepository.save(User.builder().fullName("Administrator").email(adminEmail.toLowerCase())
                    .password(passwordEncoder.encode(adminPassword)).role(Role.ROLE_ADMIN).build());
        }
        if (seedBuses && busRepository.count() == 0) {
            LocalDate d = LocalDate.now().plusDays(1);
            busRepository.save(bus("TN-01-AB-1204", "Kaveri Express", "Chennai", "Bengaluru", d.atTime(22, 30), 6, 40, "899"));
            busRepository.save(bus("TN-09-CD-7781", "Marina Travels", "Chennai", "Bengaluru", d.atTime(21, 0), 7, 36, "749"));
            busRepository.save(bus("TN-02-EF-3310", "Pandian Sleeper", "Chennai", "Madurai", d.atTime(23, 15), 8, 40, "1050"));
            busRepository.save(bus("KA-05-JK-6620", "Silk Route", "Bengaluru", "Hyderabad", d.plusDays(1).atTime(19, 30), 10, 40, "1250"));
        }
    }

    private Bus bus(String no, String op, String from, String to, LocalDateTime dep, int hours, int seats, String fare) {
        return Bus.builder().busNumber(no).operatorName(op).source(from).destination(to)
                .departureDateTime(dep).arrivalDateTime(dep.plusHours(hours))
                .totalSeats(seats).availableSeats(seats).farePerSeat(new BigDecimal(fare)).build();
    }
}
