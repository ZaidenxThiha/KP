// Every user-facing timestamp renders in Myanmar time (Asia/Yangon, UTC+6:30),
// regardless of the viewer's device timezone or the server's.
const TZ = 'Asia/Yangon';

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "2026-05-18 10:45" — date + 24-hour time, Myanmar time.
export function mmDateTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d
    .toLocaleString('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(', ', ' ');
}

// "2026-05-18" — date only, Myanmar time.
export function mmDate(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// "10:45 AM" — time only, Myanmar time.
export function mmTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// "2026-05-18" — the current calendar date in Myanmar time. Use this instead of
// `new Date().toISOString().slice(0,10)`, which yields the UTC date and runs a
// day behind during the Myanmar evening.
export function mmToday(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
