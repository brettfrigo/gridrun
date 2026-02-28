const STORAGE_KEY = "freelance-nudge-invoices";

const form = document.getElementById("invoiceForm");
const table = document.getElementById("invoiceTable");
const summary = document.getElementById("summary");
const composer = document.getElementById("composer");
const emailOutput = document.getElementById("emailOutput");
const copyBtn = document.getElementById("copyBtn");

const loadInvoices = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveInvoices = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

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

const render = () => {
  const invoices = loadInvoices();
  table.innerHTML = "";

  const total = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const overdue = invoices.filter(i => daysLate(i.dueDate) > 0).length;
  summary.innerHTML = `<p><strong>${invoices.length}</strong> invoices | <strong>$${total.toFixed(2)}</strong> outstanding | <strong>${overdue}</strong> overdue</p>`;

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
      <td>$${Number(invoice.amount).toFixed(2)}</td>
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

  const generateBtn = document.getElementById("generateBtn");
  generateBtn.addEventListener("click", () => {
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

    const body = `Subject: Invoice #${invoice.invoiceNumber} — payment reminder\n\nHi ${invoice.clientName},\n\n${opener[tone]}\n\nAmount due: $${Number(invoice.amount).toFixed(2)}\nOriginal due date: ${invoice.dueDate}\n\nPlease let me know if payment has already been sent. If not, could you share an expected payment date today?\n\nThanks,\n[Your Name]`;
    emailOutput.value = body;
  });
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const invoice = {
    clientName: document.getElementById("clientName").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    invoiceNumber: document.getElementById("invoiceNumber").value.trim(),
    amount: Number(document.getElementById("amount").value),
    dueDate: document.getElementById("dueDate").value
  };

  const invoices = loadInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);
  form.reset();
  render();
});

copyBtn.addEventListener("click", async () => {
  if (!emailOutput.value.trim()) return;
  await navigator.clipboard.writeText(emailOutput.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy Email", 1200);
});

render();
