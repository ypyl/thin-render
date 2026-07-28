## Why

The Q&A Actions & Handlers section covers `on` vs `watch` at a high level, but `watch` has deeper mechanics worth documenting: the infinite-loop guard in the store, the fact that watch paths are literal strings (no `$item` resolution unlike repeat paths), and practical implications like per-item validation inside repeats. These are not obvious from the README or the existing Q&A and users will discover them the hard way.

## What Changes

- Add a **Watch** subsection to the Actions & Handlers section in `Q&A.md` with 5 questions:
  - Can I use `$item` in a watch path? (no — literal strings only)
  - How do I validate per-item inside a repeat? (workaround: watch parent array)
  - Can a watch handler cause an infinite loop? (no — strict equality guard)
  - Does watch fire on initial render? (no — only on `set()`)
  - Can I watch a path that doesn't exist yet? (yes — subscribe is path-based)

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None -->

## Impact

- Affected file: `Q&A.md` (append to Actions & Handlers section)
- No code changes, no API changes
