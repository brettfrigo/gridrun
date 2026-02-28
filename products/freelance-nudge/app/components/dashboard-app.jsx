"use client";

import { useEffect, useMemo, useState } from "react";
import { api, daysLate, FREE_LIMIT } from "../lib/api";
import HeaderPanel from "./header-panel";
import InvoiceFormCard from "./invoice-form-card";
import MetricsCard from "./metrics-card";
import InvoiceTableCard from "./invoice-table-card";
import ReminderCard from "./reminder-card";
import ProModal from "./pro-modal";

export default function DashboardApp() {
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
    const payload = await api.listInvoices();
    const rows = (payload.data || []).filter((i) => i.status !== "paid");
    setInvoices(rows);
  };

  useEffect(() => {
    (async () => {
      try {
        await api.health();
        setApiState("API online");
        await refreshInvoices();
      } catch {
        setApiState("API offline");
        setStatus(`Could not connect to API at ${api.base}. Start server with npm run dev:server`);
      }
    })();
  }, []);

  const submitInvoice = async (e) => {
    e.preventDefault();
    if (invoices.length >= FREE_LIMIT) return setModalOpen(true);

    try {
      setStatus("");
      await api.createInvoice({ ...form, amount: Number(form.amount), status: "unpaid" });
      setForm({ clientName: "", clientEmail: "", invoiceNumber: "", amount: "", dueDate: "" });
      await refreshInvoices();
    } catch (err) {
      setStatus(`Could not save invoice: ${err.message}`);
    }
  };

  const markPaid = async (id) => {
    try {
      setStatus("");
      await api.payInvoice(id);
      await refreshInvoices();
    } catch (err) {
      setStatus(`Could not update invoice: ${err.message}`);
    }
  };

  const generateReminder = async () => {
    if (!selectedInvoice) return;
    try {
      setStatus("");
      const payload = await api.generateReminder(selectedInvoice);
      setEmailOutput(`Subject: ${payload.data.subject}\n\n${payload.data.body}`);
    } catch (err) {
      setStatus(`Could not generate reminder: ${err.message}`);
    }
  };

  const exportCsv = () => {
    if (!visibleInvoices.length) return;
    const header = ["clientName", "clientEmail", "invoiceNumber", "amount", "dueDate", "daysLate"];
    const rows = visibleInvoices.map((i) => [i.clientName, i.clientEmail, i.invoiceNumber, Number(i.amount).toFixed(2), i.dueDate, daysLate(i.dueDate)]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
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
        <HeaderPanel
          invoicesCount={invoices.length}
          freeLimit={FREE_LIMIT}
          apiState={apiState}
          status={status}
          onOpenPro={() => setModalOpen(true)}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <InvoiceFormCard
            form={form}
            onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
            onSubmit={submitInvoice}
            disabled={invoices.length >= FREE_LIMIT}
            onExportCsv={exportCsv}
          />
          <MetricsCard invoices={invoices} metrics={metrics} />
        </section>

        <InvoiceTableCard
          invoices={visibleInvoices}
          overdueOnly={overdueOnly}
          onToggleOverdueOnly={setOverdueOnly}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onMarkPaid={markPaid}
        />

        <ReminderCard
          invoices={visibleInvoices}
          selectedInvoice={selectedInvoice}
          onSelectInvoice={setSelectedInvoice}
          onGenerate={generateReminder}
          emailOutput={emailOutput}
          onEmailChange={setEmailOutput}
          onCopy={() => navigator.clipboard.writeText(emailOutput || "")}
        />

        <footer className="pb-4 text-center text-sm text-indigo-100/70">Connected to API at {api.base}</footer>
        <ProModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </main>
  );
}
