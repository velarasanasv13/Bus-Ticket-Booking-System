const p = (n) => String(n).padStart(2, '0');
export const localStamp = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
export const dateStr = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return localStamp(d).slice(0, 10); };
export const fmtTime = (s) => new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
export const fmtDate = (s) => new Date(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const dur = (a, b) => { const m = Math.round((new Date(b) - new Date(a)) / 60000); return `${Math.floor(m / 60)}h ${p(m % 60)}m`; };
export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
