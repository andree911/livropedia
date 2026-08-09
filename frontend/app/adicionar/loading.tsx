export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-neutral-900" />
        <div className="h-4 w-64 animate-pulse rounded bg-neutral-900" />
      </div>

      <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />

      <ul className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded border border-neutral-800 p-3">
            <div className="h-16 w-11 shrink-0 animate-pulse rounded bg-neutral-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-800" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
