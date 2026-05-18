// GET /api/v1/results/live — server-side proxy of api.thaistock2d.com/live.
// Adds the User-Agent the upstream requires and avoids browser CORS, so the
// Results page can poll it. The upstream call is cached 10s to stay light
// when many players are watching at once.
export async function GET() {
  try {
    const upstream = await fetch('https://api.thaistock2d.com/live', {
      headers: { 'User-Agent': 'guessing-game/1.0', Accept: 'application/json' },
      next: { revalidate: 10 },
    });
    if (!upstream.ok) {
      return Response.json({ error: 'upstream_error' }, { status: 502 });
    }
    return Response.json(await upstream.json());
  } catch {
    return Response.json({ error: 'unreachable' }, { status: 502 });
  }
}
