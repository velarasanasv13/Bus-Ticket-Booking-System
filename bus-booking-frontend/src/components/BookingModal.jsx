import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import { fmtTime, fmtDate, inr } from '../utils';
import Ticket from './Ticket.jsx';

export default function BookingModal({ bus, onClose, onBooked }) {
  const { user } = useAuth();
  const [sel, setSel] = useState([]);
  const [name, setName] = useState(user?.fullName || '');
  const [age, setAge] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const taken = bus.bookedSeats || [];
  const rows = Math.ceil(bus.totalSeats / 4);
  const toggle = (n) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length >= 6 ? s : [...s, n].sort((a, b) => a - b)));

  const seat = (n) => n > bus.totalSeats ? <span key={n} className="seat gap" /> : (
    <button key={n} type="button" disabled={taken.includes(n)} onClick={() => toggle(n)} aria-pressed={sel.includes(n)} aria-label={`Seat ${n}${taken.includes(n) ? ', booked' : ''}`}
      className={`seat ${taken.includes(n) ? 'taken' : ''} ${sel.includes(n) ? 'chosen' : ''}`}>{n}</button>
  );

  const confirm = async (e) => {
    e.preventDefault(); setErr('');
    if (!sel.length) return setErr('Select at least one seat.');
    setBusy(true);
    try { setDone(await api.book({ busId: bus.id, passengerName: name, passengerAge: Number(age), seatNumbers: sel })); onBooked(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Select seats">
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        {done ? (
          <div className="done">
            <h2>You're booked.</h2>
            <p className="muted">Your ticket is saved under My trips.</p>
            <Ticket b={done} />
            <div className="row-end"><Link to="/bookings" className="btn solid" onClick={onClose}>View my trips</Link><button className="btn ghost" onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <div className="pick">
            <div className="deck">
              <h2>{bus.source} to {bus.destination}</h2>
              <p className="muted">{bus.operatorName}, {fmtDate(bus.departureDateTime)}, departs {fmtTime(bus.departureDateTime)}</p>
              <div className="bus-body">
                <div className="driver" aria-hidden="true">Driver</div>
                <div className="grid">
                  {Array.from({ length: rows }, (_, r) => (
                    <div className="seat-row" key={r}>{seat(r * 4 + 1)}{seat(r * 4 + 2)}<span className="aisle" />{seat(r * 4 + 3)}{seat(r * 4 + 4)}</div>
                  ))}
                </div>
              </div>
              <div className="legend"><span><i className="seat sm" />Available</span><span><i className="seat sm chosen" />Yours</span><span><i className="seat sm taken" />Booked</span></div>
            </div>
            <form className="panel" onSubmit={confirm}>
              <h3>Passenger</h3>
              {!user ? (
                <div className="alert info">Please <Link to="/login" state={{ from: '/' }} onClick={onClose}>log in</Link> or <Link to="/register" onClick={onClose}>create an account</Link> to book seats.</div>
              ) : user.role !== 'ROLE_USER' ? (
                <div className="alert info">Booking is available to traveller accounts.</div>
              ) : (<>
                <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label>Age<input required type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} /></label>
              </>)}
              <div className="fare">
                <div><span className="muted">Seats</span><strong>{sel.length ? sel.join(', ') : 'None selected'}</strong></div>
                <div><span className="muted">{sel.length} × {inr(bus.farePerSeat)}</span><strong className="big">{inr(sel.length * bus.farePerSeat)}</strong></div>
              </div>
              {err && <div className="alert" role="alert">{err}</div>}
              <button className="btn solid lg" disabled={busy || user?.role !== 'ROLE_USER'}>{busy ? 'Booking…' : 'Confirm booking'}</button>
              <p className="muted small">You can book up to 6 seats at a time.</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
