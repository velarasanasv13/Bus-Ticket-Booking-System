import { createContext, useContext, useEffect, useState } from 'react';
import { getSession } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession());
  useEffect(() => {
    const clearSession = () => setUser(null);
    window.addEventListener('bb:unauthorized', clearSession);
    return () => window.removeEventListener('bb:unauthorized', clearSession);
  }, []);
  const signIn = (res) => {
    if (!res?.token || !res?.email || !res?.role) throw new Error('The server returned an invalid login response.');
    sessionStorage.setItem('bb_user', JSON.stringify(res));
    setUser(res);
  };
  const signOut = () => { sessionStorage.removeItem('bb_user'); setUser(null); };
  return <Ctx.Provider value={{ user, signIn, signOut, isAdmin: user?.role === 'ROLE_ADMIN' }}>{children}</Ctx.Provider>;
}
