# Flowchart Template

Use when the user asks for a flowchart, process diagram, decision tree,
state machine, or workflow.

## JSON Descriptor Approach (Recommended for structured flows)

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "flowchart",
  direction: "TB",
  nodes: [
    { id: "Start", label: "Start", shape: "rectangle" },
    { id: "Input", label: "Get Input", shape: "rectangle" },
    { id: "Validate", label: "Valid?", shape: "diamond" },
    { id: "Process", label: "Process", shape: "rectangle" },
    { id: "Error", label: "Show Error", shape: "rectangle" },
    { id: "End", label: "End", shape: "ellipse" },
  ],
  edges: [
    { from: "Start", to: "Input" },
    { from: "Input", to: "Validate" },
    { from: "Validate", to: "Process", label: "Yes" },
    { from: "Validate", to: "Error", label: "No" },
    { from: "Process", to: "End" },
    { from: "Error", to: "Input" },
  ],
}, "sketchy");
```

### Supported shapes

| shape | visual |
|-------|--------|
| `rectangle` | Rectangle (default) |
| `diamond` | Diamond (decisions) |
| `ellipse` | Ellipse (start/end) |
| `roundrect` | Rounded rectangle |

### Branching Flow

```ts
const doc = renderDiagram({
  type: "flowchart",
  direction: "TB",
  nodes: [
    { id: "Start", label: "Start" },
    { id: "Check", label: "Type?", shape: "diamond" },
    { id: "HandleA", label: "Handle A" },
    { id: "HandleB", label: "Handle B" },
    { id: "HandleC", label: "Handle C" },
    { id: "Done", label: "Done" },
  ],
  edges: [
    { from: "Start", to: "Check" },
    { from: "Check", to: "HandleA", label: "A" },
    { from: "Check", to: "HandleB", label: "B" },
    { from: "Check", to: "HandleC", label: "C" },
    { from: "HandleA", to: "Done" },
    { from: "HandleB", to: "Done" },
    { from: "HandleC", to: "Done" },
  ],
}, "sketchy");
```

## Diagram Builder Approach (for custom layouts)

```ts
import { Diagram } from "ec-draw";

const d = new Diagram("sketchy", { cols: 1, cellW: 200, cellH: 70, gapY: 50 });

const steps = ["Start", "Validate Input", "Process", "Save", "End"];
for (let i = 0; i < steps.length; i++) {
  const shape = steps[i].endsWith("?") ? "diamond" : "rectangle";
  d.addBox(steps[i], { row: i, col: 0, shape });
}
for (let i = 0; i < steps.length - 1; i++) {
  d.addArrow(steps[i], steps[i + 1]);
}
d.save("flowchart.excalidraw");
```

## Tips
- Decision nodes: use `shape: "diamond"` in both approaches
- `cols: 1` for vertical flows, `cols > 1` for branching
- Keep labels short (≤20 chars) to avoid overlap
- Use `direction: "LR"` for horizontal flows
