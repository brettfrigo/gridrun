import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { readInvoices, writeInvoices } from "./store.js";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

const daysLate = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  if (Number.isNaN(due.getTime())) return 0;
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

const reminderTone = (lateDays) => {
  if (lateDays >= 30) return "final";
  if (lateDays >= 7) return "firm";
  return "friendly";
};

const withComputed = (invoice) => {
  const lateDays = daysLate(invoice.dueDate);
  return {
    ...invoice,
    lateDays,
    tone: reminderTone(lateDays)
  };
};

const validateInvoice = (body) => {
  const required = ["clientName", "clientEmail", "invoiceNumber", "amount", "dueDate"];
  const missing = required.filter((key) => body[key] === undefined || body[key] === null || body[key] === "");
  if (missing.length) {
    return `Missing fields: ${missing.join(", ")}`;
  }

  if (Number(body.amount) <= 0) return "amount must be > 0";
  if (Number.isNaN(new Date(body.dueDate).getTime())) return "dueDate must be a valid ISO date";

  return null;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "freelance-nudge-server", at: new Date().toISOString() });
});

app.get("/api/invoices", (_req, res) => {
  const invoices = readInvoices().map(withComputed);
  res.json({ data: invoices });
});

app.get("/api/invoices/:id", (req, res) => {
  const invoice = readInvoices().find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json({ data: withComputed(invoice) });
});

app.post("/api/invoices", (req, res) => {
  const err = validateInvoice(req.body);
  if (err) return res.status(400).json({ error: err });

  const next = {
    id: nanoid(10),
    clientName: String(req.body.clientName).trim(),
    clientEmail: String(req.body.clientEmail).trim(),
    invoiceNumber: String(req.body.invoiceNumber).trim(),
    amount: Number(req.body.amount),
    dueDate: req.body.dueDate,
    status: req.body.status || "unpaid",
    notes: req.body.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const invoices = readInvoices();
  invoices.push(next);
  writeInvoices(invoices);

  res.status(201).json({ data: withComputed(next) });
});

app.put("/api/invoices/:id", (req, res) => {
  const err = validateInvoice(req.body);
  if (err) return res.status(400).json({ error: err });

  const invoices = readInvoices();
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invoice not found" });

  invoices[idx] = {
    ...invoices[idx],
    clientName: String(req.body.clientName).trim(),
    clientEmail: String(req.body.clientEmail).trim(),
    invoiceNumber: String(req.body.invoiceNumber).trim(),
    amount: Number(req.body.amount),
    dueDate: req.body.dueDate,
    status: req.body.status || invoices[idx].status,
    notes: req.body.notes ?? invoices[idx].notes,
    updatedAt: new Date().toISOString()
  };

  writeInvoices(invoices);
  res.json({ data: withComputed(invoices[idx]) });
});

app.patch("/api/invoices/:id/pay", (req, res) => {
  const invoices = readInvoices();
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invoice not found" });

  invoices[idx] = {
    ...invoices[idx],
    status: "paid",
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  writeInvoices(invoices);
  res.json({ data: withComputed(invoices[idx]) });
});

app.delete("/api/invoices/:id", (req, res) => {
  const invoices = readInvoices();
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invoice not found" });

  const [removed] = invoices.splice(idx, 1);
  writeInvoices(invoices);
  res.json({ data: removed, deleted: true });
});

app.post("/api/reminders/generate", (req, res) => {
  const { invoiceId, invoice } = req.body || {};

  const source = invoiceId
    ? readInvoices().find((i) => i.id === invoiceId)
    : invoice;

  if (!source) return res.status(404).json({ error: "Invoice not found for reminder generation" });

  const lateDays = daysLate(source.dueDate);
  const tone = reminderTone(lateDays);

  const opener = {
    friendly: `Hope you're doing well — quick note that invoice #${source.invoiceNumber} is now due.`,
    firm: `I'm following up on invoice #${source.invoiceNumber}, which is now ${lateDays} days overdue.`,
    final: `Final reminder: invoice #${source.invoiceNumber} is ${lateDays} days overdue and requires immediate payment.`
  };

  const subject = `Invoice #${source.invoiceNumber} — payment reminder`;
  const body = `Hi ${source.clientName},\n\n${opener[tone]}\n\nAmount due: $${Number(source.amount).toFixed(2)}\nOriginal due date: ${source.dueDate}\n\nPlease let me know if payment has already been sent. If not, could you share an expected payment date today?\n\nThanks,\n[Your Name]`;

  res.json({
    data: {
      invoiceId: source.id || null,
      tone,
      lateDays,
      subject,
      body
    }
  });
});

app.listen(port, () => {
  console.log(`Freelance Nudge server running on http://localhost:${port}`);
});
