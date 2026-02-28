import { currency } from "../lib/api";

export default function MetricsCard({ invoices, metrics }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          [invoices.length, "Open invoices"],
          [currency(metrics.total), "Total outstanding"],
          [currency(metrics.overdueAmount), "Overdue amount"],
          [metrics.avgLate.toFixed(1), "Avg days late"],
          [`${metrics.collectionScore}%`, "Collection score"]
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-600">{label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
