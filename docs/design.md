# ec-draw Design Document

## Overview

ec-draw is an open-source Python library + Claude Code skill for generating Excalidraw
diagrams programmatically. The skill lets Claude Code produce consistent, styled,
hand-drawn diagrams from natural language requests.

## Architecture

```
ec-draw/
├── SKILL.md                    # Claude Code skill definition
├── ec_draw/                    # Python package
│   ├── __init__.py             # Public API surface
│   ├── elements.py             # Element builders (rect, ellipse, arrow, text, line, diamond)
│   ├── layout.py               # Auto-layout engines (grid, tree, layered, force)
│   ├── themes.py               # Style themes
│   ├── diagram.py              # High-level Diagram builder
│   └── cli.py                  # CLI: ec-draw --diagram flowchart ...
├── templates/                  # Prompt templates Claude loads at invocation
│   ├── architecture.md         # System architecture diagram template
│   ├── flowchart.md            # Flowchart / process diagram template
│   ├── whiteboard.md           # Freeform whiteboard template
│   ├── er.md                   # Entity-relationship diagram template
│   └── sequence.md             # Sequence diagram template
├── examples/                   # Example .excalidraw outputs
│   ├── architecture.excalidraw
│   ├── flowchart.excalidraw
│   └── whiteboard.excalidraw
├── library/                    # Reusable element presets
│   └── icons.json              # Common icons/shapes as element templates
└── README.md
```

## Component Design

### 1. `ec_draw/elements.py` — Element Builders

Low-level builders that produce Excalidraw element dicts. Each builder takes positional
params for required values and keyword params for styling overrides.

```python
def rect(x, y, width, height, *, text=None, theme=None, **overrides) -> dict
def ellipse(x, y, width, height, *, theme=None, **overrides) -> dict
def diamond(x, y, width, height, *, text=None, theme=None, **overrides) -> dict
def arrow(x1, y1, x2, y2, *, label=None, theme=None, **overrides) -> dict
def line(x1, y1, x2, y2, *, theme=None, **overrides) -> dict
def text(x, y, content, *, fontSize=16, theme=None, **overrides) -> dict
```

All builders apply theme defaults (strokeColor, backgroundColor, fillStyle, strokeWidth,
roughness, roundness) and allow per-element overrides.

### 2. `ec_draw/themes.py` — Style Themes

Named presets controlling all visual properties:

| Theme | strokeWidth | roughness | roundness | Palette |
|-------|------------|-----------|-----------|---------|
| `professional` | 2 | 0 | null | Blue/gray/white |
| `sketchy` | 3 | 2 | type:3 | Warm earth tones |
| `dark` | 2 | 1 | type:2 | Neon on dark bg |
| `colorful` | 3 | 1 | type:3 | Bright primaries |

Theme is set once at Diagram creation and colors flow to all elements via a simple
color-cycling scheme.

### 3. `ec_draw/layout.py` — Layout Engines

Pure functions that compute (x, y) positions for nodes/edges:

- **grid(cols, spacing, start)** — positions in a regular grid
- **tree(direction, spacing)** — parent-child tree layout (LR, TB, RL, BT)
- **layered(spacing)** — stacked horizontal layers (for architecture diagrams)
- **force(nodes, edges)** — simple force-directed placement

Layout engines return position tuples; they don't mutate elements. The Diagram class
applies positions.

### 4. `ec_draw/diagram.py` — Diagram Builder

High-level builder that tracks elements, applies layout, and renders to `.excalidraw`:

```python
d = Diagram(theme="sketchy")
d.add_box("API Gateway", layout="grid", row=0, col=0)
d.add_box("Auth Service", layout="grid", row=1, col=0)
d.add_arrow("API Gateway", "Auth Service")
d.add_box("Database", layout="grid", row=1, col=1)
d.add_arrow("Auth Service", "Database")
d.save("architecture.excalidraw")
```

### 5. `SKILL.md` — Claude Code Skill

Triggers on: "draw a diagram", "create a flowchart", "sketch an architecture",
"excalidraw", "make a whiteboard", "diagram this", etc.

The skill instructs Claude to:
1. Pick the right prompt template from `templates/`
2. Write a short Python script using `ec_draw`
3. Execute it to produce the `.excalidraw` file
4. Report the output path

## Data Flow

```
User: "Draw an architecture diagram for my microservices"
  → SKILL.md triggers
  → Claude reads templates/architecture.md
  → Claude writes:
      from ec_draw import Diagram
      d = Diagram(theme="sketchy")
      d.add_box("API Gateway", row=0, col=0, span=3)
      d.add_box("Auth", row=1, col=0)
      d.add_box("Users", row=1, col=1)
      d.add_box("Orders", row=1, col=2)
      d.add_arrow("API Gateway", "Auth")
      d.add_arrow("API Gateway", "Users")
      d.add_arrow("API Gateway", "Orders")
      d.save("architecture.excalidraw")
  → Claude runs the script
  → Output: architecture.excalidraw
```

## Style Guide

All diagrams share these defaults unless a theme overrides:
- Hand-drawn aesthetic: roughness ≥ 1, Virgil font (fontFamily: 1)
- Rounded corners on shapes: roundness {"type": 3}
- Consistent stroke width: 2-3px
- Light background: #F8F5F0
- Text color: #1F2937

## Success Criteria

1. A user says "draw me a flowchart" → skill triggers → `.excalidraw` file produced
2. All diagrams share a consistent visual style (same roughness, palette, font)
3. The Python library is reusable as a standalone `pip install ec-draw`
4. The skill includes at least 3 prompt templates and 3 example outputs
5. README shows copy-paste examples that work immediately
