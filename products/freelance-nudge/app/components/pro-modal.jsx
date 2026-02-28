export default function ProModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-indigo-500/60 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold">Free plan limit reached</h3>
        <p className="mt-2 text-sm text-indigo-100/80">Upgrade to Pro for unlimited invoices, templates, and automations.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border border-indigo-500 px-3 py-2" onClick={onClose}>Maybe later</button>
          <button className="rounded-md bg-indigo-500 px-3 py-2 font-semibold text-slate-950" onClick={onClose}>Upgrade to Pro</button>
        </div>
      </div>
    </div>
  );
}
