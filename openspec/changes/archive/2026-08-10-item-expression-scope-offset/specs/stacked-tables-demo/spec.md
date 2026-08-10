# stacked-tables-demo Specification

## Purpose
A demo case that renders multiple tables with different column sets stacked on one page from a single static spec, exercising `$item` scope offsets in repeat paths. The spec declares each table's columns; data loads only the rows.

## ADDED Requirements

### Requirement: Case renders multiple differently-schemed tables stacked
A demo case SHALL exist at `/stacked-tables` that renders every table in a `/tables` store map at once, stacked vertically, each with its own header row and body rows. Each table subtree SHALL carry its own `rows` array and its own `colDefs` array (declared in the spec, never derived from data), so different tables SHALL show different columns simultaneously.

#### Scenario: All tables visible with distinct column sets
- **WHEN** navigating to `/stacked-tables` with `/tables` holding a `users` table and a `products` table whose `colDefs` are seeded from the spec
- **THEN** both tables render on the page
- **AND** the users table shows columns Name, Email, Role
- **AND** the products table shows columns SKU, Price, Stock

#### Scenario: Each table shows its own rows
- **WHEN** `/tables/users/rows` holds three users and `/tables/products/rows` holds three products
- **THEN** the users table renders three body rows and the products table renders three body rows

### Requirement: Columns are declared in the spec and seeded once
The spec SHALL declare each table's columns — `key` and `label` per column — on the repeated tables element's `columns` prop, keyed by table name. The case SHALL seed each table's `colDefs` in the store from that prop once at startup. The load handler SHALL write only `rows` and SHALL NOT write or derive `colDefs`; headers SHALL come from the spec's declared columns regardless of the loaded data.

#### Scenario: Headers come from the spec, not the data
- **WHEN** the store is seeded and rows are loaded for a table whose spec-declared columns are `[{ key: "name", label: "Name" }, { key: "role", label: "Role" }]`
- **THEN** the header row renders "Name" and "Role"
- **AND** the table's `colDefs` in the store equal the spec-declared columns

#### Scenario: Extra data fields do not render
- **WHEN** a table's rows contain fields (e.g. `id`, `active`) that are not among the spec-declared columns
- **THEN** only the declared columns render as headers and cells
- **AND** the undeclared fields appear nowhere in the rendered table

### Requirement: Columns are driven by per-table colDefs via scope offsets
The case's spec SHALL be a single static spec that repeats over `/tables` for the table list. Header rows SHALL repeat over the table's `colDefs` with a `$item` expression resolved at the table scope. Body rows SHALL repeat over the table's `rows`, and row cells SHALL repeat over the table's `colDefs` using a `$item` expression with `$scope: 1` so the column repeat resolves against the table scope, not the row scope.

#### Scenario: Header and cells use the same per-table column defs
- **WHEN** a table at `/tables/0` has `colDefs: [{ key: "name", label: "Name" }, { key: "email", label: "Email" }]`
- **THEN** the header row renders "Name" and "Email"
- **AND** each body row renders a cell for `/tables/0/rows/N/name` and one for `/tables/0/rows/N/email`

#### Scenario: Cells render empty for fields a row lacks
- **WHEN** a row in a table does not have a value for one of the table's column keys
- **THEN** that cell renders empty and remains editable

### Requirement: Loading data replaces only one table's rows
The case SHALL provide a handler that, given a dataset name, writes that dataset's rows into the matching table's `rows` path. Loading a different dataset SHALL update only that table's rows, leaving other tables' rows and spec-declared columns unchanged.

#### Scenario: Load replaces one table's rows only
- **WHEN** the "Reload Products" action writes rows to the products table while the users table already holds data
- **THEN** the products table re-renders with the new rows
- **AND** the users table still shows its previous rows and its spec-declared columns
