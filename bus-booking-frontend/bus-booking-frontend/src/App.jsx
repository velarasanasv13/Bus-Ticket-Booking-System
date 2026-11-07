import { Routes, Route, Navigate, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ admin, children }) {
  const { user, isAdmin } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand" aria-label="Routewise home">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="4" width="26" height="20" rx="6" fill="#FFB703"/><rect x="7" y="8" width="18" height="8" rx="2" fill="#0A2E36"/><circle cx="10" cy="21" r="2" fill="#0A2E36"/><circle cx="22" cy="21" r="2" fill="#0A2E36"/><rect x="8" y="26" width="5" height="3" rx="1" fill="#FFB703"/><rect x="19" y="26" width="5" height="3" rx="1" fill="#FFB703"/></svg>
          Routewise
        </Link>
        <nav className="links">
          <NavLink to="/" end>Find buses</NavLink>
          {user && <NavLink to="/bookings">My trips</NavLink>}
          {isAdmin && <NavLink to="/admin">Manage buses</NavLink>}
        </nav>
        <div className="who">
          {user ? (<><span className="avatar">{user.fullName?.[0]?.toUpperCase()}</span><span className="hide-sm">{user.fullName}</span><button className="btn ghost sm" onClick={signOut}>Log out</button></>)
            : (<><Link className="btn ghost sm" to="/login">Log in</Link><Link className="btn solid sm" to="/register">Sign up</Link></>)}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/bookings" element={<Guard><MyBookings /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="foot">© {new Date().getFullYear()} Routewise. Tickets are confirmed instantly. Payments are not part of this version.</footer>
    </>
  );
}
