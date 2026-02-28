const FREE_LIMIT = 10;
const DEFAULT_API_BASE = "http://localhost:8787";
const API_BASE = (window.FN_API_URL || localStorage.getItem("freelance-nudge-api-base") || DEFAULT_API_BASE).replace(/\/$/, "");

const form = document.getElementById("invoiceForm");
const table = document.getElementById("invoiceTable");
const summary = document.getElementById("summary");
const composer = document.getElementById("composer");
const emailOutput = document.getElementById("emailOutput");
const copyBtn = document.getElementById("copyBtn");
const planBanner = document.getElementById("planBanner");
const proModal = document.getElementById("proModal");
const closeModal = document.getElementById("closeModal");
const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const footer = document.querySelector("footer p");
const overdueOnly = document.getElementById("overdueOnly");
const sortBy = document.getElementById("sortBy");
const emptyState = document.getElementById("emptyState");
const apiHealth = document.getElementById("apiHealth");

let invoices = [];

const statusEl = document.createElement("div");
statusEl.className = "status";
statusEl.style.display = "none";
document.querySelector("header")?.appendChild(statusEl);

const showStatus = (message, kind = "info") => {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
  statusEl.style.display = "block";
};

const clearStatus = () => {
  statusEl.style.display = "none";
  statusEl.textContent = "";
};

const setApiHealth = (ok, text) => {
  apiHealth.textContent = text;
  apiHealth.className = `health-pill ${ok ? "ok" : "error"}`;
};

const currency = (n) => `$${Number(n).toFixed(2)}`;

const daysLate = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

const statusBadge = (lateDays) => {
  if (lateDays >= 30) return '<span class="badge danger">Critical</span>';
  if (lateDays >= 7) return '<span class="badge warn">Overdue</span>';
  return '<span class="badge ok">Due / Gentle</span>';
};

const toCsv = (rows) => {
  const header = ["clientName", "clientEmail", "invoiceNumber", "amount", "dueDate", "daysLate"];
  const values = rows.map((i) => [
    i.clientName,
    i.clientEmail,
    i.invoiceNumber,
    Number(i.amount).toFixed(2),
    i.dueDate,
    String(daysLate(i.dueDate))
  ]);

  const escaped = [header, ...values].map((row) => row
    .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
    .join(","));

  return escaped.join("\n");
};

const downloadCsv = (rows) => {
  if (!rows.length) return;
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `freelance-nudge-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const openProModal = () => proModal.classList.remove("hidden");
const closeProModal = () => proModal.classList.add("hidden");

const fetchJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
};

const api = {
  health: async () => fetchJson("/health"),
  listInvoices: async () => {
    const payload = await fetchJson("/api/invoices");
    return payload.data || [];
  },
  createInvoice: async (invoice) => {
    const payload = await fetchJson("/api/invoices", {
      method: "POST",
      body: JSON.stringify(invoice)
    });
    return payload.data;
  },
  payInvoice: async (id) => {
    const payload = await fetchJson(`/api/invoices/${id}/pay`, { method: "PATCH" });
    return payload.data;
  },
  generateReminder: async (invoiceId) => {
    const payload = await fetchJson("/api/reminders/generate", {
      method: "POST",
      body: JSON.stringify({ invoiceId })
    });
    return payload.data;
  }
};

const renderPlan = (invoiceCount) => {
  const left = Math.max(FREE_LIMIT - invoiceCount, 0);
  const reached = invoiceCount >= FREE_LIMIT;

  planBanner.innerHTML = reached
    ? `<span>Free plan limit reached (${FREE_LIMIT}/${FREE_LIMIT})</span> <button id="planUpgradeBtn" type="button">Upgrade to Pro</button>`
    : `<span>Free plan: ${invoiceCount}/${FREE_LIMIT} invoices used (${left} left)</span> <button id="planUpgradeBtn" type="button">See Pro features</button>`;

  document.getElementById("planUpgradeBtn").addEventListener("click", openProModal);
  saveInvoiceBtn.disabled = reached;
};

const renderMetrics = (rows) => {
  const overdue = rows.filter((i) => daysLate(i.dueDate) > 0);
  const totalOutstanding = rows.reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueAmount = overdue.reduce((sum, i) => sum + Number(i.amount), 0);
  const avgDaysLate = overdue.length ? overdue.reduce((sum, i) => sum + daysLate(i.dueDate), 0) / overdue.length : 0;
  const collectionScore = Math.max(0, Math.round(100 - Math.min(80, avgDaysLate * 2 + overdue.length * 3)));

  summary.innerHTML = `
    <article class="metric"><h3>${rows.length}</h3><p>Open Invoices</p></article>
    <article class="metric"><h3>${currency(totalOutstanding)}</h3><p>Total Outstanding</p></article>
    <article class="metric"><h3>${currency(overdueAmount)}</h3><p>Overdue Amount</p></article>
    <article class="metric"><h3>${avgDaysLate.toFixed(1)}</h3><p>Avg Days Late</p></article>
    <article class="metric"><h3>${collectionScore}%</h3><p>Collection Score</p></article>
  `;
};

const getVisibleInvoices = () => {
  let rows = [...invoices];

  if (overdueOnly.checked) {
    rows = rows.filter((i) => daysLate(i.dueDate) > 0);
  }

  const by = sortBy.value;
  rows.sort((a, b) => {
    if (by === "late-asc") return daysLate(a.dueDate) - daysLate(b.dueDate);
    if (by === "amount-desc") return Number(b.amount) - Number(a.amount);
    if (by === "amount-asc") return Number(a.amount) - Number(b.amount);
    if (by === "due-asc") return new Date(a.dueDate) - new Date(b.dueDate);
    return daysLate(b.dueDate) - daysLate(a.dueDate);
  });

  return rows;
};

const renderComposer = (rows) => {
  composer.innerHTML = `<label>Invoice to remind
    <select id="selectedInvoice">
      <option value="">Select an invoice...</option>
      ${rows.map((i) => `<option value="${i.id}">${i.clientName} — #${i.invoiceNumber}</option>`).join("")}
    </select>
  </label>
  <button id="generateBtn" type="button" ${rows.length ? "" : "disabled"}>Generate Reminder</button>`;

  document.getElementById("generateBtn").addEventListener("click", async () => {
    const selectedId = document.getElementById("selectedInvoice").value;
    if (!selectedId) return;

    try {
      clearStatus();
      const reminder = await api.generateReminder(selectedId);
      emailOutput.value = `Subject: ${reminder.subject}\n\n${reminder.body}`;
    } catch (error) {
      showStatus(`Could not generate reminder: ${error.message}`, "error");
    }
  });
};

const renderTable = (rows) => {
  table.innerHTML = "";
  emptyState.classList.toggle("hidden", rows.length > 0);

  rows.forEach((invoice) => {
    const late = Number(invoice.lateDays ?? daysLate(invoice.dueDate));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${invoice.clientName}</td>
      <td>#${invoice.invoiceNumber}</td>
      <td>${currency(invoice.amount)}</td>
      <td>${late}</td>
      <td>${statusBadge(late)}</td>
      <td><button data-paid="${invoice.id}">Mark Paid</button></td>
    `;
    table.appendChild(tr);
  });

  document.querySelectorAll("button[data-paid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        clearStatus();
        await api.payInvoice(btn.dataset.paid);
        await refreshInvoices();
      } catch (error) {
        showStatus(`Could not update invoice: ${error.message}`, "error");
      }
    });
  });
};

const render = () => {
  renderPlan(invoices.length);
  renderMetrics(invoices);
  const visible = getVisibleInvoices();
  renderComposer(visible);
  renderTable(visible);
};

const refreshInvoices = async () => {
  const all = await api.listInvoices();
  invoices = all.filter((i) => i.status !== "paid");
  render();
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (invoices.length >= FREE_LIMIT) {
    openProModal();
    return;
  }

  const invoice = {
    clientName: document.getElementById("clientName").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    invoiceNumber: document.getElementById("invoiceNumber").value.trim(),
    amount: Number(document.getElementById("amount").value),
    dueDate: document.getElementById("dueDate").value,
    status: "unpaid"
  };

  try {
    clearStatus();
    await api.createInvoice(invoice);
    form.reset();
    await refreshInvoices();
  } catch (error) {
    showStatus(`Could not save invoice: ${error.message}`, "error");
  }
});

copyBtn.addEventListener("click", async () => {
  if (!emailOutput.value.trim()) return;
  await navigator.clipboard.writeText(emailOutput.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy Email"), 1200);
});

overdueOnly.addEventListener("change", render);
sortBy.addEventListener("change", render);

exportCsvBtn.addEventListener("click", () => downloadCsv(getVisibleInvoices()));
closeModal.addEventListener("click", closeProModal);
document.getElementById("upgradeCta").addEventListener("click", closeProModal);

const boot = async () => {
  try {
    await api.health();
    setApiHealth(true, "API online");
    await refreshInvoices();
    footer.textContent = `Connected to API at ${API_BASE}`;
  } catch (error) {
    setApiHealth(false, "API offline");
    showStatus(`Could not connect to API at ${API_BASE}. Start the server with npm run dev:server`, "error");
    if (footer) footer.textContent = `API offline (${API_BASE})`;
    invoices = [];
    render();
  }
};

boot();
