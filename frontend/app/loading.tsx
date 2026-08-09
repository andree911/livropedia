function CardSkeleton() {
  return (
    <div className="rounded border border-neutral-800 p-3">
      <div className="mb-2 h-48 w-full animate-pulse rounded bg-neutral-800" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <div className="h-10 min-w-0 flex-1 animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-36 animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-24 animate-pulse rounded bg-neutral-900" />
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
