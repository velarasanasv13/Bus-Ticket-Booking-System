-- Reference only: Hibernate (ddl-auto=update) creates these tables automatically.
-- CREATE DATABASE busbooking;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL);

CREATE TABLE buses (
  id BIGSERIAL PRIMARY KEY, bus_number VARCHAR(30) NOT NULL UNIQUE, operator_name VARCHAR(100) NOT NULL,
  source VARCHAR(80) NOT NULL, destination VARCHAR(80) NOT NULL,
  departure_date_time TIMESTAMP NOT NULL, arrival_date_time TIMESTAMP NOT NULL,
  total_seats INT NOT NULL, available_seats INT NOT NULL, fare_per_seat NUMERIC(10,2) NOT NULL);

CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY, booking_reference VARCHAR(20) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id), bus_id BIGINT NOT NULL REFERENCES buses(id),
  passenger_name VARCHAR(100) NOT NULL, passenger_age INT NOT NULL, seat_numbers VARCHAR(100) NOT NULL,
  number_of_seats INT NOT NULL, total_fare NUMERIC(10,2) NOT NULL, booking_status VARCHAR(20) NOT NULL,
  booked_at TIMESTAMP NOT NULL, version BIGINT);

CREATE TABLE booking_seats (
  id BIGSERIAL PRIMARY KEY, booking_id BIGINT NOT NULL REFERENCES bookings(id),
  bus_id BIGINT NOT NULL REFERENCES buses(id), seat_number INT NOT NULL,
  CONSTRAINT uk_bus_seat UNIQUE (bus_id, seat_number));   -- a seat can never be double-booked
