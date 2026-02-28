import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DB_PATH = resolve(process.cwd(), "data", "invoices.json");

const ensureDb = () => {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, "[]", "utf-8");
};

export const readInvoices = () => {
  ensureDb();
  const raw = readFileSync(DB_PATH, "utf-8");
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const writeInvoices = (invoices) => {
  ensureDb();
  writeFileSync(DB_PATH, JSON.stringify(invoices, null, 2), "utf-8");
};
