# Routewise: Bus Ticket Booking Frontend (React + Vite)

## Run
    npm install
    npm run dev
Open http://localhost:5173. The backend must be running at http://localhost:8081.

## API configuration
`VITE_API_BASE_URL=http://localhost:8081/api` is set in `.env`. Restart Vite after changing it.
The backend allows CORS from `http://localhost:5173` by default. JWTs are kept in `sessionStorage` for the current browser tab and survive page refreshes; logging out or a 401 response clears the session. Legacy demo database data and mock sessions are removed on startup.

## API verification checklist
1. Register and log in; verify the returned `ROLE_USER` profile and authenticated booking access.
2. Log out, reload, and confirm the session is cleared. Reload while signed in and confirm the tab's session persists.
3. Search buses from the home page and select seats; bus detail and seat selection use the backend response.
4. Open **Manage buses** as an ADMIN to list buses; add a bus, edit it, and delete an unused bus.
5. As a USER, book seats and confirm the returned ticket appears in **My trips**.
6. Edit passenger details to load an individual booking and update it; cancel another booking; use **Delete booking** to verify the backend's DELETE soft-cancel alias.
7. Verify an invalid login shows the backend message, a non-admin receives a 403 for admin operations, and a stopped backend displays a connection error.

The frontend uses these existing backend DTOs: registration `{fullName,email,password}`, login `{email,password}`, bus request `{busNumber,operatorName,source,destination,departureDateTime,arrivalDateTime,totalSeats,farePerSeat}`, booking request `{busId,passengerName,passengerAge,seatNumbers}`, booking update `{passengerName,passengerAge}`. The auth response is `{token,email,fullName,role}`.
