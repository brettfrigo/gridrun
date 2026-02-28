const STORAGE_KEY = "freelance-nudge-invoices";
const FREE_LIMIT = 10;

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

const loadInvoices = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveInvoices = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const currency = (n) => `$${Number(n).toFixed(2)}`;

const daysLate = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

const toneFor = (lateDays) => {
  if (lateDays >= 30) return "final";
  if (lateDays >= 7) return "firm";
  return "friendly";
};

const statusBadge = (lateDays) => {
  if (lateDays >= 30) return '<span class="badge danger">Critical</span>';
  if (lateDays >= 7) return '<span class="badge warn">Overdue</span>';
  return '<span class="badge ok">Due / Gentle</span>';
};

const toCsv = (invoices) => {
  const header = ["clientName", "clientEmail", "invoiceNumber", "amount", "dueDate", "daysLate"];
  const rows = invoices.map((i) => [
    i.clientName,
    i.clientEmail,
    i.invoiceNumber,
    Number(i.amount).toFixed(2),
    i.dueDate,
    String(daysLate(i.dueDate))
  ]);

  const escaped = [header, ...rows].map((row) => row
    .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
    .join(","));

  return escaped.join("\n");
};

const downloadCsv = (invoices) => {
  if (!invoices.length) return;
  const blob = new Blob([toCsv(invoices)], { type: "text/csv;charset=utf-8;" });
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

const renderPlan = (invoiceCount) => {
  const left = Math.max(FREE_LIMIT - invoiceCount, 0);
  const reached = invoiceCount >= FREE_LIMIT;

  planBanner.innerHTML = reached
    ? `<span>Free plan limit reached (${FREE_LIMIT}/${FREE_LIMIT})</span> <button id="planUpgradeBtn" type="button">Upgrade to Pro</button>`
    : `<span>Free plan: ${invoiceCount}/${FREE_LIMIT} invoices used (${left} left)</span> <button id="planUpgradeBtn" type="button">See Pro features</button>`;

  document.getElementById("planUpgradeBtn").addEventListener("click", openProModal);
  saveInvoiceBtn.disabled = reached;
};

const renderMetrics = (invoices) => {
  const overdue = invoices.filter(i => daysLate(i.dueDate) > 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueAmount = overdue.reduce((sum, i) => sum + Number(i.amount), 0);
  const avgDaysLate = overdue.length ? overdue.reduce((sum, i) => sum + daysLate(i.dueDate), 0) / overdue.length : 0;
  const collectionScore = Math.max(0, Math.round(100 - Math.min(80, avgDaysLate * 2 + overdue.length * 3)));

  summary.innerHTML = `
    <article class="metric"><h3>${invoices.length}</h3><p>Open Invoices</p></article>
    <article class="metric"><h3>${currency(totalOutstanding)}</h3><p>Total Outstanding</p></article>
    <article class="metric"><h3>${currency(overdueAmount)}</h3><p>Overdue Amount</p></article>
    <article class="metric"><h3>${avgDaysLate.toFixed(1)}</h3><p>Avg Days Late</p></article>
    <article class="metric"><h3>${collectionScore}%</h3><p>Collection Score</p></article>
  `;
};

const render = () => {
  const invoices = loadInvoices();
  table.innerHTML = "";

  renderPlan(invoices.length);
  renderMetrics(invoices);

  composer.innerHTML = `<label>Invoice to remind
    <select id="selectedInvoice">
      <option value="">Select an invoice...</option>
      ${invoices.map((i, idx) => `<option value="${idx}">${i.clientName} — #${i.invoiceNumber}</option>`).join("")}
    </select>
  </label>
  <button id="generateBtn" type="button">Generate Reminder</button>`;

  invoices.forEach((invoice, idx) => {
    const late = daysLate(invoice.dueDate);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${invoice.clientName}</td>
      <td>#${invoice.invoiceNumber}</td>
      <td>${currency(invoice.amount)}</td>
      <td>${late}</td>
      <td>${statusBadge(late)}</td>
      <td><button data-paid="${idx}">Mark Paid</button></td>
    `;
    table.appendChild(tr);
  });

  document.querySelectorAll("button[data-paid]").forEach(btn => {
    btn.addEventListener("click", () => {
      const invoices = loadInvoices();
      invoices.splice(Number(btn.dataset.paid), 1);
      saveInvoices(invoices);
      render();
    });
  });

  document.getElementById("generateBtn").addEventListener("click", () => {
    const selected = document.getElementById("selectedInvoice").value;
    if (selected === "") return;
    const invoice = loadInvoices()[Number(selected)];
    const late = daysLate(invoice.dueDate);
    const tone = toneFor(late);

    const opener = {
      friendly: `Hope you're doing well — quick note that invoice #${invoice.invoiceNumber} is now due.`,
      firm: `I'm following up on invoice #${invoice.invoiceNumber}, which is now ${late} days overdue.`,
      final: `Final reminder: invoice #${invoice.invoiceNumber} is ${late} days overdue and requires immediate payment.`
    };

    const body = `Subject: Invoice #${invoice.invoiceNumber} — payment reminder\n\nHi ${invoice.clientName},\n\n${opener[tone]}\n\nAmount due: ${currency(invoice.amount)}\nOriginal due date: ${invoice.dueDate}\n\nPlease let me know if payment has already been sent. If not, could you share an expected payment date today?\n\nThanks,\n[Your Name]`;
    emailOutput.value = body;
  });
};

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const invoices = loadInvoices();
  if (invoices.length >= FREE_LIMIT) {
    openProModal();
    return;
  }

  const invoice = {
    clientName: document.getElementById("clientName").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    invoiceNumber: document.getElementById("invoiceNumber").value.trim(),
    amount: Number(document.getElementById("amount").value),
    dueDate: document.getElementById("dueDate").value
  };

  invoices.push(invoice);
  saveInvoices(invoices);
  form.reset();
  render();
});

copyBtn.addEventListener("click", async () => {
  if (!emailOutput.value.trim()) return;
  await navigator.clipboard.writeText(emailOutput.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy Email"), 1200);
});

exportCsvBtn.addEventListener("click", () => downloadCsv(loadInvoices()));
closeModal.addEventListener("click", closeProModal);
document.getElementById("upgradeCta").addEventListener("click", closeProModal);

render();
