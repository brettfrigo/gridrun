export default function InvoiceFormCard({ form, onChange, onSubmit, disabled, onExportCsv }) {
  const fields = [
    ["clientName", "Client name", "text"],
    ["clientEmail", "Client email", "email"],
    ["invoiceNumber", "Invoice #", "text"],
    ["amount", "Amount ($)", "number"],
    ["dueDate", "Due date", "date"]
  ];

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="mb-3 text-xl font-semibold">Add Invoice</h2>
      <form onSubmit={onSubmit} className="space-y-2">
        {fields.map(([key, label, type]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              type={type}
              required
              value={form[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2"
            />
          </label>
        ))}
        <button disabled={disabled} className="mt-2 rounded-md bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">Save Invoice</button>
      </form>
      <button onClick={onExportCsv} className="mt-3 rounded-md border border-indigo-400 px-3 py-2 text-sm">Export CSV</button>
    </article>
  );
}
