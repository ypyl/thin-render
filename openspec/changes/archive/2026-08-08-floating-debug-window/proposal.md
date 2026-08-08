## Why

The Store Debug demo renders the write-log panel as a fixed column next to the app. That layout is a demo artifact: real debugging chrome floats over a working app (the DevTools pattern) — a corner button that opens a draggable inspector while the app stays interactive underneath. Moving the panel into a floating window also frees the case to render the app full-width and makes the demo teach the attachable-debugger story instead of a split-screen one.

## What Changes

- Add `DebugWindow` to `demo/src/cases/store-debug/`: an `Affix` button (bottom-right, bug icon, live entry-count badge) that opens a draggable, resizable `FloatingWindow` hosting the debug panel.
- Rework `StoreDebugCase.tsx` layout: single-column full-width app + the floating debug chrome; open state is plain `useState` (no `@mantine/hooks` dependency).
- Restyle `DebugPanel.tsx` to fill the floating window (internal scroll areas, window header owns title + close).
- Update case copy (`spec.json` description/technicalDescription) and the README demo table rows.
- Upgrade `@mantine/core` in the demo from 9.4.1 to 9.5.1: 9.5.1 adds the `FloatingWindow` resize API (`dimensions`, `FloatingWindow.ResizeHandle`) that the floating window needs. Same-major minor bump; the demo's other Mantine usage is unaffected.
- No library (`src/`) changes; no public API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-debug-demo`: The "Store debug case exists at /store-debug" requirement changes from a two-column layout (app next to always-visible panel) to a full-width app with the panel hosted in a floating window opened from an affix button. A new requirement covers the floating window behavior (button, badge, drag, resize, close, recording while closed).

## Impact

- `demo/package.json` + lockfile — `@mantine/core` 9.4.1 → 9.5.1.
- `demo/src/cases/store-debug/DebugWindow.tsx` — new.
- `demo/src/cases/store-debug/StoreDebugCase.tsx` — layout and wiring change.
- `demo/src/cases/store-debug/DebugPanel.tsx` — restyle to window content.
- `demo/src/cases/store-debug/spec.json` — description copy.
- `README.md` / `demo/README.md` — Store Debug row copy.
- No changes to `src/`, no dependency changes, no package changes.
