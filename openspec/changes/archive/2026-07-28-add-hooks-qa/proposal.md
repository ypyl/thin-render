## Why

The Q&A covers expressions, actions, and watch in depth, but the core building blocks — hooks, store creation, Renderer setup, and component contract — are only mentioned in passing. A user reading Q&A.md won't find answers to "which hook should I use?" or "how do I initialize state?" The README covers these briefly in tutorial style, but Q&A should be the definitive reference.

## What Changes

- Add a **Core API** section to `Q&A.md` with ~7 questions:
  - Hook comparison table: useBound vs useValue vs useSetValue vs useStore vs useRepeatPath
  - How do I create and initialize a store? (createStore)
  - How do I read state outside a component? (getByPath)
  - What does the Renderer need? (spec, registry, store, handlers)
  - How do I build a registry? (type → component map)
  - What's the ComponentProps contract?
  - What's the Spec structure?

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None -->

## Impact

- Affected file: `Q&A.md` (append new section)
- No code changes
