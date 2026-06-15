"use client";

import { useState } from "react";

type DayBucket = { date: string; count: number };

interface Props {
  data: DayBucket[];
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function AnalyticsSparkline({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Clicks over time
      </p>

      <div className="relative flex h-16 items-end gap-[2px]">
        {data.map((d, i) => {
          const heightPct = Math.max(
            (d.count / max) * 100,
            d.count > 0 ? 8 : 2,
          );
          const isHovered = hovered === i;

          return (
            <div
              key={d.date}
              className="relative flex-1"
              style={{ height: "100%" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
                  role="tooltip"
                >
                  <span className="font-medium">{d.count}</span>
                  <span className="ml-1 text-muted-foreground">
                    {d.count === 1 ? "click" : "clicks"}
                  </span>
                  <div className="mt-0.5 text-muted-foreground">
                    {formatDate(d.date)}
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
                </div>
              )}

              {/* Bar */}
              <div
                className="absolute bottom-0 w-full rounded-t-sm transition-colors"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor:
                    d.count === 0
                      ? "hsl(var(--primary) / 0.15)"
                      : isHovered
                        ? "hsl(var(--primary) / 0.7)"
                        : "hsl(var(--primary))",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
