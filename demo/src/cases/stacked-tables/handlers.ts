// stacked-tables/handlers.ts — loads rows per table; columns come from the spec.
import type { Handlers } from "thin-render";

// Simulated API responses. Each dataset has a DIFFERENT column set, and every
// row carries EXTRA fields (id, active, category, weightKg) that spec.json
// does NOT declare — those fields never render. The handler only loads rows.
const DATASETS: Record<string, Record<string, unknown>[]> = {
  users: [
    { name: "Alice", email: "alice@example.com", role: "Admin", id: 1, active: true },
    { name: "Bob", email: "bob@example.com", role: "Editor", id: 2, active: true },
    { name: "Carol", email: "carol@example.com", role: "Viewer", id: 3, active: false },
  ],
  products: [
    { sku: "A-100", price: 9.99, stock: 42, category: "electronics", weightKg: 0.2 },
    { sku: "B-200", price: 129.0, stock: 3, category: "electronics", weightKg: 1.4 },
    { sku: "C-300", price: 0.49, stock: 1200, category: "office", weightKg: 0.01 },
  ],
  mixed: [
    { name: "Denis", email: "denis@example.com", id: 10 },
    { name: "Eve", phone: "+1-555-0100", email: "eve@example.com", id: 11 },
  ],
};

export const handlers: Handlers = {
  loadDataset: (params, { setState }) => {
    const name = String(params.dataset ?? "users");
    const rows = DATASETS[name] ?? DATASETS.users;
    // Only this table's rows are touched — colDefs come from the spec and are
    // seeded once, so other tables keep their data untouched.
    setState(`/tables/${name}/rows`, rows.map((r, i) => ({ __id: i, ...r })));
  },
};
