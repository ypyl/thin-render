## Context

See proposal.md — Why. Current Store Debug case: `StoreDebugCase` renders a `SimpleGrid` with the spec-driven app and `DebugPanel` side by side; the panel is a `Paper` with a `maxHeight: 80vh` flex column (write log ScrollArea, state snapshot, console hints). Available in `@mantine/core` ^9.2.1: `Affix` (portal, fixed position, z-index) and `FloatingWindow` (portal-rendered, draggable via `dragHandleSelector`, resizable via `dimensions` + `FloatingWindow.ResizeHandle`, `constrainToViewport`/`constrainOffset`, `initialPosition`). `@tabler/icons-react` is a demo dependency; `@mantine/hooks` is not (removed as unused — no `useDisclosure`). The log wrapper records entries independently of any UI, so the window can mount/unmount without losing data.

## Goals / Non-Goals

**Goals:**
- Debug panel becomes overlay chrome: fixed corner button → draggable/resizable floating window, app full-width underneath, fully interactive while the window is open.
- Keep the change demo-only and self-contained in the case folder.

**Non-Goals:**
- No library (`src/`) or public API changes.
- No demo-global debugger — the window stays per-case, owned by the store-debug case (the log wrapper is case-owned).
- No persistence of window position or open state across route changes.

## Decisions

**D1: Per-case `DebugWindow` component.** New `demo/src/cases/store-debug/DebugWindow.tsx` renders the Affix + FloatingWindow and receives the `LogStore` as a prop. It stays a clean seam (a consumer could lift it anywhere), but only the store-debug case instantiates it. Alternative considered: a demo-wide floating debugger on every case — rejected, other cases have no wrapper/store contract to attach to, and it would muddy the demo's message.

**D2: Trigger = Affix with live badge.** `Affix position={{ bottom: 20, right: 20 }}`, a Mantine `Button` with `IconBug` (tabler) and a badge showing `entries.length`. The badge uses the same `useSyncExternalStore(log.subscribe, log.getEntries)` subscription as the panel — one snapshot contract, two consumers. Badge freezes while the log is paused (consistent with pause semantics). Gray when 0 entries, colored otherwise. Alternative: plain button, no badge — rejected, the badge is what lets you notice writes without opening the window (spec scenario "Badge shows the live entry count").

**D3: FloatingWindow configuration.**
- `initialPosition={{ bottom: 20, right: 20 }}` — spawns near its button, like DevTools panels.
- `constrainToViewport` + `constrainOffset={12}` — the window can never be dragged or resized out of reach (spec scenario).
- `zIndex` above the Affix so the open window always overlays the button.
- `dimensions`: `initialWidth: 480`, `initialHeight: 420`, `minWidth: 320`, `minHeight: 240`, `maxWidth: 640`, `maxHeight: 560` — big enough for the log, small enough to leave the app visible.
- Resize handle: `FloatingWindow.ResizeHandle` with a tabler icon (e.g. `IconArrowsDiagonal`), bottom-right corner, `role="separator"` keyboard support comes free.
- Mounted only when open (`{open && <FloatingWindow>…}`); open state is `useState` in `StoreDebugCase` (no `@mantine/hooks` dep).

**D4: Drag/scroll separation.** The log is scrollable, so whole-root dragging would hijack scroll gestures. Use `dragHandleSelector=".drag-handle"` on the window header and `excludeDragHandleSelector="button"` so the close button and any controls never start a drag. This is the detail that makes the window usable (spec scenario "Window drags by its header only").

**D5: DebugPanel becomes window content.** The panel drops its outer `Paper` and its own `Title` — the window header owns the title ("Store debug") and the `CloseButton`. The panel keeps its controls (Clear, Pause, entries badge) and sections (log ScrollArea, state snapshot, console hints) and fills the window: `height: "100%"`, `minHeight: 0`, internal `ScrollArea`s handle overflow. Alternative: keep the panel as-is inside the window — rejected, double titles and nested Papers look heavy and the fixed `maxHeight: 80vh` fights the window's own dimensions.

**D6: Mantine upgrade: 9.4.1 → 9.5.1.** The installed 9.4.1 `FloatingWindow` supports dragging but not resizing (`dimensions`/`ResizeHandle` landed in 9.5.0). Options considered: drop resize (fixed-size window) and hand-roll a resize handle. Chosen: same-major minor upgrade — smallest change that ships the resize API, no bespoke window chrome to delete later, and 9.x is a stable line (demo-only risk, validated by tsc + the manual browser pass). If 9.5.x had broken other cases, fallback was option 1 (drop resize).

**D7: Copy updates.** `spec.json` description/technicalDescription: "live log on the right" → "open the floating window via the debug button in the corner". README.md and demo/README.md Store Debug rows mention the floating window. The synced capability spec is updated by this change's delta (MODIFIED + ADDED requirements).

## Risks / Trade-offs

- [Drag vs scroll conflicts] → Mitigated by D4 (header-only drag handle); verify interactively during apply.
- [Window off-screen or overlaying the app controls] → `constrainToViewport` + `constrainOffset` keep it reachable; user can close or drag it away; the affix button stays fixed regardless.
- [FloatingWindow API drift (new-ish Mantine v9 component)] → Demo-only usage; if a prop misbehaves, fall back to `Paper` + manual positioning, which changes the design.
- [Badge desync while paused] → Intentional: the log is frozen, so the badge is too; the panel shows the paused state.
