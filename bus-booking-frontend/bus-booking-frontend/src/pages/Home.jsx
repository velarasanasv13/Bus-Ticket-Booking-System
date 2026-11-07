import { useState, useEffect } from 'react';
import { api, dateStr } from '../api';
import { fmtTime, fmtDate, dur, inr } from '../utils';
import BookingModal from '../components/BookingModal.jsx';

const POPULAR = [['Chennai', 'Bengaluru'], ['Chennai', 'Madurai'], ['Chennai', 'Coimbatore'], ['Bengaluru', 'Hyderabad']];

export default function Home() {
  const [q, setQ] = useState({ source: 'Chennai', destination: 'Bengaluru', date: dateStr(1) });
  const [buses, setBuses] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pick, setPick] = useState(null);
  const [pickBusy, setPickBusy] = useState(null);

  const run = async (query) => {
    setBusy(true); setErr('');
    try { setBuses(await api.search(query)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  useEffect(() => { run(q); }, []); // eslint-disable-line
  const submit = (e) => { e.preventDefault(); run(q); };
  const swap = () => setQ({ ...q, source: q.destination, destination: q.source });
  const selectBus = async (id) => {
    setErr('');
    setPickBusy(id);
    try { setPick(await api.bus(id)); }
    catch (x) { setErr(x.message || 'Unable to load bus details.'); }
    finally { setPickBusy(null); }
  };

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Pick your seat.<br />Know your fare.</h1>
          <p>Overnight sleepers, morning express and everything in between. Search a route, tap a seat, and your ticket is ready.</p>
        </div>
        <svg className="route-art" viewBox="0 0 600 220" aria-hidden="true">
          <path d="M30 170 C 160 20, 300 230, 570 50" className="route-line" />
          <circle cx="30" cy="170" r="9" className="city" /><circle cx="570" cy="50" r="9" className="city" />
          <g className="bus-dot"><circle r="16" className="halo" /><circle r="8" /></g>
        </svg>
        <form className="search card" onSubmit={submit}>
          <label>From<input required value={q.source} onChange={(e) => setQ({ ...q, source: e.target.value })} list="cities" /></label>
          <button type="button" className="swap" onClick={swap} aria-label="Swap cities">⇄</button>
          <label>To<input required value={q.destination} onChange={(e) => setQ({ ...q, destination: e.target.value })} list="cities" /></label>
          <label>Travel date<input required type="date" min={dateStr(0)} value={q.date} onChange={(e) => setQ({ ...q, date: e.target.value })} /></label>
          <button className="btn solid lg" disabled={busy}>{busy ? 'Searching…' : 'Search buses'}</button>
          <datalist id="cities">{['Chennai', 'Bengaluru', 'Madurai', 'Coimbatore', 'Hyderabad'].map((c) => <option key={c} value={c} />)}</datalist>
        </form>
        <div className="chips">
          {POPULAR.map(([s, d]) => (
            <button key={s + d} className="chip" onClick={() => { const n = { ...q, source: s, destination: d }; setQ(n); run(n); }}>{s} to {d}</button>
          ))}
        </div>
      </section>

      <section className="wrap results">
        {err && <div className="alert">{err}</div>}
        {buses && (
          <h2 className="res-title">{buses.length ? `${buses.length} bus${buses.length > 1 ? 'es' : ''}` : 'No buses'} from {q.source} to {q.destination}
            <span className="muted"> on {fmtDate(q.date + 'T00:00')}</span></h2>
        )}
        {buses && !buses.length && <div className="empty card">Nothing is running on this route for that date. Try another day or one of the popular routes above.</div>}
        {buses?.map((b) => (
          <article className="bus card" key={b.id}>
            <div className="bus-id"><h3>{b.operatorName}</h3><span className="muted">{b.busNumber}</span></div>
            <div className="timeline">
              <div><strong>{fmtTime(b.departureDateTime)}</strong><span>{b.source}</span></div>
              <div className="line"><span>{dur(b.departureDateTime, b.arrivalDateTime)}</span></div>
              <div className="end"><strong>{fmtTime(b.arrivalDateTime)}</strong><span>{b.destination}</span></div>
            </div>
            <div className="bus-fare">
              <strong>{inr(b.farePerSeat)}</strong><span className="muted">per seat</span>
              <span className={`seats-left ${b.availableSeats < 8 ? 'low' : ''}`}>{b.availableSeats === 0 ? 'Sold out' : `${b.availableSeats} seats left`}</span>
            </div>
            <button className="btn solid" disabled={!b.availableSeats || pickBusy !== null} onClick={() => selectBus(b.id)}>
              {pickBusy === b.id ? 'Loading…' : 'Select seats'}
            </button>
          </article>
        ))}
      </section>
      {pick && <BookingModal bus={pick} onClose={() => setPick(null)} onBooked={() => run(q)} />}
    </>
  );
}
