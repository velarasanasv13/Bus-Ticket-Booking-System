import http from './axios';

export const register = (request) => http.post('/auth/register', request, { requiresAuth: false });
export const login = (request) => http.post('/auth/login', request, { requiresAuth: false });
