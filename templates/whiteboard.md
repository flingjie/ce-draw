# Whiteboard Template

Use when the user asks for a freeform sketch, whiteboard, brainstorm,
rough idea, or comparison diagram.

## Diagram Builder Approach

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

### Mind Map via JSON Descriptor

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "flowchart",
  direction: "TD",
  nodes: [
    { id: "Core", label: "Core Problem" },
    { id: "Idea1", label: "Solution A" },
    { id: "Idea2", label: "Solution B" },
    { id: "Idea3", label: "Solution C" },
    { id: "Cost1", label: "Cost: High" },
    { id: "Speed1", label: "Speed: Fast" },
    { id: "Cost2", label: "Cost: Low" },
    { id: "Speed2", label: "Speed: Slow" },
  ],
  edges: [
    { from: "Core", to: "Idea1" },
    { from: "Core", to: "Idea2" },
    { from: "Core", to: "Idea3" },
    { from: "Idea1", to: "Cost1" },
    { from: "Idea1", to: "Speed1" },
    { from: "Idea2", to: "Cost2" },
    { from: "Idea2", to: "Speed2" },
  ],
}, "sketchy");
```

## Tips
- Use `\n` in labels for multiline text
- Mix shapes: ellipse for ideas, diamond for decisions
- Whiteboards are meant to be rough — use `sketchy` theme
- `span: N` for wide summary boxes
