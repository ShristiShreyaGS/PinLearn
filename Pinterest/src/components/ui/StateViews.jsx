const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,23,54,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(11,23,54,0.3)]";

const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700";

export function EmptyState({ icon = "✦", title, description, actionLabel, onAction, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60 ${className}`}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-xl text-blue-700 dark:bg-slate-800 dark:text-blue-300"
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className={`mt-6 ${primaryButton}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry, className = "" }) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900 dark:bg-red-950/40 ${className}`}
    >
      <h2 className="text-lg font-bold text-red-800 dark:text-red-200">{title}</h2>
      {message && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={`mt-5 ${secondaryButton}`}>
          Try again
        </button>
      )}
    </div>
  );
}
