'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';

type Round = {
  id: string;
  game_type: string;
  round_name: string;
  close_time: string;
  status: string;
};

type Winner = {
  username: string;
  guess_number: string;
  points_used: number;
  payout: number;
};

type Summary = {
  round_id: string;
  bet_count: number;
  total_staked: number;
  total_paid: number;
  house_win: number;
  winners: Winner[];
};

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN_PRIMARY =
  'rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';
const BTN_GHOST =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50';

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? 'border-accent/30 bg-accent/5' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? 'text-accent' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [gameType, setGameType] = useState('2d');
  const [roundName, setRoundName] = useState('evening');
  const [closeAt, setCloseAt] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/rounds/today');
    const data = await res.json();
    setRounds(data.rounds ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createRound() {
    if (!closeAt) return setNote('Pick a close time.');
    const res = await fetch('/api/v1/admin/rounds/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        round_name: roundName,
        round_date: new Date().toISOString().slice(0, 10),
        close_time: new Date(closeAt).toISOString(),
      }),
    });
    const data = await res.json();
    setNote(res.ok ? 'Round created.' : (data.error?.message ?? 'Failed.'));
    if (res.ok) load();
  }

  async function setResult(roundId: string) {
    const res = await fetch('/api/v1/admin/rounds/override-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: roundId, result_number: results[roundId] ?? '' }),
    });
    const data = await res.json();
    setNote(res.ok ? 'Result recorded.' : (data.error?.message ?? 'Failed.'));
    if (res.ok) load();
  }

  async function approve(roundId: string) {
    const res = await fetch('/api/v1/admin/rounds/approve-settlement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: roundId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Settled: ${data.won} won, ${data.lost} lost, ${data.total_paid} pts paid.`
        : (data.error?.message ?? 'Failed.'),
    );
    if (res.ok) load();
  }

  async function viewBets(roundId: string) {
    setSummary(null);
    const res = await fetch(`/api/v1/admin/rounds/summary?round_id=${roundId}`);
    const data = await res.json();
    if (res.ok) setSummary({ round_id: roundId, ...data });
    else setNote(data.error?.message ?? 'Could not load bets.');
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Rounds</h1>

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Create a round</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Game
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className={`${INPUT} w-full`}
            >
              <option value="2d">2D</option>
              <option value="3d">3D</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Name
            <input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className={`${INPUT} w-full`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Closes
            <input
              type="datetime-local"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              className={`${INPUT} w-full`}
            />
          </label>
          <button onClick={createRound} className={`${BTN_PRIMARY} sm:self-end`}>
            Create round
          </button>
        </div>
      </section>

      {note && (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {note}
        </p>
      )}

      <DataTable<Round>
        rows={rounds}
        rowKey={(r) => r.id}
        empty="No rounds today."
        columns={[
          {
            header: 'Game',
            cell: (r) => <span className="font-medium uppercase text-gray-900">{r.game_type}</span>,
          },
          { header: 'Name', cell: (r) => r.round_name },
          {
            header: 'Status',
            cell: (r) => <span className="capitalize text-gray-500">{r.status}</span>,
          },
          {
            header: 'Settle',
            cell: (r) =>
              r.status === 'resulted' || r.status === 'cancelled' ? (
                <span className="text-gray-400">Done</span>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2 md:justify-start">
                  <input
                    placeholder="result"
                    value={results[r.id] ?? ''}
                    onChange={(e) => setResults({ ...results, [r.id]: e.target.value })}
                    className={`${INPUT} w-20`}
                  />
                  <button onClick={() => setResult(r.id)} className={BTN_GHOST}>
                    Set result
                  </button>
                  <button onClick={() => approve(r.id)} className={BTN_PRIMARY}>
                    Approve &amp; settle
                  </button>
                </div>
              ),
          },
          {
            header: 'Bets',
            cell: (r) => (
              <button onClick={() => viewBets(r.id)} className={BTN_GHOST}>
                View bets
              </button>
            ),
          },
        ]}
      />

      {summary && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Round bets</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat label="Bets" value={summary.bet_count} />
            <Stat label="Staked" value={summary.total_staked} />
            <Stat label="Paid out" value={summary.total_paid} />
            <Stat label="House win" value={summary.house_win} highlight />
          </div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Winners ({summary.winners.length})
          </h3>
          {summary.winners.length === 0 ? (
            <p className="text-sm text-gray-500">No winners on this round.</p>
          ) : (
            <DataTable<Winner>
              rows={summary.winners}
              rowKey={(w) => `${w.username}-${w.guess_number}-${w.points_used}`}
              columns={[
                {
                  header: 'Player',
                  cell: (w) => <span className="font-medium text-gray-900">{w.username}</span>,
                },
                {
                  header: 'Number',
                  cell: (w) => <span className="tracking-widest">{w.guess_number}</span>,
                },
                { header: 'Stake', align: 'right', cell: (w) => w.points_used.toLocaleString() },
                {
                  header: 'Payout',
                  align: 'right',
                  cell: (w) => (
                    <span className="font-semibold text-green-700">
                      {w.payout.toLocaleString()}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}
