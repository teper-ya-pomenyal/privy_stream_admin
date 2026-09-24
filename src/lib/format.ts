export const pad2 = (n: number) => String(n).padStart(2, '0');

export function fmtDuration(ms: number | null | undefined) {
  if (!ms || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fmtClock(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function fmtRelative(ts: number, now = Date.now()) {
  const diff = Math.round((ts - now) / 1000);
  const abs = Math.abs(diff);
  const unit = abs < 60 ? `${abs} с` : abs < 3600 ? `${Math.round(abs / 60)} мин` : abs < 86400 ? `${Math.round(abs / 3600)} ч` : `${Math.round(abs / 86400)} д`;
  return diff >= 0 ? `через ${unit}` : `${unit} назад`;
}

// f7a2c91e-… → f7a2…c91e
export function shortId(id: string | undefined) {
  if (!id) return '—';
  const hex = id.replace(/-/g, '');
  return hex.length > 10 ? `${hex.slice(0, 4)}…${hex.slice(-4)}` : id;
}

export function hueOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function initials(s: string) {
  const words = s.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

// plural(3, ['трек', 'трека', 'треков'])
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function ageFrom(birthDate: string | undefined, now = new Date()) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}
