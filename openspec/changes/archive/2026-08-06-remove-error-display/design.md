## Context

See proposal.md. Grep across `demo/src`, `src`, README, and LLM.md finds references only inside the file itself. It was the last consumer of the watch feature's UI; the watch-validation spec and demo case were removed in earlier changes.

## Goals / Non-Goals

**Goals:** Delete the dead component.

**Non-Goals:** No changes to Mantine imports, other demo components, or specs.

## Decisions

**D1: Delete the file outright.** Nothing registers or imports it. Keeping it "in case a validation demo returns" is speculative (YAGNI); reintroducing a 15-line component is trivial.

## Risks / Trade-offs

- A future validation demo needs it → Recreate from git history (the file is in the log).
