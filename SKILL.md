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

### Preferred: API (in-process, no temp files)

```ts
import { mermaidToExcalidraw } from "ec-draw";
import { writeFileSync } from "fs";

const doc = mermaidToExcalidraw(mermaidText, "sketchy");
writeFileSync("output.excalidraw", JSON.stringify(doc, null, 2), "utf-8");
```

### Alternative: CLI (separate process)

```bash
# From file
node dist/cli.js mermaid /tmp/diagram.mmd -o output.excalidraw -t sketchy

# From stdin (no temp file needed)
echo "flowchart TD\n  A --> B" | node dist/cli.js mermaid - -o output.excalidraw -t professional

# Inline
node dist/cli.js mermaid "flowchart TD; A-->B" -o output.excalidraw
```

> **Note:** The CLI shell is the package root (`ce-draw/`). Run `npm run build` first if `dist/` is stale.

### Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| "No nodes found" | Empty or malformed Mermaid | Check syntax: nodes need `[...]`, `{...}`, `(...)` |
| "Unknown theme" | Typo | Use `--list-themes` to see valid names |
| Overlapping labels | Labels too long | Keep labels ≤20 chars; use `\n` for line breaks |
| Module not found | dist/ not built | Run `npm run build` |

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
- **Smart layout** — layout router auto-selects the best engine per diagram type

## Layout Engines

ec-draw includes 4 layout engines with a smart router that auto-selects the right one:

| Diagram Type | Engine | Behavior |
|-------------|--------|----------|
| `flowchart` TB/LR/RL/BT | **dagre** | Auto-layout with dagre, same engine Mermaid uses |
| `sequence` | **sequence** | Participant boxes (dagre) + lifelines + message slots |
| `er` / `class` | **dagre** | Entity/class boxes with dagre positioning |
| `pipeline` / `workflow` | **pipeline** | Linear equidistant stages (CI/CD, deployment flows) |
| `architecture` / `arch` | **grid** | Manual row×column grid layout |

### Using the router directly

```ts
import { routeLayout } from "ec-draw";

const layout = routeLayout("pipeline", nodes, edges, { direction: "LR" });
// layout.positions → Map<string, {x, y, width, height}>
// layout.type → "pipeline"
```

### Using individual engines

```ts
import { dagreLayout, gridLayout, pipelineLayout } from "ec-draw";

const dagreResult = dagreLayout(nodes, edges, { direction: "TB" });
const gridResult = gridLayout(nodes, edges, { cols: 4, cellW: 160 });
const pipeResult = pipelineLayout(nodes, edges, { direction: "LR", stageGap: 60 });
```

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

### Automatic Icon Resolution

When a node label matches a registered icon (name, alias, or keyword), the rectangle is **automatically replaced** with the icon shape. No extra code needed — just name your nodes appropriately in Mermaid:

```
flowchart TD
    CDN[CloudFront] --> LB[Load Balancer]
    LB --> Auth[auth service]
    Auth --> DB[(PostgreSQL)]
    DB --> Cache[Redis]
```

| Label contains… | Resolves to icon | Examples |
|-----------------|-----------------|----------|
| `database`, `db`, `sql`, `postgres`, `redis`, `memcached`, `storage` | `database` | `PostgreSQL`, `[(Redis)]` |
| `server`, `service`, `backend`, `api`, `instance`, `node` | `server` | `Auth Service`, `API Server` |
| `cloud`, `cdn`, `internet`, `external` | `cloud` | `CloudFront`, `CDN` |
| `user`, `customer`, `client`, `person`, `account` | `user` | `Users`, `Customer` |
| `lock`, `auth`, `security`, `ssl`, `tls` | `lock` | `Auth`, `SSL Terminator` |
| `queue`, `mq`, `kafka`, `sqs`, `pubsub`, `broker` | `message_queue` | `Message Queue`, `Kafka` |
| `ai`, `ml`, `model`, `llm`, `gpt`, `inference` | `brain` | `ML Model`, `LLM` |
| `firewall`, `waf`, `sg`, `security-group` | `firewall` | `WAF`, `Security Group` |
| `mobile`, `phone`, `ios`, `android`, `app` | `mobile` | `iOS App`, `Mobile Client` |
| `config`, `settings`, `engine`, `processor` | `gear` | `Config`, `Rule Engine` |
| `file`, `document`, `doc`, `page` | `document` | `Docs`, `File Store` |
| `web`, `world`, `global`, `public` | `globe` | `Web`, `Public Internet` |

> **Tip:** Frame icon-friendly node labels in Mermaid with `[]` (not `{}` or `()`) so shape replacement works. ER diagram entities also get auto-resolved.

## Tips

1. **API first, CLI when needed** — import `mermaidToExcalidraw` directly; use CLI only for shell pipelines
2. **Mermaid first** — dagre layout beats manual positioning for structured diagrams
3. **Decision nodes are diamonds** — `{Label}` in Mermaid, `shape: "diamond"` in API
4. **Pick the right theme** — sketchy for brainstorming, professional for docs
5. **Name nodes for auto-resolution** — use descriptive labels (`PostgreSQL`, `Auth Service`) so icons resolve automatically
6. **Keep labels short** — ≤20 chars to avoid overlap in dagre layout
7. **One diagram per script** — each output should be exactly one `.excalidraw` file
8. **Ask if ambiguous** — clarify diagram type if the user's request is vague
9. **Use `addText` for annotations** — `d.addText("note", x, y, 12)` for standalone labels outside shapes
