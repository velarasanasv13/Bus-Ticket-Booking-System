import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Ticket from '../components/Ticket.jsx';

export default function MyBookings() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const load = async () => {
    setErr('');
    setLoading(true);
    try { setList(await api.myBookings()); }
    catch (x) { setErr(x.message || 'Unable to load bookings.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking ${b.bookingReference}? Seats ${b.seatNumbers.join(', ')} will be released.`)) return;
    setBusyId(b.id);
    try { await api.cancel(b.id); await load(); }
    catch (x) { setErr(x.message || 'Unable to cancel booking.'); }
    finally { setBusyId(null); }
  };
  const save = async (e) => {
    e.preventDefault();
    setBusyId(edit.id);
    try {
      await api.updateBooking(edit.id, { passengerName: edit.passengerName, passengerAge: Number(edit.passengerAge) });
      setEdit(null);
      await load();
    } catch (x) { setErr(x.message || 'Unable to update booking.'); }
    finally { setBusyId(null); }
  };
  const startEdit = async (id) => {
    setErr('');
    setBusyId(id);
    try {
      const booking = await api.booking(id);
      setEdit({ id: booking.id, passengerName: booking.passengerName, passengerAge: booking.passengerAge });
    } catch (x) { setErr(x.message || 'Unable to load booking details.'); }
    finally { setBusyId(null); }
  };
  const remove = async (b) => {
    if (!window.confirm(`Delete booking ${b.bookingReference}? This releases its seats.`)) return;
    setBusyId(b.id);
    try { await api.deleteBooking(b.id); await load(); }
    catch (x) { setErr(x.message || 'Unable to delete booking.'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="wrap page">
      <h1>My trips</h1>
      {err && <div className="alert">{err}</div>}
      {loading && <p className="muted">Loading your tickets…</p>}
      {!loading && !err && list?.length === 0 && <div className="empty card">You haven't booked anything yet. <Link to="/">Find a bus</Link></div>}
      {!loading && list?.map((b) => (
        <Ticket key={b.id} b={b}>
          {b.bookingStatus !== 'CANCELLED' && (edit?.id === b.id ? (
            <form className="inline-edit" onSubmit={save}>
              <input required aria-label="Passenger name" value={edit.passengerName} onChange={(e) => setEdit({ ...edit, passengerName: e.target.value })} />
              <input required aria-label="Age" type="number" min="1" max="120" value={edit.passengerAge} onChange={(e) => setEdit({ ...edit, passengerAge: e.target.value })} />
              <button className="btn solid sm" disabled={busyId === b.id}>{busyId === b.id ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn ghost sm" disabled={busyId === b.id} onClick={() => setEdit(null)}>Discard</button>
            </form>
          ) : (<>
            <button className="btn ghost sm" disabled={busyId !== null} onClick={() => startEdit(b.id)}>{busyId === b.id ? 'Loading…' : 'Edit passenger'}</button>
            <button className="btn danger sm" disabled={busyId !== null} onClick={() => cancel(b)}>{busyId === b.id ? 'Working…' : 'Cancel booking'}</button>
            <button className="btn ghost sm" disabled={busyId !== null} onClick={() => remove(b)}>Delete booking</button>
          </>))}
        </Ticket>
      ))}
    </div>
  );
}
