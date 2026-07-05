# Before / After / Gap Template

A specialized 3-section `narrative` template for Problem → Gap → Solution diagrams.
Abstracted from the Map/Territory concept: Before = current state,
Gap = what's missing, After = target state.

Belongs to `narrative` archetype (3-section variant).

## When to use

- "Before vs After refactoring X"
- Problem → Root Cause → Solution
- Current State → Gap → Desired State
- "Why can't we just..." → explain the gap
- Any "today → tomorrow" transformation

## Information slots (required)

- [ ] `title` — the transformation (e.g., "Before/After: Auth System")
- [ ] 3 sections with specific roles:
  - Section 0: **Before** — `role: "map"`, current state, 2–4 items
  - Section 1: no section frame — the gap is represented by the **transition arrow** (wide, prominent label)
  - Section 2: **After** — `role: "territory"`, target state, 2–4 items
- [ ] `transition`: one arrow from section-0 to section-1 with a **narrative label** describing the gap
- [ ] optional `callout` — the key insight or recommendation

## Visual hierarchy

1. Title: "Before → After: [Transformation]"
2. Before section (blue, map role): current pain points
3. **Gap arrow**: prominent label, often the longest text on the diagram
4. After section (green, territory role): target outcomes
5. Callout (amber): recommendation or constraint

## Layout rules

- Exactly 2 section frames (Before + After)
- The gap IS the transition — make the label substantive
- Before items have role = map; After items have role = territory
- Arrow spans the full distance between sections
- Direction: **TB**

## Anti-patterns

- ❌ Adding a 3rd section frame for the gap — the gap is the arrow
- ❌ Silent transition — the gap label IS the diagram's thesis
- ❌ Asymmetric item count (Before=2, After=8) — keep balanced

## Golden reference

→ `content/map-territory.en.json` shows the abstracted Map/Gap/Territory pattern
→ The gap in map-territory is "cannot fully describe → must discover"
