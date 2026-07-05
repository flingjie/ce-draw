---
name: ec-draw
description: >
  Generate hand-drawn Excalidraw diagrams. Use when the user asks to draw, sketch,
  or create a diagram, flowchart, architecture diagram, concept diagram, or any visual diagram.
  Trigger on "draw", "sketch", "diagram", "flowchart", "visualize", "excalidraw".
---

# ec-draw: Excalidraw Diagram Generator

Generate themed `.excalidraw` files by filling a template's content slots and calling `renderFromRecipe`.

## Workflow

1. **Pick a template** — Read the matching template from `templates/` for the diagram type the user wants:
   - `templates/narrative-framework.md` — concept diagrams, frameworks, mental models
   - `templates/flowchart.md` — decision trees, process flows (coming soon in recipe format)
   - `templates/architecture.md` — system topology diagrams (coming soon in recipe format)

2. **Fill the slots** — Each template defines a `## Slots` section. Fill in the content (headings, items, icons, labels) based on what the user asked for. Templates define grid, colors, and layout — do NOT include coordinates or hex colors in your slots.

3. **Call `renderFromRecipe`** — Pass the template ID, your filled slots, and the theme:

```ts
import { renderFromRecipe } from "ec-draw";
import { writeFileSync } from "fs";

const doc = renderFromRecipe("narrative-framework", {
  title: "Diagram Title",
  sections: [
    {
      heading: "Section 1",
      role: "primary",
      items: [{ title: "Card A", subtitle: "description", icon: "cloud" }],
    },
    // ... more sections
  ],
  transitions: [
    { from: 0, to: 1, label: "describes the relationship" },
  ],
  callout: { text: "Key insight message", icon: "fire" },
}, "sketchy");

writeFileSync("output.excalidraw", JSON.stringify(doc, null, 2), "utf-8");
```

4. **Save** — Write to `.excalidraw` file.

## Themes

| Theme | Best for |
|-------|----------|
| `sketchy` | Brainstorming, early ideas (default) |
| `professional` | Architecture docs, formal presentations |
| `dark` | Dark-mode contexts |
| `colorful` | Slides, teaching, demos |

## Built-in Icons

`database`, `server`, `cloud`, `user`, `gear`, `document`, `globe`, `mobile`, `lock`, `fire`, `brain`, `code`.

## Tips

- **Read the template before writing slots** — each template defines its own roles, grid, and rules
- **Transitions must have labels** — never create silent arrows between sections
- **Use roles from the template's table** — don't invent new role names
- **Match icons to semantic meaning** — `cloud` for external services, `lock` for security, `gear` for processing
