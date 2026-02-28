import { currency } from "../lib/api";

const statusBadgeClass = (lateDays) => {
  if (lateDays >= 30) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (lateDays >= 7) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
};

export default function InvoiceTableCard({
  invoices,
  overdueOnly,
  onToggleOverdueOnly,
  sortBy,
  onSortChange,
  onMarkPaid
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Outstanding invoices</h2>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => onToggleOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-800">
            <option value="late-desc">Most overdue</option>
            <option value="late-asc">Least overdue</option>
            <option value="amount-desc">Amount high → low</option>
            <option value="amount-asc">Amount low → high</option>
            <option value="due-asc">Due date soonest</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Client</th><th className="pb-2 font-medium">Invoice</th><th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Days late</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const late = Number(invoice.lateDays ?? 0);
              return (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="py-2.5 text-slate-900">{invoice.clientName}</td>
                  <td className="py-2.5 text-slate-700">#{invoice.invoiceNumber}</td>
                  <td className="py-2.5 text-slate-900">{currency(invoice.amount)}</td>
                  <td className="py-2.5 text-slate-700">{late}</td>
                  <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ring-1 ${statusBadgeClass(late)}`}>{late >= 30 ? "Critical" : late >= 7 ? "Overdue" : "Due"}</span></td>
                  <td className="py-2.5"><button className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => onMarkPaid(invoice.id)}>Mark paid</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!invoices.length && <p className="pt-4 text-sm text-slate-500">No invoices to show.</p>}
      </div>
    </section>
  );
}
