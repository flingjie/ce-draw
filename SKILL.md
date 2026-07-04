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
2. Write Mermaid syntax (see `references/mermaid_syntax.md`)
3. Pipe to renderer: `echo "MERMAID" | npx tsx scripts/render.ts -o OUTPUT.excalidraw -t THEME`
4. Report the output path

## Quick Start

```bash
# From a Mermaid file
npx tsx scripts/render.ts -i diagram.mmd -o output.excalidraw -t sketchy

# Pipe Mermaid directly
cat << 'EOF' | npx tsx scripts/render.ts -o login_flow.excalidraw -t sketchy
flowchart TD
    A[Login] --> B{Valid?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Error]
EOF
```

## Resources

- `scripts/render.ts` — main renderer: Mermaid → Excalidraw
- `references/mermaid_syntax.md` — Mermaid syntax reference
- `references/excalidraw_schema.md` — Excalidraw JSON schema
- `templates/` — pattern guidance per diagram type
- `library/icons.json` — reusable icon presets
