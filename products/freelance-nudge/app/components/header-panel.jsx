export default function HeaderPanel({ invoicesCount, freeLimit, apiState, status, onOpenPro }) {
  const left = Math.max(freeLimit - invoicesCount, 0);

  return (
    <header className="rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-6 text-center shadow-xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Onlook-native Next.js + Tailwind</p>
      <h1 className="mt-2 text-4xl font-bold">Freelance Nudge</h1>
      <p className="mt-2 text-indigo-100/80">Track invoices and send better reminders faster.</p>
      <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs ${apiState === "API online" ? "bg-emerald-900 text-emerald-200" : "bg-rose-900 text-rose-200"}`}>{apiState}</span>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-indigo-500/50 bg-slate-950/60 p-3 text-sm">
        <span>Free plan: {invoicesCount}/{freeLimit} invoices used ({left} left)</span>
        <button className="rounded-md bg-indigo-500 px-3 py-1.5 text-slate-950 font-semibold" onClick={onOpenPro}>See Pro features</button>
      </div>
      {status && <p className="mt-3 rounded-lg border border-rose-700 bg-rose-950/60 p-2 text-sm text-rose-200">{status}</p>}
    </header>
  );
}
