import http from './axios';

export const getBuses = () => http.get('/buses', { requiresAuth: false });
export const getBus = (id) => http.get(`/buses/${id}`, { requiresAuth: false });
export const searchBuses = ({ source, destination, date }) =>
  http.get('/buses/search', { params: { source, destination, date }, requiresAuth: false });
export const createBus = (request) => http.post('/buses', request);
export const updateBus = (id, request) => http.put(`/buses/${id}`, request);
export const deleteBus = (id) => http.delete(`/buses/${id}`);
