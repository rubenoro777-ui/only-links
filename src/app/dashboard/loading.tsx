export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-muted" />
      <div className="h-64 animate-pulse rounded-xl border bg-muted" />
    </div>
  );
}
