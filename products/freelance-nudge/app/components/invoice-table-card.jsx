import { currency } from "../lib/api";

const statusBadgeClass = (lateDays) => {
  if (lateDays >= 30) return "bg-rose-700";
  if (lateDays >= 7) return "bg-amber-700";
  return "bg-emerald-700";
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
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Outstanding Invoices</h2>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={overdueOnly} onChange={(e) => onToggleOverdueOnly(e.target.checked)} />Overdue only</label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="rounded border border-slate-600 bg-slate-950 p-1">
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
          <thead className="text-left text-indigo-200/80">
            <tr>
              <th className="pb-2">Client</th><th className="pb-2">Invoice</th><th className="pb-2">Amount</th><th className="pb-2">Days Late</th><th className="pb-2">Status</th><th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const late = Number(invoice.lateDays ?? 0);
              return (
                <tr key={invoice.id} className="border-t border-slate-800">
                  <td className="py-2">{invoice.clientName}</td>
                  <td className="py-2">#{invoice.invoiceNumber}</td>
                  <td className="py-2">{currency(invoice.amount)}</td>
                  <td className="py-2">{late}</td>
                  <td className="py-2"><span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(late)}`}>{late >= 30 ? "Critical" : late >= 7 ? "Overdue" : "Due / Gentle"}</span></td>
                  <td className="py-2"><button className="rounded-md bg-indigo-500 px-2 py-1 text-xs font-semibold text-slate-950" onClick={() => onMarkPaid(invoice.id)}>Mark Paid</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!invoices.length && <p className="pt-3 text-sm text-indigo-100/70">No invoices to show.</p>}
      </div>
    </section>
  );
}
