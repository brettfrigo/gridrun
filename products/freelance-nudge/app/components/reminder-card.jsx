export default function ReminderCard({ invoices, selectedInvoice, onSelectInvoice, onGenerate, emailOutput, onEmailChange, onCopy }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Email generator</h2>
      <p className="mt-1 text-sm text-slate-600">Pick an invoice and generate a ready-to-send follow-up email.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={selectedInvoice} onChange={(e) => onSelectInvoice(e.target.value)} className="min-w-[260px] rounded-lg border border-slate-300 bg-white p-2 text-slate-800">
          <option value="">Select an invoice...</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.clientName} — #{i.invoiceNumber}</option>)}
        </select>
        <button disabled={!invoices.length} onClick={onGenerate} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Generate reminder</button>
        <button onClick={onCopy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Copy email</button>
      </div>
      <textarea value={emailOutput} onChange={(e) => onEmailChange(e.target.value)} rows={12} className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900" placeholder="Generated email will appear here..." />
    </section>
  );
}
