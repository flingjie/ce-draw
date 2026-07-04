# Flowchart Template

Use when the user asks for a flowchart, process diagram, decision tree,
state machine, or workflow.

## Mermaid Approach (Recommended)

```ts
import { mermaidToExcalidraw } from "ec-draw";

const mermaid = `
flowchart TD
    Start[Start] --> Input[Get Input]
    Input --> Validate{Valid?}
    Validate -->|Yes| Process[Process]
    Validate -->|No| Error[Show Error]
    Process --> End[End]
    Error --> Input
`;

doc = mermaidToExcalidraw(mermaid, "sketchy");
```

### Mermaid Flowchart Syntax

```
flowchart TD              Top→Down (also TB, LR, RL, BT)
    A[rectangle label]    Rectangle
    B{diamond label}      Diamond (decision)
    C((circle label))     Circle/ellipse
    D[(database label)]   Database cylinder
    A --> B               Arrow
    A -->|label| B        Labeled arrow
    A -.-> B              Dotted
    A ==> B               Thick
```

### Branching Flow

```ts
const mermaid = `
flowchart TD
    Start[Start] --> Check{Type?}
    Check -->|A| HandleA[Handle A]
    Check -->|B| HandleB[Handle B]
    Check -->|C| HandleC[Handle C]
    HandleA --> Merge[Done]
    HandleB --> Merge
    HandleC --> Merge
`;
mermaidToExcalidraw(mermaid, "sketchy");
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
- Decision nodes: use `{label}` in Mermaid, `shape: "diamond"` in the builder
- `cols: 1` for vertical flows, `cols > 1` for branching
- Keep labels short (≤20 chars) to avoid overlap
