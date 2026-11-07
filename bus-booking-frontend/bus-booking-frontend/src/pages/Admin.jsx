import { useEffect, useState } from 'react';
import { api } from '../api';
import { fmtTime, fmtDate, inr } from '../utils';

const blank = { busNumber: '', operatorName: '', source: '', destination: '', departureDateTime: '', arrivalDateTime: '', totalSeats: 40, farePerSeat: '' };

export default function Admin() {
  const [buses, setBuses] = useState([]);
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const load = async () => {
    setErr('');
    setLoading(true);
    try { setBuses(await api.buses()); }
    catch (x) { setErr(x.message || 'Unable to load buses.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (new Date(f.arrivalDateTime) <= new Date(f.departureDateTime)) return setErr('Arrival must be after departure.');
    const body = { busNumber: f.busNumber, operatorName: f.operatorName, source: f.source, destination: f.destination,
      totalSeats: Number(f.totalSeats), farePerSeat: Number(f.farePerSeat),
      departureDateTime: f.departureDateTime.slice(0, 16) + ':00', arrivalDateTime: f.arrivalDateTime.slice(0, 16) + ':00' };
    setSaving(true);
    try { await api.saveBus(body, editId); setF(blank); setEditId(null); await load(); }
    catch (x) { setErr(x.message || 'Unable to save bus.'); }
    finally { setSaving(false); }
  };
  const edit = (b) => { setEditId(b.id); window.scrollTo({ top: 0, behavior: 'smooth' });
    setF({ ...b, departureDateTime: b.departureDateTime.slice(0, 16), arrivalDateTime: b.arrivalDateTime.slice(0, 16) }); };
  const del = async (b) => { if (!window.confirm(`Delete ${b.busNumber}? This cannot be undone.`)) return;
    setDeleting(b.id);
    try { await api.deleteBus(b.id); await load(); }
    catch (x) { setErr(x.message || 'Unable to delete bus.'); }
    finally { setDeleting(null); } };

  return (
    <div className="wrap page">
      <h1>Manage buses</h1>
      <form className="card admin-form" onSubmit={submit}>
        <h3>{editId ? 'Edit bus' : 'Add a bus'}</h3>
        <div className="fields">
          <label>Bus number<input required value={f.busNumber} onChange={set('busNumber')} /></label>
          <label>Operator<input required value={f.operatorName} onChange={set('operatorName')} /></label>
          <label>From<input required value={f.source} onChange={set('source')} /></label>
          <label>To<input required value={f.destination} onChange={set('destination')} /></label>
          <label>Departure<input required type="datetime-local" value={f.departureDateTime} onChange={set('departureDateTime')} /></label>
          <label>Arrival<input required type="datetime-local" value={f.arrivalDateTime} onChange={set('arrivalDateTime')} /></label>
          <label>Total seats<input required type="number" min="1" max="60" value={f.totalSeats} onChange={set('totalSeats')} /></label>
          <label>Fare per seat (₹)<input required type="number" min="1" value={f.farePerSeat} onChange={set('farePerSeat')} /></label>
        </div>
        {err && <div className="alert" role="alert">{err}</div>}
        <div className="row-end">
          {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setF(blank); }}>Discard changes</button>}
          <button className="btn solid" disabled={saving}>{saving ? 'Saving…' : editId ? 'Save bus' : 'Add bus'}</button>
        </div>
      </form>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Bus</th><th>Route</th><th>Departs</th><th>Seats free</th><th>Fare</th><th></th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="6">Loading buses…</td></tr> : buses.map((b) => (
            <tr key={b.id}>
              <td><strong>{b.operatorName}</strong><br /><span className="muted">{b.busNumber}</span></td>
              <td>{b.source} to {b.destination}</td>
              <td>{fmtDate(b.departureDateTime)}, {fmtTime(b.departureDateTime)}</td>
              <td>{b.availableSeats}/{b.totalSeats}</td>
              <td>{inr(b.farePerSeat)}</td>
              <td className="acts"><button className="btn ghost sm" disabled={deleting !== null} onClick={() => edit(b)}>Edit</button><button className="btn danger sm" disabled={deleting !== null} onClick={() => del(b)}>{deleting === b.id ? 'Deleting…' : 'Delete'}</button></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
