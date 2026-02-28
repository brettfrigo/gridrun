const API_BASE = (process.env.NEXT_PUBLIC_FN_API_URL || "http://localhost:8787").replace(/\/$/, "");

export const FREE_LIMIT = 10;

export const currency = (n) => `$${Number(n).toFixed(2)}`;

export const daysLate = (dueDate) => {
  const due = new Date(dueDate);
  const diff = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

export async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Request failed (${res.status})`);
  return payload;
}

export const api = {
  base: API_BASE,
  health: () => fetchJson("/health"),
  listInvoices: () => fetchJson("/api/invoices"),
  createInvoice: (body) => fetchJson("/api/invoices", { method: "POST", body: JSON.stringify(body) }),
  payInvoice: (id) => fetchJson(`/api/invoices/${id}/pay`, { method: "PATCH" }),
  generateReminder: (invoiceId) => fetchJson("/api/reminders/generate", { method: "POST", body: JSON.stringify({ invoiceId }) })
};
