## Why

Each demo case page shows the rendered UI but gives no path back to the case's own source on GitHub. A developer viewing the live demo cannot jump straight to the folder (`demo/src/cases/<name>`) that implements a case, so exploring how a case works requires hunting through the repo by hand.

## What Changes

- Add a new optional `sourceFolder` prop to the `CaseContainer` demo component.
- When `sourceFolder` is present, `CaseContainer` renders a "View source on GitHub" link that opens `https://github.com/ypyl/thin-render/tree/master/demo/src/cases/<sourceFolder>` in a new tab.
- Set `sourceFolder` on every demo case's root `CaseContainer` element to the case's own folder name (e.g. `basic`, `form`, `dnd-table`), so each case page links to its own GitHub subfolder.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `case-container`: `CaseContainer` gains optional `sourceFolder` prop that renders a GitHub source link (new behavior for an existing demo component).

## Impact

- Affected code: `demo/src/components/CaseContainer.tsx` (add optional `sourceFolder` prop and link rendering), and each `${demo/src/cases/<name>}/spec.json` (add `sourceFolder` to the root `CaseContainer` props).
- No change to the library (`src/`) — this is demo-only. No new dependencies.
- Docs: `README.md` and `demo/README.md` demo tables may note the source link; case count and API surface are unchanged.
