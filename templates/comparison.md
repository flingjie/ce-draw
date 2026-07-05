# Comparison Template

Two side-by-side options with a bottom conclusion. For A vs B,
Pro vs Con, Before vs After, or any pairwise comparison.

Belongs to `comparison` archetype.

## When to use

- "Compare X vs Y"
- Pro/Con analysis
- Before/After with explicit columns
- Technology choice, trade-off visualization

## Information slots (required)

- [ ] `title` — what's being compared
- [ ] 2 columns, each with:
  - [ ] Option name (heading)
  - [ ] ✓ 2–4 pros
  - [ ] ✗ 1–2 cons
- [ ] Bottom conclusion row (spanning both columns)
- [ ] optional icons for each option

## Visual hierarchy

1. Title (20px, centered above)
2. Column headings (16px bold)
3. Individual points (14px) — pros in green text, cons in red text
4. Conclusion (16px bold, full-width bar, `role: "callout"`)

## Layout rules

- 2 columns, equal width
- Pros before cons in each column
- Limited to ≤ 4 points per column (keep readable)
- Conclusion at bottom, full-width
- Direction: **TB**

## Anti-patterns

- ❌ More than 2 columns — use narrative-framework instead
- ❌ Asymmetric columns (A=8 items, B=2 items) — keep balanced
- ❌ No conclusion — comparison without decision is noise

## Recommended API

```ts
import { Diagram } from "ec-draw";

const d = new Diagram("sketchy", { cols: 2, cellW: 280, cellH: 160, gapX: 50, gapY: 60 });

d.addBox("Option A\n\n✓ Simple\n✓ Fast\n✗ Hard to scale", { row: 0, col: 0, height: 150 });
d.addBox("Option B\n\n✓ Scalable\n✓ Flexible\n✗ Complex setup", { row: 0, col: 1, height: 150 });
d.addBox("Decision: Start with A, migrate when needed", { row: 1, col: 0, span: 2, height: 50 });

d.save("comparison.excalidraw");
```

## Golden reference

→ `examples/diagram_api.excalidraw` (architecture diagram shows grid layout pattern)
