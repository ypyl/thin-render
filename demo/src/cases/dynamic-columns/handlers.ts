// dynamic-columns/handlers.ts — datasets with runtime-known column sets.
import type { Handlers } from "thin-render";

// Simulated API responses: each dataset has a DIFFERENT column set,
// unknown to the spec at build time.
const DATASETS: Record<string, Record<string, unknown>[]> = {
  users: [
    { name: "Alice", email: "alice@example.com", role: "Admin" },
    { name: "Bob", email: "bob@example.com", role: "Editor" },
    { name: "Carol", email: "carol@example.com", role: "Viewer" },
  ],
  products: [
    { sku: "A-100", price: 9.99, stock: 42 },
    { sku: "B-200", price: 129.0, stock: 3 },
    { sku: "C-300", price: 0.49, stock: 1200 },
  ],
  mixed: [
    { name: "Denis", email: "denis@example.com" },
    { name: "Eve", phone: "+1-555-0100", email: "eve@example.com" },
  ],
};

/** Union of keys across ALL rows (handles ragged rows), minus internal fields. */
export function deriveColumns(
  rows: Record<string, unknown>[],
): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) if (k !== "__id") keys.add(k);
  return [...keys].map((key) => ({ key, label: key }));
}

export const handlers: Handlers = {
  loadDataset: (params, { setState }) => {
    const name = String(params.dataset ?? "users");
    const rows = DATASETS[name] ?? DATASETS.users;
    setState("/dataset", name);
    setState("/data", rows.map((r, i) => ({ __id: i, ...r })));
    setState("/colDefs", deriveColumns(rows));
  },
};
