---
name: ec-draw
description: >
  Generate hand-drawn Excalidraw diagrams from Mermaid syntax. Use when the user
  asks to draw, sketch, or create a diagram, flowchart, architecture diagram,
  sequence diagram, ER diagram, UML diagram, mind map, whiteboard, or any visual
  diagram. Trigger on "draw", "sketch", "diagram", "flowchart", "visualize",
  "excalidraw".
---

# ec-draw: Excalidraw Diagram Generator

Generate themed, hand-drawn `.excalidraw` files from Mermaid syntax.

## Workflow

1. Understand the user's diagram request
2. Write Mermaid syntax (see reference below)
3. Save to a temp file, then run: `node dist/cli.js mermaid /tmp/diagram.mmd -o OUTPUT.excalidraw -t THEME`
4. Or use the API: `mermaidToExcalidraw(mermaidText, "sketchy")`
5. Report the output path

## Quick Start

```ts
import { mermaidToExcalidraw } from "ec-draw";

const doc = mermaidToExcalidraw(`
flowchart TD
    A[Login] --> B{Valid?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Error]
`, "sketchy");
```

## Mermaid Syntax

Full reference: `references/mermaid_syntax.md` — covers flowchart, sequence, ER, and class diagram syntax with examples.

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
- **Rounded corners** on shapes (type 3) for a friendly look
- **Color cycling** — each box gets the next color in the theme palette
- **Bound text** — labels are proper Excalidraw text elements bound to their containers
- **dagre layout** — same layout engine Mermaid uses, for professional node positioning

## Templates

Read from `templates/` for pattern guidance per diagram type:
- `templates/flowchart.md` — decision trees, process flows, state machines
- `templates/architecture.md` — system diagrams, service topology, infra
- `templates/sequence.md` — API flows, message passing, timelines
- `templates/er.md` — entity-relationship diagrams, data models
- `templates/whiteboard.md` — freeform sketches, brainstorms, comparisons

## Built-in Icons

From `library/icons.json`: `database`, `server`, `cloud`, `user`, `gear`, `document`, `globe`, `mobile`, `lock`, `fire`, `message_queue`, `firewall`, `scissors`, `brain`, `tag`, `embed`, `cluster`.

Use via Diagram API: `d.addIcon("database", 200, 100, 0)`.

## External Icon Libraries

Five `.excalidrawlib` files in `library/` provide reusable element presets:

| Library | Items | Naming | Usage Pattern |
|---------|-------|--------|---------------|
| `google-icons` | 139 | Named (e.g. "Compute Engine") | `d.addLibraryIcon("google-icons", "Compute Engine", x, y)` |
| `stick-figures` | 9 | Named (e.g. "Stick man") | `d.addLibraryIcon("stick-figures", "Stick man", x, y)` |
| `stick-people` | 7 | Named (e.g. "Stick man standard looking left") | `d.addLibraryIcon("stick-people", "Stick man standard looking left", x, y)` |
| `awesome-icons` | 24 | Anonymous (`awesome-icons:0`-`:23`) | `d.addLibraryIcon("awesome-icons", "awesome-icons:0", x, y)` |
| `software-architecture` | 7 | Anonymous (`software-architecture:0`-`:6`) | `d.addLibraryIcon("software-architecture", "software-architecture:0", x, y)` |

To list icons within a library:
```ts
import { listLibrary, listLibraries } from "ec-draw";
console.log(listLibraries());          // all available libraries
console.log(listLibrary("google-icons")); // all icon names in that library
```

Placement works automatically: icons are repositioned so their bounding-box origin lands at (x, y).

## Tips

1. **Mermaid first** — dagre layout beats manual positioning for structured diagrams
2. **Decision nodes are diamonds** — `{Label}` in Mermaid, `shape: "diamond"` in API
3. **Pick the right theme** — sketchy for brainstorming, professional for docs
4. **Check the icon library** — before drawing common infra shapes
5. **Keep labels short** — ≤20 chars to avoid overlap in dagre layout
6. **One diagram per script** — each output should be exactly one `.excalidraw` file
7. **Ask if ambiguous** — clarify diagram type if the user's request is vague
