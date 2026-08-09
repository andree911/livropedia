export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-neutral-900" />

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="rounded border border-neutral-800 p-3">
            <div className="flex gap-3">
              <div className="h-24 w-16 shrink-0 animate-pulse rounded bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
