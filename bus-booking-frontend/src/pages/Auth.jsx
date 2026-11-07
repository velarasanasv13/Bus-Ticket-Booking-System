import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth.jsx';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!isLogin && f.password.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    try {
      const res = isLogin ? await api.login({ email: f.email, password: f.password }) : await api.register(f);
      signIn(res); nav(state?.from || '/', { replace: true });
    } catch (x) { setErr(x.message || 'The request could not be completed.'); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <aside className="auth-art">
        <h2>{isLogin ? 'Welcome back.' : 'Your next trip starts here.'}</h2>
        <p>{isLogin ? 'Log in to see your tickets, change passenger details or cancel a trip.' : 'Create an account to pick seats and keep every ticket in one place.'}</p>
        <svg viewBox="0 0 300 80" className="mini-route" aria-hidden="true"><path d="M10 60 C 80 10, 150 90, 290 20" /><circle cx="10" cy="60" r="6"/><circle cx="290" cy="20" r="6"/></svg>
      </aside>
      <form className="card auth-form" onSubmit={submit}>
        <h1>{isLogin ? 'Log in' : 'Create account'}</h1>
        {!isLogin && <label>Full name<input required value={f.fullName} onChange={set('fullName')} autoComplete="name" /></label>}
        <label>Email<input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<input required type="password" value={f.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
        {err && <div className="alert" role="alert">{err}</div>}
        <button className="btn solid lg" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
        <p className="muted center">{isLogin ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Log in</Link></>}</p>
      </form>
    </div>
  );
}
