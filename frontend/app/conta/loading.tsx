export default function Loading() {
  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded bg-neutral-900" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-900" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-6">
        <div className="h-4 w-56 animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-6">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
      </div>
    </div>
  );
}
