export default function HeaderPanel({ invoicesCount, freeLimit, apiState, status, onOpenPro }) {
  const left = Math.max(freeLimit - invoicesCount, 0);

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Freelance Nudge</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Revenue follow-up, minus the chaos.</h1>
          <p className="mt-2 text-slate-600">Track invoices and generate reminders in a clean operational workflow.</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${apiState === "API online" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"}`}>{apiState}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <span>Free plan: <strong>{invoicesCount}/{freeLimit}</strong> invoices used ({left} left)</span>
        <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800" onClick={onOpenPro}>Upgrade</button>
      </div>

      {status && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{status}</p>}
    </header>
  );
}
