// Synthetic email used for Supabase Auth — we never collect real emails.
// Pure helper (no server-only deps) so client components can import it too.
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@players.local`;
}
