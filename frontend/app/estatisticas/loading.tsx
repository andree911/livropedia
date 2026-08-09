export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-40 animate-pulse rounded bg-neutral-900" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded border border-neutral-800 p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
        ))}
      </div>

      <div className="h-40 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
    </div>
  );
}
