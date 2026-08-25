import "./PageBackdrop.css";

function PageBackdrop({ children, className = "" }) {
  return (
    <div
      className={`page-backdrop relative isolate min-h-[100vh] w-full overflow-hidden ${className}`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-24 z-0 h-[420px] w-[520px] rotate-[-12deg] rounded-[43%_57%_62%_38%/38%_45%_55%_62%] bg-[#dbeafe]/70 dark:bg-blue-950/40" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-[-80px] z-0 h-[430px] w-[500px] rotate-[18deg] rounded-[58%_42%_36%_64%/54%_36%_64%_46%] bg-[#e0e7ff]/75 dark:bg-indigo-950/40" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-180px] left-[28%] z-0 h-[390px] w-[680px] rotate-[-7deg] rounded-[55%_45%_42%_58%/48%_58%_42%_52%] bg-[#f1ede4]/80 dark:bg-slate-800/50" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-44 z-0 h-28 w-28 rounded-full border border-blue-300/30 dark:border-blue-300/10" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[12%] bottom-32 z-0 h-40 w-40 rounded-full border border-slate-300/40 dark:border-slate-500/20" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[9%] top-40 z-10 select-none text-4xl opacity-25 grayscale">☕</div>
      <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-48 z-10 select-none text-5xl font-light text-blue-900/15 dark:text-blue-200/15">◌</div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-36 left-[10%] z-10 select-none text-5xl text-slate-500/15">▤</div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-20 right-[10%] z-10 select-none text-4xl text-blue-900/15 dark:text-blue-200/15">✦</div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PageBackdrop;
