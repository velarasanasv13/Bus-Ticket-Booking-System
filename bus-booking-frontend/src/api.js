import { dateStr } from './utils';
import * as authApi from './services/authApi';
import * as busApi from './services/busApi';
import * as bookingApi from './services/bookingApi';

localStorage.removeItem('bb_db');
const legacySession = localStorage.getItem('bb_user');
if (legacySession) {
  try {
    const session = JSON.parse(legacySession);
    if (session?.token && !session.token.startsWith('mock.') && !sessionStorage.getItem('bb_user')) {
      sessionStorage.setItem('bb_user', legacySession);
    }
  } catch {
    // Discard malformed legacy session data.
  }
  localStorage.removeItem('bb_user');
}

export const getSession = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem('bb_user'));
    if (session?.token?.startsWith('mock.')) {
      sessionStorage.removeItem('bb_user');
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem('bb_user');
    return null;
  }
};

export const api = {
  register: async (request) => (await authApi.register(request)).data,
  login: async (request) => (await authApi.login(request)).data,
  buses: async () => (await busApi.getBuses()).data,
  bus: async (id) => (await busApi.getBus(id)).data,
  search: async (query) => (await busApi.searchBuses(query)).data,
  saveBus: async (request, id) =>
    (await (id ? busApi.updateBus(id, request) : busApi.createBus(request))).data,
  deleteBus: async (id) => (await busApi.deleteBus(id)).data,
  book: async (request) => (await bookingApi.createBooking(request)).data,
  myBookings: async () => (await bookingApi.getMyBookings()).data,
  booking: async (id) => (await bookingApi.getBooking(id)).data,
  updateBooking: async (id, request) => (await bookingApi.updateBooking(id, request)).data,
  cancel: async (id) => (await bookingApi.cancelBooking(id)).data,
  deleteBooking: async (id) => (await bookingApi.deleteBooking(id)).data
};

export { dateStr };
