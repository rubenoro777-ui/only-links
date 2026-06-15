export default function ProfileLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 py-12">
      <div className="size-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
      <div className="mt-8 w-full space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </main>
  );
}
