# Flowchart Template

Decision trees, process flows, and branching logic. DAG structure with
automatic dagre layout.

Belongs to `flow` archetype.

## When to use

- Process workflows, decision trees
- Authentication flows, validation logic
- If/else branching, state machines
- Any linear process with branches

## Information slots (required)

- [ ] Start node (rectangle or ellipse)
- [ ] 1+ decision nodes (diamond shape)
- [ ] End/terminal nodes for each branch
- [ ] Edge labels on decision branches (Yes/No, Success/Failure)

## Visual hierarchy

1. Start at top, outcomes at bottom
2. Decision diamonds split the flow
3. Branch labels on arrows (keep ≤ 10 chars)
4. Terminal nodes use ellipse shape

## Layout rules

- Direction: **TB** (top-to-bottom default)
- `flowchart` type → dagre engine (auto-layout)
- Diamond shape for decisions
- Max 20 nodes for readability
- Keep labels short (≤ 20 chars) to avoid dagre overlap

## Anti-patterns

- ❌ Missing edge labels on decision branches
- ❌ Too many branches from one node (max 3)
- ❌ Circular loops without clear entry/exit

## Recommended API

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "flowchart",
  direction: "TB",
  nodes: [
    { id: "Start", label: "Start", shape: "ellipse" },
    { id: "Input", label: "Get Input" },
    { id: "Validate", label: "Valid?", shape: "diamond" },
    { id: "Process", label: "Process" },
    { id: "Error", label: "Show Error" },
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

## Supported shapes

| shape | visual | use |
|-------|--------|-----|
| `rectangle` | Rectangle | Default |
| `diamond` | Diamond | Decisions |
| `ellipse` | Ellipse | Start/end |
| `roundrect` | Rounded rectangle | Sub-process |

## Golden reference

→ `tests/expected/flowchart.excalidraw`
→ `tests/expected/flowchart_json.excalidraw`
