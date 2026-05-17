// Player Results — live and previous Thai 2D results, pulled from
// api.thaistock2d.com (free, no key). Fetches are revalidated so the page
// stays fast and the upstream API is not hammered.

type LiveResp = {
  live?: { twod?: string; date?: string; time?: string };
  result?: { open_time?: string; twod?: string }[];
  holiday?: { status?: string; name?: string };
};
type HistoryResp = { date?: string; child?: { time?: string; twod?: string }[] }[];

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

export default async function ResultsPage() {
  const [live, history] = await Promise.all([
    getJson<LiveResp>('https://api.thaistock2d.com/live', 60),
    getJson<HistoryResp>('https://api.thaistock2d.com/2d_result', 300),
  ]);

  const liveNumber =
    live?.live?.twod && live.live.twod !== '--' ? live.live.twod : null;
  const todayDraws = (live?.result ?? []).map((r) => ({
    time: (r.open_time ?? '').slice(0, 5),
    twod: r.twod ?? '--',
  }));
  const holidayName =
    live?.holiday?.status && live.holiday.status !== '1' ? live.holiday.name : null;
  const days = (history ?? []).map((d) => ({
    date: d.date ?? '',
    draws: (d.child ?? []).map((c) => ({
      time: (c.time ?? '').slice(0, 5),
      twod: c.twod ?? '--',
    })),
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold">Results</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">
          Live{live?.live?.date ? ` · ${live.live.date}` : ''}
        </h2>
        {liveNumber ? (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
            <p className="text-xs text-gray-500">Live 2D</p>
            <p className="text-4xl font-bold tracking-widest text-accent">{liveNumber}</p>
          </div>
        ) : (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
            {holidayName ? `Market closed — ${holidayName}.` : 'Market closed.'} Latest
            completed draws below.
          </p>
        )}
        {todayDraws.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {todayDraws.map((d) => (
              <div key={d.time} className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">{d.time}</p>
                <p className="text-2xl font-bold tracking-widest text-accent">{d.twod}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">Previous Results</h2>
        {days.length === 0 ? (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
            Results are temporarily unavailable.
          </p>
        ) : (
          days.map((day) => (
            <div key={day.date} className="rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-sm font-medium">{day.date}</p>
              <div className="grid grid-cols-4 gap-1">
                {day.draws.map((d) => (
                  <div key={d.time} className="text-center">
                    <p className="text-[10px] text-gray-400">{d.time}</p>
                    <p className="text-lg font-bold tracking-wide text-gray-800">{d.twod}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
