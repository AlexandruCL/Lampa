export const TALK_TURNS_MAX = 5;
export const TALK_WINDOW_MS = 600_000;

/** Per site, the visitor's talk_turn rows in the window: $1 session_id, $2 window start. */
export const TALK_COUNT_SQL = `SELECT site_id, count(*)::int AS n
FROM interaction_events
WHERE kind = 'talk_turn' AND session_id = $1 AND ts > $2
GROUP BY site_id`;

/** Keeps rows in order; a talk_turn is kept while stored + kept-in-batch for its site is under the max. */
export function capTalkTurns<T extends { siteId: string; kind: string }>(rows: T[], counts: Map<string, number>): T[] {
  const kept = new Map<string, number>();
  return rows.filter((r) => {
    if (r.kind !== "talk_turn") return true;
    const n = (counts.get(r.siteId) ?? 0) + (kept.get(r.siteId) ?? 0);
    if (n >= TALK_TURNS_MAX) return false;
    kept.set(r.siteId, (kept.get(r.siteId) ?? 0) + 1);
    return true;
  });
}
