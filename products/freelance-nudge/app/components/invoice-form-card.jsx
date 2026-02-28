export default function InvoiceFormCard({ form, onChange, onSubmit, disabled, onExportCsv }) {
  const fields = [
    ["clientName", "Client name", "text"],
    ["clientEmail", "Client email", "email"],
    ["invoiceNumber", "Invoice #", "text"],
    ["amount", "Amount ($)", "number"],
    ["dueDate", "Due date", "date"]
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Add invoice</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        {fields.map(([key, label, type]) => (
          <label key={key} className="block text-sm font-medium text-slate-700">
            {label}
            <input
              type={type}
              required
              value={form[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring"
            />
          </label>
        ))}
        <button disabled={disabled} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">Save invoice</button>
      </form>
      <button onClick={onExportCsv} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Export CSV</button>
    </article>
  );
}
