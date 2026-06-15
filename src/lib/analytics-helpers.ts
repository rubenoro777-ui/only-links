/**
 * Pure analytics transform functions.
 * No I/O, no side effects — safe to import from server or client code.
 */

export type DayBucket = { date: string; count: number };
export type BreakdownRow = { label: string; count: number };

/**
 * Count occurrences of a string field across rows, skipping nulls.
 * Returns the top N entries sorted descending.
 */
export function countBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  limit = 5,
): BreakdownRow[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const val = row[key];
    if (typeof val !== "string" || !val) continue;
    map[val] = (map[val] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

/**
 * Count distinct non-null visitor_ids.
 * Returns null when no visitor_id data exists yet (pre-enrichment rows).
 */
export function uniqueVisitorCount(
  rows: { visitor_id: string | null }[],
): number | null {
  const ids = new Set(rows.map((r) => r.visitor_id).filter(Boolean));
  return ids.size > 0 ? ids.size : null;
}

/**
 * Extract a clean domain from a Referer header value.
 * Returns null for direct traffic (no referrer).
 */
export function cleanReferrer(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.slice(0, 40);
  }
}

/**
 * Bucket clicks by calendar day for the last N days.
 * Days with no clicks get a count of 0 so the chart always spans the full range.
 */
export function clicksByDay(
  rows: { created_at: string }[],
  days = 30,
): DayBucket[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const map: Record<string, number> = {};
  for (const row of rows) {
    const d = new Date(row.created_at);
    if (d < cutoff) continue;
    const key = d.toISOString().slice(0, 10);
    map[key] = (map[key] ?? 0) + 1;
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: map[key] ?? 0 };
  });
}
