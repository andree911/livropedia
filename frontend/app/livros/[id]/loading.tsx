export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-72 w-48 animate-pulse rounded bg-neutral-900" />
        <div className="w-full max-w-2xl space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-900" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-900" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-900" />
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-900" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse rounded bg-neutral-900" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-900" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-900" />
          </div>
        </div>
      </div>

      <div className="h-32 animate-pulse rounded border border-neutral-800 bg-neutral-900" />

      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-900" />
        <div className="h-20 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
        <div className="h-20 animate-pulse rounded border border-neutral-800 bg-neutral-900" />
      </div>
    </div>
  );
}
