// Placeholder blocks shown while data loads; keeps layout stable and avoids a blank "Loading..." flash.
export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6, label = "Loading", gridClassName }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div
        className={
          gridClassName ||
          "grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5"
        }
      >
        {Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="mb-8">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-10 w-64 max-w-full" />
    </div>
  );
}
