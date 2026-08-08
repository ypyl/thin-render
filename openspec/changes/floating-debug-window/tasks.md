## 1. Floating debug window

- [x] 1.1 Create `demo/src/cases/store-debug/DebugWindow.tsx`: `Affix` button (bottom-right, `IconBug`, live entries badge via `useSyncExternalStore`) and an open `FloatingWindow` per design D2/D3 (initialPosition bottom-right, constrainToViewport + constrainOffset 12, zIndex above Affix, dimensions with min/max, resize handle with tabler icon, close button)
- [x] 1.2 Wire the window header per design D4: `dragHandleSelector=".drag-handle"` on the header, `excludeDragHandleSelector="button"` so close/controls never start a drag
- [x] 1.3 Upgrade `@mantine/core` 9.4.1 → 9.5.1 in `demo/package.json` (per design D6) and verify the installed `FloatingWindow` exposes `dimensions` and `ResizeHandle`

## 2. Case layout

- [x] 2.1 Rework `StoreDebugCase.tsx`: single-column full-width `<Renderer>` + `<DebugWindow log={log} />`; open state as plain `useState`; window mounts only when open; window.__store effect and wrapper wiring unchanged

## 3. Panel restyle

- [x] 3.1 Restyle `DebugPanel.tsx` per design D5: drop outer `Paper` and its own `Title` (window header owns title + close), fill the window (height 100%, minHeight 0), keep Clear/Pause/entries badge, log ScrollArea, state snapshot, and console hints

## 4. Copy and docs

- [x] 4.1 Update `demo/src/cases/store-debug/spec.json` description and technicalDescription: debug panel lives in a floating window opened from the corner button
- [x] 4.2 Update the Store Debug rows in `README.md` and `demo/README.md` to mention the floating window

## 5. Verify

- [x] 5.1 Run `npx tsc -b` in `demo/` — typecheck passes
- [x] 5.2 Run `npm test` — all tests pass
- [x] 5.3 Run `npm run coverage` — 100% thresholds still met
- [x] 5.4 Run the demo dev server and manually verify the spec scenarios: button visible bottom-right with badge, click opens window, badge updates while window closed, window stays open while typing in the app and the write lands in the log, dragging by the header moves the window, scrolling inside the log does NOT move the window, resize handle resizes within min/max, window cannot leave the viewport, close button hides the window, console section and window.__store still work
