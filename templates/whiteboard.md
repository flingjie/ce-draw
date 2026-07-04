# Whiteboard Template

Use when the user asks for a freeform sketch, whiteboard, brainstorm,
rough idea, or comparison diagram.

## Mermaid Approach

Mermaid works for structured whiteboard content like mind-map-style flows:

```ts
import { mermaidToExcalidraw } from "ec-draw";

const mermaid = `
flowchart TD
    Core[Core Problem] --> Idea1[Solution A]
    Core --> Idea2[Solution B]
    Core --> Idea3[Solution C]
    Idea1 --> Tradeoff1[Cost: High]
    Idea1 --> Tradeoff2[Speed: Fast]
    Idea2 --> Tradeoff3[Cost: Low]
    Idea2 --> Tradeoff4[Speed: Slow]
`;
mermaidToExcalidraw(mermaid, "sketchy");
```

## Diagram Builder Approach (for freeform layouts)

```ts
import { Diagram } from "ec-draw";

// Brainstorm: central idea with surrounding concepts
const d = new Diagram("sketchy", { cols: 3, cellW: 170, cellH: 75, gapX: 50, gapY: 50 });

d.addBox("Core Problem", { row: 1, col: 1, shape: "ellipse", width: 200, height: 90 });

const ideas = [
  ["User Experience", 0, 0],
  ["Performance", 0, 2],
  ["Cost", 2, 0],
  ["Complexity", 2, 2],
];

for (const [text, row, col] of ideas) {
  d.addBox(text, { row, col });
  d.addArrow(text, "Core Problem");
}

d.save("brainstorm.excalidraw");
```

### Comparison / Pro-Con

```ts
const d = new Diagram("sketchy", { cols: 2, cellW: 280, cellH: 160, gapX: 40 });

d.addBox("Option A\n\n✓ Simple\n✓ Fast to build\n✗ Hard to scale", { row: 0, col: 0, height: 160 });
d.addBox("Option B\n\n✓ Scalable\n✓ Flexible\n✗ Complex setup", { row: 0, col: 1, height: 160 });
d.addBox("Decision: Start with A, migrate when needed", { row: 1, col: 0, span: 2, height: 60 });

d.save("comparison.excalidraw");
```

## Tips
- Use `\n` in labels for multiline text
- Mix shapes: ellipse for ideas, diamond for decisions
- Whiteboards are meant to be rough — use `sketchy` theme
- `span: N` for wide summary boxes
