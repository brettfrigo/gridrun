import { currency } from "../lib/api";

export default function MetricsCard({ invoices, metrics }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="mb-3 text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {[
          [invoices.length, "Open Invoices"],
          [currency(metrics.total), "Total Outstanding"],
          [currency(metrics.overdueAmount), "Overdue Amount"],
          [metrics.avgLate.toFixed(1), "Avg Days Late"],
          [`${metrics.collectionScore}%`, "Collection Score"]
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-indigo-200/80">{label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
