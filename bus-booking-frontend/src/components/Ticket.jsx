import { fmtTime, fmtDate, inr, dur } from '../utils';

export default function Ticket({ b, children }) {
  const cancelled = b.bookingStatus === 'CANCELLED';
  return (
    <article className={`ticket ${cancelled ? 'is-cancelled' : ''}`}>
      <div className="t-main">
        <div className="t-top">
          <span className="t-op">{b.operatorName} <span className="muted">{b.busNumber}</span></span>
          <span className={`badge ${cancelled ? 'bad' : 'ok'}`}>{cancelled ? 'Cancelled' : 'Confirmed'}</span>
        </div>
        <div className="t-route">
          <div><strong>{b.source}</strong><span>{fmtTime(b.departureDateTime)}, {fmtDate(b.departureDateTime)}</span></div>
          <div className="t-line"><span>{dur(b.departureDateTime, b.arrivalDateTime)}</span></div>
          <div className="end"><strong>{b.destination}</strong><span>{fmtTime(b.arrivalDateTime)}</span></div>
        </div>
        <dl className="t-meta">
          <div><dt>Passenger</dt><dd>{b.passengerName}, {b.passengerAge}</dd></div>
          <div><dt>Seats</dt><dd>{b.seatNumbers.join(', ')}</dd></div>
          <div><dt>Total fare</dt><dd>{inr(b.totalFare)}</dd></div>
        </dl>
        {children && <div className="t-actions">{children}</div>}
      </div>
      <div className="t-stub">
        <span className="muted">Booking ID</span>
        <strong className="ref">{b.bookingReference}</strong>
        <div className="barcode" aria-hidden="true">{[...b.bookingReference].map((c, i) => <i key={i} style={{ width: 2 + (c.charCodeAt(0) % 4) }} />)}</div>
      </div>
    </article>
  );
}
