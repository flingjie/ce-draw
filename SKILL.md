---
name: ec-draw
description: >
  Generate hand-drawn Excalidraw diagrams. Use when the user asks to draw, sketch,
  or create a diagram, flowchart, architecture diagram, sequence diagram, ER diagram,
  UML diagram, mind map, whiteboard, or any visual diagram. Trigger on "draw",
  "sketch", "diagram", "flowchart", "visualize", "excalidraw".
---

# ec-draw: Excalidraw Diagram Generator

Generate themed, hand-drawn `.excalidraw` files via a programmatic Diagram API
or a declarative JSON descriptor.

## Workflow

### Preferred: Diagram API (in-process, no temp files)

```ts
import { Diagram } from "ec-draw";
import { writeFileSync } from "fs";

const d = new Diagram("sketchy");

d.addBox("Login", { row: 0, col: 1 });
d.addBox("Valid?", { row: 1, col: 1, shape: "diamond" });
d.addBox("Dashboard", { row: 2, col: 0 });
d.addBox("Error", { row: 2, col: 2 });

d.addArrow("Login", "Valid?");
d.addArrow("Valid?", "Dashboard", { label: "Yes" });
d.addArrow("Valid?", "Error", { label: "No" });

d.save("output.excalidraw");
```

### Alternative: JSON Descriptor (declarative)

```ts
import { renderDiagram } from "ec-draw";
import { writeFileSync } from "fs";

const doc = renderDiagram({
  type: "flowchart",
  direction: "TB",
  nodes: [
    { id: "A", label: "Login", shape: "rectangle" },
    { id: "B", label: "Valid?", shape: "diamond" },
    { id: "C", label: "Dashboard", shape: "rectangle" },
    { id: "D", label: "Error", shape: "rectangle" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C", label: "Yes" },
    { from: "B", to: "D", label: "No" },
  ],
}, "sketchy");

writeFileSync("output.excalidraw", JSON.stringify(doc, null, 2), "utf-8");
```

### CLI

```bash
# JS script mode (runs a Diagram-exporting script)
node dist/cli.js run diagram.js -o output.excalidraw -t sketchy

# JSON descriptor mode
node dist/cli.js render diagram.json -o output.excalidraw

# List available options
node dist/cli.js --list-themes
node dist/cli.js --list-icons
node dist/cli.js --list-libraries
```

> **Note:** Run `npm run build` first if `dist/` is stale.

### Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| "No nodes found" | Empty JSON or wrong format | Check JSON structure: needs `type` and `nodes` array |
| "Unknown theme" | Typo | Use `--list-themes` to see valid names |
| Overlapping labels | Labels too long | Keep labels ≤20 chars |
| Module not found | dist/ not built | Run `npm run build` |

## Quick Start

**Diagram API:**
```ts
import { Diagram } from "ec-draw";

const d = new Diagram("sketchy", { cols: 3 });
d.addBox("Start", { row: 0, col: 1 });
d.addBox("Process", { row: 1, col: 1 });
d.addBox("End", { row: 2, col: 1, shape: "ellipse" });
d.addArrow("Start", "Process");
d.addArrow("Process", "End");
d.save("flow.excalidraw");
```

**JSON Descriptor:**
```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "flowchart",
  nodes: [
    { id: "A", label: "Start" },
    { id: "B", label: "End", shape: "ellipse" },
  ],
  edges: [{ from: "A", to: "B" }],
}, "sketchy");
```

## Themes

| Theme | Look | Background | Use When |
|-------|------|------------|----------|
| `sketchy` | Hand-drawn, warm earth tones | #F8F5F0 | Brainstorming, early ideas, informal docs |
| `professional` | Clean lines, blue/gray palette | #FFFFFF | Architecture docs, formal presentations |
| `dark` | Dark background, neon accents | #111827 | Dark-mode, terminal/tech contexts |
| `colorful` | Bright primaries | #FFFBEB | Slides, teaching, demos |

## Style Guide

All output follows these principles:
- **Consistent roughness** — theme controls hand-drawn feel (0=crisp, 2=sketchy)
- **Rounded corners** on shapes for a friendly look
- **Color cycling** — each box gets the next color in the theme palette
- **Bound text** — labels are proper Excalidraw text elements bound to their containers
- **Smart layout** — layout router auto-selects the best engine per diagram type

## Layout Engines

ec-draw includes 4 layout engines with a smart router that auto-selects the right one:

| Diagram Type | Engine | Behavior |
|-------------|--------|----------|
| `flowchart` | **dagre** | Auto-layout with dagre |
| `sequence` | **sequence** | Participant boxes + lifelines + message slots |
| `er` / `class` | **dagre** | Entity/class boxes with dagre positioning |
| `pipeline` / `workflow` | **pipeline** | Linear equidistant stages |
| `architecture` / `arch` | **grid** | Manual row×column grid layout |

### Using the router

```ts
import { routeLayout } from "ec-draw";

const layout = routeLayout("pipeline", nodes, edges, { direction: "LR" });
// layout.positions → Map<string, {x, y, width, height}>
```

### Using individual engines

```ts
import { dagreLayout, gridLayout, pipelineLayout } from "ec-draw";

const result = dagreLayout(nodes, edges, { direction: "TB" });
const grid = gridLayout(nodes, edges, { cols: 4, cellW: 160 });
const pipe = pipelineLayout(nodes, edges, { direction: "LR", stageGap: 60 });
```

## Diagram API

### Constructor

```ts
new Diagram(theme: string | ThemeConfig, opts?: {
  cols?: number;   // grid columns (default 3)
  cellW?: number;  // cell width (default 160)
  cellH?: number;  // cell height (default 80)
  gapX?: number;   // horizontal gap (default 40)
  gapY?: number;   // vertical gap (default 50)
})
```

### Methods

```ts
// Add a labeled box (returns the primary element)
d.addBox(name: string, opts?: {
  row?: number; col?: number; span?: number;
  width?: number; height?: number;
  shape?: "rectangle" | "diamond" | "ellipse";
}): ExcalidrawElement

// Connect two named boxes with an arrow
d.addArrow(from: string, to: string, opts?: { label?: string }): ExcalidrawElement

// Add standalone text
d.addText(content: string, x: number, y: number, fontSize?: number): ExcalidrawElement

// Place a built-in icon
d.addIcon(iconName: string, x: number, y: number, colorIndex?: number): void

// Place an icon from an external library
d.addLibraryIcon(libraryName: string, iconName: string, x: number, y: number, colorIndex?: number): void

// Serialize to an Excalidraw document
d.toDocument(): ExcalidrawDocument

// Serialize to JSON string
d.toJSON(): string

// Save to a .excalidraw file
d.save(filepath: string): string
```

## JSON Descriptor

```ts
import { renderDiagram } from "ec-draw";

renderDiagram({
  type: "flowchart" | "sequence" | "er" | "class" | "pipeline" | "workflow" | "architecture" | "arch",
  direction?: "TB" | "LR" | "RL" | "BT",
  theme?: string,
  nodes: Array<{ id: string; label: string; shape?: "rectangle" | "diamond" | "ellipse" | "roundrect" }>,
  edges: Array<{ from: string; to: string; label?: string }>,
}, themeName?: string): ExcalidrawDocument
```

## Templates

Read from `templates/` for pattern guidance per diagram type:
- `templates/flowchart.md` — decision trees, process flows
- `templates/architecture.md` — system diagrams, service topology
- `templates/sequence.md` — API flows, message passing
- `templates/er.md` — entity-relationship diagrams
- `templates/whiteboard.md` — freeform sketches, comparisons

## Built-in Icons

`database`, `server`, `cloud`, `user`, `gear`, `document`, `globe`, `mobile`, `lock`, `fire`, `message_queue`, `firewall`.

Use via Diagram API: `d.addIcon("database", 200, 100, 0)`.

## External Icon Libraries

`.excalidrawlib` files in `library/` provide reusable element presets:

| Library | Items | Usage |
|---------|-------|-------|
| `google-icons` | 139 | `d.addLibraryIcon("google-icons", "Compute Engine", x, y)` |
| `stick-figures` | 9 | `d.addLibraryIcon("stick-figures", "Stick man", x, y)` |
| `stick-people` | 7 | `d.addLibraryIcon("stick-people", "Stick man standard looking left", x, y)` |
| `awesome-icons` | 24 | `d.addLibraryIcon("awesome-icons", "awesome-icons:0", x, y)` |
| `software-architecture` | 7 | `d.addLibraryIcon("software-architecture", "software-architecture:0", x, y)` |

```ts
import { listLibrary, listLibraries } from "ec-draw";
console.log(listLibraries());           // all available libraries
console.log(listLibrary("google-icons")); // all icon names in that library
```

## Tips

1. **Diagram API for control** — use `new Diagram()` when you need precise positioning
2. **JSON descriptor for structure** — use `renderDiagram()` with layout engines for auto-layout
3. **Decision nodes are diamonds** — `shape: "diamond"` in Diagram API or JSON descriptor
4. **Pick the right theme** — sketchy for brainstorming, professional for docs
5. **Keep labels short** — ≤20 chars to avoid overlap in dagre layout
6. **One diagram per script** — each output should be exactly one `.excalidraw` file
7. **Ask if ambiguous** — clarify diagram type if the user's request is vague
8. **Use `addText` for annotations** — `d.addText("note", x, y, 12)` for standalone labels
