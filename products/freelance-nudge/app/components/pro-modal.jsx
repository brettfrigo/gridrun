export default function ProModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Free plan limit reached</h3>
        <p className="mt-2 text-sm text-slate-600">Upgrade to Pro for unlimited invoices, saved templates, and automation rules.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={onClose}>Maybe later</button>
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white" onClick={onClose}>Upgrade</button>
        </div>
      </div>
    </div>
  );
}
