"use client";

import { useEffect, useMemo, useState } from "react";

const FREE_LIMIT = 10;
const API_BASE = (process.env.NEXT_PUBLIC_FN_API_URL || "http://localhost:8787").replace(/\/$/, "");

const currency = (n) => `$${Number(n).toFixed(2)}`;
const daysLate = (dueDate) => {
  const due = new Date(dueDate);
  const diff = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

const statusBadge = (lateDays) => {
  if (lateDays >= 30) return "bg-rose-700";
  if (lateDays >= 7) return "bg-amber-700";
  return "bg-emerald-700";
};

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Request failed (${res.status})`);
  return payload;
}

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");
  const [apiState, setApiState] = useState("Checking API...");
  const [sortBy, setSortBy] = useState("late-desc");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [emailOutput, setEmailOutput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    invoiceNumber: "",
    amount: "",
    dueDate: ""
  });

  const visibleInvoices = useMemo(() => {
    let rows = [...invoices];
    if (overdueOnly) rows = rows.filter((i) => daysLate(i.dueDate) > 0);

    rows.sort((a, b) => {
      if (sortBy === "late-asc") return daysLate(a.dueDate) - daysLate(b.dueDate);
      if (sortBy === "amount-desc") return Number(b.amount) - Number(a.amount);
      if (sortBy === "amount-asc") return Number(a.amount) - Number(b.amount);
      if (sortBy === "due-asc") return new Date(a.dueDate) - new Date(b.dueDate);
      return daysLate(b.dueDate) - daysLate(a.dueDate);
    });

    return rows;
  }, [invoices, overdueOnly, sortBy]);

  const metrics = useMemo(() => {
    const overdue = invoices.filter((i) => daysLate(i.dueDate) > 0);
    const total = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const overdueAmount = overdue.reduce((sum, i) => sum + Number(i.amount), 0);
    const avgLate = overdue.length
      ? overdue.reduce((sum, i) => sum + daysLate(i.dueDate), 0) / overdue.length
      : 0;
    const collectionScore = Math.max(0, Math.round(100 - Math.min(80, avgLate * 2 + overdue.length * 3)));
    return { total, overdueAmount, avgLate, collectionScore };
  }, [invoices]);

  const refreshInvoices = async () => {
    const payload = await fetchJson("/api/invoices");
    setInvoices((payload.data || []).filter((i) => i.status !== "paid"));
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchJson("/health");
        setApiState("API online");
        await refreshInvoices();
      } catch {
        setApiState("API offline");
        setStatus(`Could not connect to API at ${API_BASE}. Start server with npm run dev:server`);
      }
    })();
  }, []);

  const submitInvoice = async (e) => {
    e.preventDefault();
    if (invoices.length >= FREE_LIMIT) return setModalOpen(true);
    try {
      setStatus("");
      await fetchJson("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount), status: "unpaid" })
      });
      setForm({ clientName: "", clientEmail: "", invoiceNumber: "", amount: "", dueDate: "" });
      await refreshInvoices();
    } catch (err) {
      setStatus(`Could not save invoice: ${err.message}`);
    }
  };

  const markPaid = async (id) => {
    try {
      setStatus("");
      await fetchJson(`/api/invoices/${id}/pay`, { method: "PATCH" });
      await refreshInvoices();
    } catch (err) {
      setStatus(`Could not update invoice: ${err.message}`);
    }
  };

  const generateReminder = async () => {
    if (!selectedInvoice) return;
    try {
      setStatus("");
      const payload = await fetchJson("/api/reminders/generate", {
        method: "POST",
        body: JSON.stringify({ invoiceId: selectedInvoice })
      });
      setEmailOutput(`Subject: ${payload.data.subject}\n\n${payload.data.body}`);
    } catch (err) {
      setStatus(`Could not generate reminder: ${err.message}`);
    }
  };

  const exportCsv = () => {
    if (!visibleInvoices.length) return;
    const header = ["clientName", "clientEmail", "invoiceNumber", "amount", "dueDate", "daysLate"];
    const rows = visibleInvoices.map((i) => [i.clientName, i.clientEmail, i.invoiceNumber, Number(i.amount).toFixed(2), i.dueDate, daysLate(i.dueDate)]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freelance-nudge-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_600px_at_20%_-10%,#1b2751_0%,transparent_55%)] p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-6 text-center shadow-xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Onlook-native Next.js + Tailwind</p>
          <h1 className="mt-2 text-4xl font-bold">Freelance Nudge</h1>
          <p className="mt-2 text-indigo-100/80">Track invoices and send better reminders faster.</p>
          <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs ${apiState === "API online" ? "bg-emerald-900 text-emerald-200" : "bg-rose-900 text-rose-200"}`}>{apiState}</span>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-indigo-500/50 bg-slate-950/60 p-3 text-sm">
            <span>Free plan: {invoices.length}/{FREE_LIMIT} invoices used ({Math.max(FREE_LIMIT - invoices.length, 0)} left)</span>
            <button className="rounded-md bg-indigo-500 px-3 py-1.5 text-slate-950 font-semibold" onClick={() => setModalOpen(true)}>See Pro features</button>
          </div>
          {status && <p className="mt-3 rounded-lg border border-rose-700 bg-rose-950/60 p-2 text-sm text-rose-200">{status}</p>}
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <h2 className="mb-3 text-xl font-semibold">Add Invoice</h2>
            <form onSubmit={submitInvoice} className="space-y-2">
              {[
                ["clientName", "Client name", "text"],
                ["clientEmail", "Client email", "email"],
                ["invoiceNumber", "Invoice #", "text"],
                ["amount", "Amount ($)", "number"],
                ["dueDate", "Due date", "date"]
              ].map(([key, label, type]) => (
                <label key={key} className="block text-sm">
                  {label}
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2"
                  />
                </label>
              ))}
              <button disabled={invoices.length >= FREE_LIMIT} className="mt-2 rounded-md bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">Save Invoice</button>
            </form>
            <button onClick={exportCsv} className="mt-3 rounded-md border border-indigo-400 px-3 py-2 text-sm">Export CSV</button>
          </article>

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
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Outstanding Invoices</h2>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-1"><input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />Overdue only</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-slate-600 bg-slate-950 p-1">
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
                {visibleInvoices.map((invoice) => {
                  const late = Number(invoice.lateDays ?? daysLate(invoice.dueDate));
                  return (
                    <tr key={invoice.id} className="border-t border-slate-800">
                      <td className="py-2">{invoice.clientName}</td>
                      <td className="py-2">#{invoice.invoiceNumber}</td>
                      <td className="py-2">{currency(invoice.amount)}</td>
                      <td className="py-2">{late}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-1 text-xs ${statusBadge(late)}`}>{late >= 30 ? "Critical" : late >= 7 ? "Overdue" : "Due / Gentle"}</span></td>
                      <td className="py-2"><button className="rounded-md bg-indigo-500 px-2 py-1 text-xs font-semibold text-slate-950" onClick={() => markPaid(invoice.id)}>Mark Paid</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visibleInvoices.length && <p className="pt-3 text-sm text-indigo-100/70">No invoices to show.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <h2 className="text-xl font-semibold">Email Generator</h2>
          <p className="mt-1 text-sm text-indigo-100/80">Pick an invoice and generate a ready-to-send follow-up email.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} className="min-w-[260px] rounded-md border border-slate-600 bg-slate-950 p-2">
              <option value="">Select an invoice...</option>
              {visibleInvoices.map((i) => <option key={i.id} value={i.id}>{i.clientName} — #{i.invoiceNumber}</option>)}
            </select>
            <button disabled={!visibleInvoices.length} onClick={generateReminder} className="rounded-md bg-cyan-400 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">Generate Reminder</button>
            <button onClick={() => navigator.clipboard.writeText(emailOutput)} className="rounded-md border border-indigo-400 px-3 py-2">Copy Email</button>
          </div>
          <textarea value={emailOutput} onChange={(e) => setEmailOutput(e.target.value)} rows={12} className="mt-3 w-full rounded-md border border-slate-600 bg-slate-950 p-3" placeholder="Generated email will appear here..." />
        </section>

        {modalOpen && (
          <div className="fixed inset-0 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-indigo-500/60 bg-slate-900 p-5">
              <h3 className="text-lg font-semibold">Free plan limit reached</h3>
              <p className="mt-2 text-sm text-indigo-100/80">Upgrade to Pro for unlimited invoices, templates, and automations.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-md border border-indigo-500 px-3 py-2" onClick={() => setModalOpen(false)}>Maybe later</button>
                <button className="rounded-md bg-indigo-500 px-3 py-2 font-semibold text-slate-950" onClick={() => setModalOpen(false)}>Upgrade to Pro</button>
              </div>
            </div>
          </div>
        )}

        <footer className="pb-4 text-center text-sm text-indigo-100/70">Connected to API at {API_BASE}</footer>
      </div>
    </main>
  );
}
