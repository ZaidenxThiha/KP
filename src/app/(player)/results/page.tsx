// Player Results — live + previous Thai 2D results (api.thaistock2d.com),
// shown as a card per draw: Set / Value / 2D.

type Draw = { time?: string; set?: string; value?: string; twod?: string };
type HistoryResp = { date?: string; child?: Draw[] }[];
type LiveResp = { server_time?: string };

const UA = 'guessing-game/1.0';

async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// "11:00:00" -> "11:00 AM"
function to12h(t: string): string {
  const [hStr, m = '00'] = t.split(':');
  const h = Number(hStr) || 0;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

const clean = (s?: string) => (s ?? '').replace(/,/g, '') || '--';

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-gray-700">{value}</p>
    </div>
  );
}

export default async function ResultsPage() {
  const [live, history] = await Promise.all([
    getJson<LiveResp>('https://api.thaistock2d.com/live', 60),
    getJson<HistoryResp>('https://api.thaistock2d.com/2d_result', 300),
  ]);

  const days = (history ?? []).slice(0, 12).map((d) => ({
    date: d.date ?? '',
    draws: d.child ?? [],
  }));

  const updated =
    live?.server_time ??
    (days[0] ? `${days[0].date} ${days[0].draws[days[0].draws.length - 1]?.time ?? ''}` : '');

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-gray-900">Results</h1>

      {updated && <p className="text-center text-xs text-gray-400">Updated: {updated}</p>}

      {days.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Results are temporarily unavailable.
        </p>
      )}

      {days.map((day, di) => (
        <section key={day.date || di} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {di === 0 ? 'Latest' : day.date}
          </h2>
          {day.draws.map((d, i) => (
            <div key={d.time || i} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-center text-sm font-semibold text-gray-500">
                {to12h(d.time ?? '')}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-gray-100 pt-2">
                <Cell label="Set" value={clean(d.set)} />
                <Cell label="Value" value={clean(d.value)} />
                <div className="text-center">
                  <p className="text-xs text-gray-400">2D</p>
                  <p className="text-2xl font-bold text-accent">{d.twod ?? '--'}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
