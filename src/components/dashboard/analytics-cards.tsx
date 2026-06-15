import type { BreakdownRow } from "@/lib/analytics-helpers";

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: number | null;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-2xl font-bold tabular-nums">
        {value === null ? (
          <span className="text-muted-foreground">{"--"}</span>
        ) : (
          value
        )}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BreakdownList
// ---------------------------------------------------------------------------

interface BreakdownListProps {
  title: string;
  rows: BreakdownRow[];
}

export function BreakdownList({ title, rows }: BreakdownListProps) {
  if (rows.length === 0) return null;
  const max = rows[0].count;

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      <ul className="space-y-2">
        {rows.map(({ label, count }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-28 truncate text-right text-xs text-muted-foreground">
              {label}
            </span>
            <span className="w-6 text-right text-xs font-medium tabular-nums">
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
