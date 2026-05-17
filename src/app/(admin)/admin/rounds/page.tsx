'use client';

import { useCallback, useEffect, useState } from 'react';

type Round = {
  id: string;
  game_type: string;
  round_name: string;
  close_time: string;
  status: string;
};

type Summary = {
  round_id: string;
  bet_count: number;
  total_staked: number;
  total_paid: number;
  house_win: number;
  winners: { username: string; guess_number: string; points_used: number; payout: number }[];
};

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md p-2 ${highlight ? 'bg-accent/10' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold ${highlight ? 'text-accent' : ''}`}>{value.toLocaleString()}</p>
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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Rounds</h1>

      <section className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm">
          Game
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5"
          >
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </label>
        <label className="text-sm">
          Name
          <input
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          Closes
          <input
            type="datetime-local"
            value={closeAt}
            onChange={(e) => setCloseAt(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <button
          onClick={createRound}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
        >
          Create round
        </button>
      </section>

      {note && <p className="rounded-md bg-gray-100 p-3 text-sm">{note}</p>}

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Game</th>
            <th className="p-3">Name</th>
            <th className="p-3">Status</th>
            <th className="p-3">Settle</th>
            <th className="p-3">Bets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rounds.map((r) => (
            <tr key={r.id}>
              <td className="p-3 font-medium uppercase">{r.game_type}</td>
              <td className="p-3">{r.round_name}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3">
                {r.status === 'resulted' || r.status === 'cancelled' ? (
                  <span className="text-gray-400">done</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      placeholder="result"
                      value={results[r.id] ?? ''}
                      onChange={(e) => setResults({ ...results, [r.id]: e.target.value })}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1"
                    />
                    <button
                      onClick={() => setResult(r.id)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      Set result
                    </button>
                    <button
                      onClick={() => approve(r.id)}
                      className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-fg"
                    >
                      Approve &amp; settle
                    </button>
                  </div>
                )}
              </td>
              <td className="p-3">
                <button
                  onClick={() => viewBets(r.id)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  View bets
                </button>
              </td>
            </tr>
          ))}
          {rounds.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No rounds today.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {summary && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Round bets</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Bets" value={summary.bet_count} />
            <Stat label="Staked" value={summary.total_staked} />
            <Stat label="Paid to winners" value={summary.total_paid} />
            <Stat label="House win" value={summary.house_win} highlight />
          </div>
          <h3 className="text-sm font-semibold text-gray-500">
            Winners ({summary.winners.length})
          </h3>
          {summary.winners.length === 0 ? (
            <p className="text-sm text-gray-500">No winners on this round.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Player</th>
                  <th className="py-1">Number</th>
                  <th className="py-1">Stake</th>
                  <th className="py-1">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.winners.map((w, i) => (
                  <tr key={i}>
                    <td className="py-1 font-medium">{w.username}</td>
                    <td className="py-1 tracking-widest">{w.guess_number}</td>
                    <td className="py-1">{w.points_used.toLocaleString()}</td>
                    <td className="py-1 font-semibold text-green-700">
                      {w.payout.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
