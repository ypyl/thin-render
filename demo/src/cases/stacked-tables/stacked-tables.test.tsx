// stacked-tables.test.tsx — renders the real spec.json through the real table
// components (Mantine chrome wrappers substituted with minimal passthroughs so
// the test runs against a single React instance in jsdom).
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Renderer, createStore, type ComponentProps, type Registry } from "thin-render";
import { handlers } from "./handlers";
import { Table, THead, TBody, Tr } from "../../components/table";
import { ColumnHeader } from "../../components/ColumnHeader";
import { DataCell } from "../../components/DataCell";
import spec from "./spec.json";

const registry: Registry = {
  CaseContainer: ({ children }: ComponentProps) => <div>{children}</div>,
  StackRow: ({ children }: ComponentProps) => <div>{children}</div>,
  ActionButton: ({ element, emit }: ComponentProps) => (
    <button type="button" onClick={() => emit("click")}>
      {String(element.props?.label ?? "")}
    </button>
  ),
  Table,
  THead,
  TBody,
  Tr,
  ColumnHeader,
  DataCell,
};

function makeStore() {
  const store = createStore({});
  // Mirror StackedTablesCase: seed colDefs from the spec, then load rows.
  const columns = (
    spec.elements.tables.props as { columns: Record<string, { key: string; label: string }[]> }
  ).columns;
  for (const [name, colDefs] of Object.entries(columns)) {
    store.set(`/tables/${name}/colDefs`, colDefs);
    handlers.loadDataset({ dataset: name }, { getState: store.getState, setState: store.set });
  }
  return store;
}

describe("stacked-tables demo", () => {
  it("renders every table with its own spec-declared column set at once", () => {
    const store = makeStore();
    render(<Renderer spec={spec} registry={registry} store={store} handlers={handlers} />);

    // Distinct header sets per table, declared in the spec: Name/Email/Role
    // (users), SKU/Price/Stock (products), Name/Email/Phone (mixed).
    expect(screen.getAllByText("Role")).toHaveLength(1);
    expect(screen.getAllByText("SKU")).toHaveLength(1);
    expect(screen.getAllByText("Phone")).toHaveLength(1);
    expect(screen.getAllByText("Name")).toHaveLength(2);
    expect(screen.getAllByText("Email")).toHaveLength(2);
  });

  it("renders one editable cell per row × column (ragged rows get empty cells)", () => {
    const store = makeStore();
    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} handlers={handlers} />,
    );

    // 3×3 + 3×3 + 2×3 = 24 cells.
    expect(container.querySelectorAll("input")).toHaveLength(24);
    // The mixed table's first row (Denis) lacks a phone value — empty cell.
    const emptyCells = [...container.querySelectorAll("input")].filter(
      (i) => (i as HTMLInputElement).value === "",
    );
    expect(emptyCells.length).toBeGreaterThanOrEqual(1);
  });

  it("renders only the spec-declared columns even when data has extra fields", () => {
    const store = makeStore();
    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} handlers={handlers} />,
    );

    // The datasets carry extra fields (id, active, category, weightKg) that
    // spec.json does not declare — they must never appear as headers or cells.
    for (const extra of ["id", "active", "category", "weightKg"]) {
      expect(screen.queryAllByText(extra)).toHaveLength(0);
    }
    // Only the declared columns render: still 3×3 + 3×3 + 2×3 = 24 cells.
    expect(container.querySelectorAll("input")).toHaveLength(24);
  });

  it("binds a cell edit across the row and column scopes into the store", () => {
    const store = makeStore();
    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} handlers={handlers} />,
    );

    const first = container.querySelector("input") as HTMLInputElement;
    act(() => fireEvent.change(first, { target: { value: "Zed" } }));

    expect(store.get("/tables/users/rows/0/name")).toBe("Zed");
  });

  it("reloading one table leaves the other tables untouched", () => {
    const store = makeStore();
    render(<Renderer spec={spec} registry={registry} store={store} handlers={handlers} />);

    act(() => fireEvent.click(screen.getByText("Reload Products")));

    // Users data and columns survive the products reload.
    expect(store.get("/tables/users/rows")).toHaveLength(3);
    expect(store.get("/tables/users/colDefs")).toEqual([
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
    ]);
    expect(screen.getAllByText("Role")).toHaveLength(1);
    expect(screen.getAllByText("SKU")).toHaveLength(1);
  });
});
