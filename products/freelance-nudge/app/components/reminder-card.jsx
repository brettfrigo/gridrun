export default function ReminderCard({ invoices, selectedInvoice, onSelectInvoice, onGenerate, emailOutput, onEmailChange, onCopy }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-xl font-semibold">Email Generator</h2>
      <p className="mt-1 text-sm text-indigo-100/80">Pick an invoice and generate a ready-to-send follow-up email.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={selectedInvoice} onChange={(e) => onSelectInvoice(e.target.value)} className="min-w-[260px] rounded-md border border-slate-600 bg-slate-950 p-2">
          <option value="">Select an invoice...</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.clientName} — #{i.invoiceNumber}</option>)}
        </select>
        <button disabled={!invoices.length} onClick={onGenerate} className="rounded-md bg-cyan-400 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">Generate Reminder</button>
        <button onClick={onCopy} className="rounded-md border border-indigo-400 px-3 py-2">Copy Email</button>
      </div>
      <textarea value={emailOutput} onChange={(e) => onEmailChange(e.target.value)} rows={12} className="mt-3 w-full rounded-md border border-slate-600 bg-slate-950 p-3" placeholder="Generated email will appear here..." />
    </section>
  );
}
