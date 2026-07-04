---
name: ec-draw
description: >
  Generate high-quality Excalidraw diagrams with consistent hand-drawn style.
  Use whenever the user asks to draw, sketch, or create a diagram, flowchart,
  architecture diagram, whiteboard sketch, ER diagram, sequence diagram, UML
  diagram, mind map, or any visual diagram — even if they don't explicitly say
  "excalidraw". Also trigger on "draw this", "visualize this", "sketch this
  out", "make a diagram of", "create a visual of", or when asked to explain
  something that would benefit from a diagram.
compatibility: requires Python 3.9+, no other dependencies
---

# ec-draw: Excalidraw Diagram Generator

Generate consistent, styled Excalidraw diagrams using the `ec_draw` Python package.
Supports two workflows:

1. **Mermaid → Excalidraw** (preferred for most cases): Generate Mermaid syntax, convert
   to themed Excalidraw. Mermaid auto-layouts nodes, so this is great for flowcharts,
   sequence diagrams, ER diagrams, and class diagrams.

2. **Direct Python API**: Use the `Diagram` builder for full control — architecture diagrams,
   whiteboard sketches, and custom layouts.

## Mermaid → Excalidraw (Recommended)

AI generates Mermaid syntax, ec-draw converts it to hand-drawn Excalidraw:

```python
from ec_draw import mermaid_to_diagram

mermaid = """
flowchart TD
    A[Login] --> B{Valid?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Error]
    C --> E[Home]
    D --> A
"""

d = mermaid_to_diagram(mermaid, theme="sketchy")
d.save("flowchart.excalidraw")
```

Mermaid gives you **automatic node positioning** via Mermaid's layout engine —
you don't need to specify x/y coordinates. Just describe the relationships
and ec-draw handles the rest.

### Supported Mermaid Types

| Type | Mermaid Keyword | Example |
|------|----------------|---------|
| Flowchart | `flowchart TD` / `flowchart LR` | Process flows, decision trees |
| Sequence | `sequenceDiagram` | API flows, message passing |
| ER Diagram | `erDiagram` | Database schemas, entities |
| Class Diagram | `classDiagram` | UML class hierarchies |

### Mermaid → Excalidraw Best Practices

1. **Use Mermaid for structured diagrams** — flowcharts, sequences, ER, and class diagrams
   where Mermaid's layout engine produces great results
2. **Use the Python API for freeform layouts** — architecture diagrams, whiteboards, and
   custom visual arrangements
3. **Pick the right theme** — `sketchy` for brainstorming, `professional` for docs
4. **Let Mermaid handle layout** — don't fight it; if nodes overlap, adjust the Mermaid
   syntax (e.g., add `subgraph` for grouping)

## Quick Start

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy")
d.add_box("Start", row=0, col=0)
d.add_box("Process", row=1, col=0)
d.add_box("End", row=2, col=0)
d.add_arrow("Start", "Process")
d.add_arrow("Process", "End")
d.save("output.excalidraw")
```

## Workflow

1. **Understand the request** — what kind of diagram does the user need?
   (flowchart, architecture, sequence, ER, UML, mind map, whiteboard)

2. **Choose the approach**:
   - **Mermaid** (flowcharts, sequences, ER, class diagrams): Generate Mermaid
     syntax, call `mermaid_to_diagram()`. The Mermaid layout engine auto-positions everything.
   - **Python API** (architecture, whiteboard, custom layouts): Read the relevant
     template from `templates/`, write a script using the `Diagram` builder.

3. **Write a Python script** using either `mermaid_to_diagram()` or the `Diagram` API

4. **Run the script** with `python3 script.py` to produce a `.excalidraw` file

5. **Report the output** — tell the user the file path and suggest opening it
   at https://excalidraw.com

## API Reference

### Mermaid API

```python
from ec_draw import mermaid_to_diagram

mermaid_to_diagram(mermaid_text, theme="sketchy", **diagram_kwargs) -> Diagram
```

Converts Mermaid syntax to a themed Diagram. The returned Diagram can be
customized further (add extra elements) before saving.

```python
from ec_draw import parse_mermaid

parse_mermaid(mermaid_text) -> dict
```

Parses Mermaid syntax without rendering. Returns structured data with
nodes, edges, and type info. Useful for inspecting or modifying the
intermediate representation before rendering.

### Diagram (Python API)

```python
Diagram(
    theme="sketchy",        # "sketchy" | "professional" | "dark" | "colorful"
    cols=3,                  # default grid columns
    cell_w=160,              # default cell width
    cell_h=80,               # default cell height
    gap_x=40,                # horizontal gap
    gap_y=50,                # vertical gap
)
```

### Methods

| Method | Description |
|--------|-------------|
| `d.add_box(name, *, row, col, span=1, width, height, shape="rect")` | Add a labeled shape. `shape` can be "rect", "ellipse", or "diamond". Returns the element dict. |
| `d.add_arrow(from_name, to_name, *, label, start_arrowhead, end_arrowhead)` | Connect two named boxes with an arrow. `end_arrowhead` defaults to "arrow". |
| `d.add_text(content, x, y, *, font_size)` | Add standalone text at a position. |
| `d.add_line(x1, y1, x2, y2)` | Add a plain line (no arrowheads). |
| `d.add_frame(name, x, y, width, height)` | Add a dashed frame around a region. |
| `d.add_element(dict)` | Add a raw Excalidraw element dict directly. |
| `d.save(path)` | Write the `.excalidraw` file. |
| `d.to_json()` | Return the JSON string. |
| `d.to_dict()` | Return the document dict. |

### Low-Level Element Builders

For manual element construction (bypass the Diagram builder):

```python
from ec_draw import rect, ellipse, diamond, arrow, line, text_label, frame, get_theme

theme = get_theme("sketchy")

# Build individual elements with full control
r = rect(100, 100, 200, 80, text="Hello", theme=theme, color_index=0)
e = ellipse(400, 100, 150, 150, theme=theme, color_index=1)
a = arrow(300, 140, 400, 175, label="flows to", theme=theme)
t = text_label(150, 300, "A standalone label", theme=theme, fontSize=20)
```

Every element builder accepts `**overrides` for any Excalidraw property
(e.g., `strokeColor="#ff0000"`, `roughness=0`, `opacity=50`).

### Layout Helpers

```python
from ec_draw import layout

# Vertical stack
positions = layout.vertical(5, item_h=70, gap=30)
# → [(x, y, w, h), ...] for 5 items

# Horizontal row
positions = layout.horizontal(4, item_w=140, gap=30)
# → [(x, y, w, h), ...] for 4 items

# Tree layout (parent → children)
parents, children = layout.tree(
    3, [2, 3, 2], direction="TB", gap_parent=200
)
# → parent positions + child positions per parent

# Layered architecture
layers = layout.layered([3, 5, 2])
# → list of layer dicts with rect, items, and label positions
```

## Themes

| Theme | Look | Use When |
|-------|------|----------|
| `sketchy` | Hand-drawn, warm earth tones, Virgil font | Brainstorming, early ideas, informal docs |
| `professional` | Clean lines, blue/gray palette, Helvetica font | Architecture docs, formal presentations |
| `dark` | Dark background, neon accents | Dark-mode presentations, terminal/tech contexts |
| `colorful` | Bright primaries, playful | Slides, teaching, demos |

Use `list_themes()` to see all available themes at runtime.

## Style Guide

All ec-draw output follows these principles:
- **Consistent roughness** — theme controls the hand-drawn feel (0=crisp, 1=slight, 2=sketchy)
- **Rounded corners** on shapes (roundness type 3) for a friendly look
- **Color cycling** — each box gets the next color in the theme's palette
- **Bound text** — labels are proper Excalidraw text elements bound to their containers
- **Light backgrounds** — warm off-white (#F8F5F0) unless dark theme
- **Arrow connectors** — drawn center-to-center between named boxes

## Using the Library

The `library/icons.json` file contains reusable element presets for common
diagram symbols (database cylinder, user icon, gear, cloud, server, etc.).
Load it with:

```python
import json
with open("library/icons.json") as f:
    icons = json.load(f)

# Use an icon preset
db_elem = dict(icons["database"])
db_elem["x"] = 200
db_elem["y"] = 300
d.add_element(db_elem)
```

## Templates

When the user's request matches a diagram type, read the corresponding
template from `templates/` for guidance on element layout, common patterns,
and best practices for that diagram type:

- `templates/flowchart.md` — decision trees, process flows, state machines
- `templates/architecture.md` — system diagrams, service topology, infra
- `templates/sequence.md` — message flows, API interactions, timelines
- `templates/er.md` — entity-relationship diagrams, data models
- `templates/whiteboard.md` — freeform sketches, brain dumps, rough ideas

## Tips

1. **Always use themes** — never hardcode colors. Pick a theme that matches the user's context
2. **Name boxes meaningfully** — names are used as labels AND as keys for arrow connections
3. **Use auto-layout first** — let the grid position elements, then override positions for fine-tuning
4. **Decision nodes are diamonds** — use `shape="diamond"` for decision/conditional boxes
5. **Frames group related elements** — wrap services in a frame to show layers or domains
6. **Check the library first** — before drawing a common icon (database, user, server), check `library/icons.json`
7. **One script, one diagram** — each Python script should produce exactly one `.excalidraw` file
