export default function Loading() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="h-7 w-28 animate-pulse rounded bg-neutral-900" />

      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />
      </div>

      <div className="h-10 w-full animate-pulse rounded bg-neutral-900" />

      <div className="h-4 w-40 animate-pulse rounded bg-neutral-900" />
    </div>
  );
}
