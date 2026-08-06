## Context

See proposal.md. `loading` is threaded through the whole renderer chain (`Renderer` → `_ElementRenderer` → `buildSlots` / `RepeatChildren` / `RepeatSlots` / `RepeatSlotItem`), gating one behavior: the console warning for missing element keys. The only users are two tests in `renderer.test.tsx`.

## Goals / Non-Goals

**Goals:** Remove the prop and the threading; warnings always log.

**Non-Goals:** No change to memoization, repeat behavior, or the registry contract. The stale `watch` requirement in `openspec/specs/renderer/spec.md` is pre-existing drift from the removed watch feature and is NOT part of this change.

## Decisions

**D1: Delete the prop, not just the suppression.** The prop exists solely to silence warnings; with no consumer it is API surface with no purpose. Alternative considered: keep it for future streaming support — rejected, YAGNI and the previous streaming consumer (watch) was removed.

**D2: Remove `loading` from the internal helper signatures too.** It is passed to every renderer helper only to reach the warning site. Removing it end to end avoids a half-deleted parameter. The `memo` props comment on `_ElementRenderer` is updated accordingly.

**D3: Update the spec and README in the same change.** The renderer spec qualifies two warnings with "(only when not streaming/loading)"; the delta removes the qualifier and adds a scenario pinning the unconditional warning. README drops the `loading` row from the Renderer API table.

## Risks / Trade-offs

- **BREAKING** for any external consumer passing `loading` → The prop was unused in all demos; TypeScript will surface the break at compile time; the changelog/commit message calls it out.
- Removing the suppression could spam warnings for async-spec apps → No such app exists in this repo; the warning only fires for genuinely missing keys, which is a spec bug worth surfacing.
