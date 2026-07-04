# ec-draw

Generate hand-drawn Excalidraw diagrams from Mermaid syntax. A skill for
Claude Code and Codex that produces themed `.excalidraw` files.

```bash
echo "flowchart TD
    A[Login] --> B{Valid?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Error]" | npx tsx scripts/render.ts -o flow.excalidraw -t sketchy
```

## Features

- **Mermaid → Excalidraw** — dagre layout engine, themed styling
- **4 themes** — sketchy, professional, dark, colorful
- **Style normalization** — consistent roughness, palette, font
- **Icon library** — 10 reusable presets
- **Skill mode** — SKILL.md + scripts/ + references/

## Project Structure

```
ec-draw/
├── SKILL.md                     # Skill definition
├── scripts/
│   └── render.ts                # Main renderer: Mermaid → Excalidraw
├── src/                         # TypeScript library
│   ├── mermaid.ts               # Mermaid parser + dagre layout
│   ├── diagram.ts               # Diagram builder API
│   ├── normalize.ts             # Style normalization
│   ├── themes.ts                # 4 visual themes
│   ├── library.ts               # Icon library
│   └── index.ts                 # Public API
├── references/
│   ├── mermaid_syntax.md        # Mermaid syntax reference
│   └── excalidraw_schema.md     # Excalidraw JSON schema
├── templates/                   # Prompt templates per diagram type
├── examples/                    # Example .excalidraw outputs
├── library/
│   └── icons.json               # Icon presets
└── README.md
```

## Quick Start

```bash
# From Mermaid file
npx tsx scripts/render.ts -i diagram.mmd -o output.excalidraw -t sketchy

# Pipe Mermaid text
echo "flowchart TD\n  A[Start] --> B[End]" | npx tsx scripts/render.ts -o flow.excalidraw

# From stdin
npx tsx scripts/render.ts -t professional < diagram.mmd
```

## Themes

| Theme | Look | Background |
|-------|------|------------|
| `sketchy` | Hand-drawn, warm earth tones | #F8F5F0 |
| `professional` | Clean lines, blue/gray | #FFFFFF |
| `dark` | Dark bg, neon accents | #111827 |
| `colorful` | Bright primaries | #FFFBEB |

## API

```ts
import { mermaidToExcalidraw, Diagram } from "./src/index.js";

// Mermaid → Excalidraw
const doc = await mermaidToExcalidraw(`
flowchart TD
    A[Login] --> B{Valid?}
`, "sketchy");

// Diagram builder
const d = new Diagram("professional", { cols: 3 });
d.addBox("API", { row: 0, col: 0, span: 3 });
d.addArrow("API", "Auth");
d.save("arch.excalidraw");
```

## License

MIT
