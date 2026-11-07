import http from './axios';

export const createBooking = (request) => http.post('/bookings', request);
export const getMyBookings = () => http.get('/bookings/my');
export const getBooking = (id) => http.get(`/bookings/${id}`);
export const updateBooking = (id, request) => http.put(`/bookings/${id}`, request);
export const cancelBooking = (id) => http.patch(`/bookings/${id}/cancel`);
export const deleteBooking = (id) => http.delete(`/bookings/${id}`);
