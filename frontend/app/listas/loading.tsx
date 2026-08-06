export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-40 animate-pulse rounded bg-neutral-900" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 animate-pulse rounded bg-neutral-800" />
              <div className="h-5 w-6 animate-pulse rounded bg-neutral-800" />
            </div>
            <div className="mt-4 flex -space-x-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 w-14 animate-pulse rounded border-2 border-neutral-950 bg-neutral-800"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
