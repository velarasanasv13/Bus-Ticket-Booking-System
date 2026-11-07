# Bus Ticket Booking System: Spring Boot Backend

Java 17, Spring Boot 3.3, Spring Security 6 (JWT), Spring Data JPA / Hibernate, PostgreSQL, Maven.
Works with the Routewise React frontend (set `VITE_USE_MOCK=false`).

## 1. Run it
1. Install Java 17, Maven 3.9+, PostgreSQL.
2. Create the database:
   ```
   psql -U postgres -c "CREATE DATABASE busbooking;"
   ```
3. Set environment variables (never commit real values):
   | Variable | Required | Example |
   |---|---|---|
   | DB_PASSWORD | yes | your postgres password |
   | JWT_SECRET | yes | output of `openssl rand -base64 32` (Base64, at least 32 bytes) |
   | DB_URL / DB_USERNAME | no | defaults: `jdbc:postgresql://localhost:5432/busbooking` / `postgres` |
   | ADMIN_EMAIL, ADMIN_PASSWORD | no | creates the first ADMIN at startup |
   | SEED_SAMPLE_BUSES | no | `true` (default) adds 4 sample buses on first start |
   | CORS_ORIGINS | no | default `http://localhost:5173` |

   macOS/Linux: `export DB_PASSWORD=... JWT_SECRET=... ADMIN_EMAIL=admin@routewise.in ADMIN_PASSWORD='Str0ng!Pass'`
   Windows PowerShell: `$env:DB_PASSWORD="..."; $env:JWT_SECRET="..."` (generate a secret with `[Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))`)
   IntelliJ: Run > Edit Configurations > Environment variables. VS Code: add `"env": {...}` to launch.json.
4. Start: `mvn spring-boot:run`  (IntelliJ: open `pom.xml` as a project and run `BusBookingApplication`;
   VS Code: install "Extension Pack for Java" + "Lombok Annotations Support", then Run).
5. API is at http://localhost:8080. Import `postman/BusBooking.postman_collection.json` into Postman.

## 2. Architecture (layers)
`Controller` (thin, validation, @PreAuthorize) -> `Service` (business rules, @Transactional) -> `Repository` (Spring Data JPA) -> PostgreSQL.
Cross-cutting: `security/*` (JWT filter), `exception/GlobalExceptionHandler`, `dto/*` (no entity or password hash ever leaves the API).

Extra classes beyond your list, and why:
- `entity/BookingSeat`: one row per reserved seat with UNIQUE(bus_id, seat_number). This is what makes multi-seat booking and seat reuse after cancellation correct.
- `exception/ConflictException` + `ErrorResponse`: HTTP 409 and the consistent error body.
- `dto/BookingUpdateRequest`: update only exposes passenger name and age.
- `security/RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`: filters run before `@RestControllerAdvice`, so 401/403 JSON must be produced here.
- `config/DataInitializer`: secure first-admin bootstrap and sample buses.

## 3. All APIs
| # | Method | Endpoint | Access | Success | Errors |
|---|---|---|---|---|---|
| 1 | POST | /api/auth/register | public | 201 | 400, 409 duplicate email |
| 2 | POST | /api/auth/login | public | 200 | 400, 401 |
| 3 | GET | /api/buses | public | 200 | |
| 4 | GET | /api/buses/{id} | public | 200 | 404 |
| 5 | GET | /api/buses/search?source=&destination=&date=yyyy-MM-dd | public | 200 | 400 |
| 6 | POST | /api/buses | ADMIN | 201 | 400, 401, 403, 409 |
| 7 | PUT | /api/buses/{id} | ADMIN | 200 | 400, 401, 403, 404, 409 |
| 8 | DELETE | /api/buses/{id} | ADMIN | 204 | 401, 403, 404, 409 has bookings |
| 9 | POST | /api/bookings | USER | 201 | 400 invalid seat, 401, 403, 404, 409 seat taken |
| 10 | GET | /api/bookings/my | authenticated | 200 | 401 |
| 11 | GET | /api/bookings/{id} | owner or ADMIN | 200 | 401, 403, 404 |
| 12 | PUT | /api/bookings/{id} | owner or ADMIN | 200 | 400, 401, 403, 404 |
| 13 | PATCH | /api/bookings/{id}/cancel | owner or ADMIN | 200 | 400 already cancelled, 401, 403, 404 |
| 14 | DELETE | /api/bookings/{id} | owner or ADMIN | 200 | same as 13 (alias; soft cancel) |

Authenticated calls need `Authorization: Bearer <JWT>`.

### Examples
Register / login request: `{"fullName":"Asha K","email":"asha@example.com","password":"secret123"}` (login needs only email and password)
Response: `{"token":"eyJhbGciOi...","email":"asha@example.com","fullName":"Asha K","role":"ROLE_USER"}`

Add bus (ADMIN):
```json
{"busNumber":"TN-10-XY-1001","operatorName":"Kaveri Express","source":"Chennai","destination":"Bengaluru",
 "departureDateTime":"2026-11-05T22:30:00","arrivalDateTime":"2026-11-06T05:00:00","totalSeats":40,"farePerSeat":899.00}
```
Search: `GET /api/buses/search?source=Chennai&destination=Bengaluru&date=2026-11-05` returns a list of buses, each with `availableSeats` and `bookedSeats:[5,6]`.

Create booking: `{"busId":1,"passengerName":"Asha K","passengerAge":29,"seatNumbers":[7,8]}`
```json
{"id":1,"bookingReference":"RW-K3M9QA","bookingStatus":"CONFIRMED","passengerName":"Asha K","passengerAge":29,
 "seatNumbers":[7,8],"numberOfSeats":2,"totalFare":1798.00,"bookedAt":"2026-10-30T11:02:10",
 "busId":1,"busNumber":"TN-10-XY-1001","operatorName":"Kaveri Express","source":"Chennai","destination":"Bengaluru",
 "departureDateTime":"2026-11-05T22:30:00","arrivalDateTime":"2026-11-06T05:00:00"}
```
Update booking: `PUT /api/bookings/1` with `{"passengerName":"Asha Kumar","passengerAge":30}`. Cancel: `PATCH /api/bookings/1/cancel` (no body) returns the booking with `"bookingStatus":"CANCELLED"`.
Error body (all errors): `{"timestamp":"...","status":409,"error":"Conflict","message":"Seat(s) already booked: [7]","path":"/api/bookings"}`

## 4. Booking integrity
1. `createBooking` runs in one transaction and takes `SELECT ... FOR UPDATE` on the bus row, so bookings for one bus are serialised.
2. It validates seats (1..totalSeats, no duplicates), checks `availableSeats`, then checks the `booking_seats` ledger.
3. Fare is computed on the server (`farePerSeat x seats`). Owner = authenticated user from `SecurityContextHolder`, never from the request.
4. Safety net: `UNIQUE(bus_id, seat_number)` on `booking_seats`; a violation becomes a 409.
5. Cancel locks the booking row, then the bus row (same order everywhere, no deadlocks), verifies owner/ADMIN, rejects double cancel, deletes the booking's seat rows (release exactly once) and adds the seats back to `availableSeats`. Cancelled seats can be booked again.
6. Booking edits are limited to passenger name and age (seat changes: cancel and rebook). `@Version` on `Booking` adds optimistic locking.

## 5. Flows
Register: Client -> AuthController -> AuthService -> BCrypt encode -> UserRepository.save -> PostgreSQL -> JWT -> AuthResponse
Login: Client -> AuthController -> AuthenticationManager -> CustomUserDetailsService -> UserRepository -> BCrypt matches -> JwtService.generateToken -> AuthResponse
Protected call: `Authorization: Bearer <JWT>` -> JwtAuthenticationFilter (signature + expiry + user lookup) -> SecurityContextHolder -> URL rules and @PreAuthorize -> Controller -> Service ownership check
Booking: POST /api/bookings -> JWT filter -> role USER check -> BookingController (@Valid) -> BookingServiceImpl [lock bus, validate, check ledger, save booking + seats, decrement availability] -> commit -> BookingResponse (201)

## 6. Concepts (interview notes)
- **ORM**: maps Java objects to relational rows, so you work with entities instead of hand-written SQL.
- **Hibernate**: the JPA implementation. It reads `@Entity/@Column/@ManyToOne`, generates DDL (ddl-auto) and SQL, tracks changes to managed entities (dirty checking) and flushes them at commit.
- **Spring Data JPA**: generates repository implementations at runtime from interfaces. `findByEmail` is parsed into a query, `@Query` uses JPQL, `save/findById/deleteById` come from `JpaRepository`.
- **save() vs persist()**: `persist()` (EntityManager) only makes a NEW entity managed. Spring's `save()` calls `persist` if the entity is new (null id or null @Version) and `merge` otherwise, and returns the managed instance.
- **@Transactional**: Spring wraps the method in a proxy that opens a transaction, commits on return and rolls back on RuntimeException. Entities loaded inside are managed, so `bus.setAvailableSeats(...)` is saved at commit without calling save().
- **Authentication vs authorization**: authentication = who are you (login with email/password, JWT validated). Authorization = what may you do (only ADMIN can POST /api/buses; only the owner or ADMIN can read booking 7).

## 7. Postman steps
1. Register a user, then Login. The collection stores `token` automatically.
2. Create the admin with ADMIN_EMAIL/ADMIN_PASSWORD (section 8), run "Login (Admin)" to store `adminToken`.
3. Run Add Bus (admin), then Search Buses, then Create Booking, Get Booking, My Bookings, Update Booking, Cancel Booking.
4. Negative checks: call Add Bus with the user token (403), no token (401), book a taken seat (409), read another user's booking (403).

## 8. Creating an ADMIN securely
Self-registration can only create ROLE_USER, so nobody can promote themselves. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables for the first start; the account is created once with a BCrypt hash. Remove the variables afterwards. Never hard-code credentials in source.

## 9. Common errors
| Problem | Fix |
|---|---|
| `Could not resolve placeholder 'JWT_SECRET'` / `'DB_PASSWORD'` | Set the environment variables, restart the IDE or terminal |
| `WeakKeyException` / illegal Base64 | JWT_SECRET must be valid Base64 and at least 32 bytes decoded |
| `password authentication failed` / `database "busbooking" does not exist` | Check DB_PASSWORD; run CREATE DATABASE |
| 401 `JWT token has expired` | Log in again |
| 403 on admin endpoints | Token belongs to a ROLE_USER account |
| Lombok errors in IDE (cannot find getters) | Install the Lombok plugin and enable annotation processing |
| CORS error from the frontend | Add its origin to CORS_ORIGINS, or use the Vite proxy |

## 10. Final checklist
- [ ] `java -version` shows 17 and `mvn -v` works
- [ ] `mvn clean package` succeeds
- [ ] App starts and Hibernate creates users, buses, bookings, booking_seats
- [ ] Register, login, and the JWT is returned
- [ ] Admin can add a bus; a user gets 403
- [ ] Booking the same seat twice returns 409
- [ ] Cancelling frees the seat and `availableSeats` goes back up
- [ ] A second user cannot read the first user's booking (403)
