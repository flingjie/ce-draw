# ec-draw

Generate high-quality Excalidraw diagrams with AI — describe your diagram in Mermaid
syntax or Python, and ec-draw renders it as a styled, hand-drawn `.excalidraw` file.

```python
from ec_draw import mermaid_to_diagram

mermaid = """
flowchart TD
    A[Login] --> B{Valid?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Error]
"""

d = mermaid_to_diagram(mermaid, theme="sketchy")
d.save("flowchart.excalidraw")
```

## Features

- **Mermaid → Excalidraw** — AI generates Mermaid, ec-draw converts to hand-drawn style
- **4 visual themes** — sketchy, professional, dark mode, colorful
- **Auto-layout** — Mermaid handles node positioning; Python API has grid, tree, layered
- **Built-in icon library** — database, server, cloud, user, gear, and more
- **Consistent style** — every diagram shares the same roughness, palette, and font
- **Claude Code skill** — triggers on "draw a diagram", "create a flowchart", etc.
- **Zero dependencies** — pure Python stdlib, nothing to install

## Installation

```bash
pip install ec-draw
```

Or use directly from source:

```bash
git clone https://github.com/your-org/ec-draw.git
cd ec-draw
pip install -e .
```

## Quick Start

### Mermaid → Excalidraw (Recommended)

```python
from ec_draw import mermaid_to_diagram

# Flowchart
d = mermaid_to_diagram("""
flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Do It]
    B -->|No| D[Skip]
    C --> E[End]
    D --> E
""", theme="sketchy")
d.save("flow.excalidraw")

# Sequence diagram
d = mermaid_to_diagram("""
sequenceDiagram
    Client->>Server: Request
    Server->>DB: Query
    DB-->>Server: Data
    Server-->>Client: Response
""", theme="professional")
d.save("sequence.excalidraw")

# ER diagram
d = mermaid_to_diagram("""
erDiagram
    USER ||--o{ POST : creates
    USER {
        int id
        string name
    }
    POST {
        int id
        string title
    }
""", theme="professional")
d.save("er.excalidraw")
```

### Python API

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy")
d.add_box("API Gateway", row=0, col=0, span=3)
d.add_box("Auth Service", row=1, col=0)
d.add_box("Database", row=1, col=1)
d.add_arrow("API Gateway", "Auth Service")
d.add_arrow("Auth Service", "Database")
d.save("architecture.excalidraw")
```

### With Claude Code

Just ask Claude naturally:

> "Draw me an architecture diagram showing a web app with load balancer,
> 3 app servers, and a PostgreSQL database"

Claude will use the ec-draw skill to produce a `.excalidraw` file you can
open at https://excalidraw.com.

### As a CLI

```bash
ec-draw flowchart "Start -> Process -> End" -o flow.excalidraw
ec-draw architecture --layers "Web:2" "App:3" "Data:2" -o arch.excalidraw
ec-draw --list-themes
```

## API

### Diagram

| Method | Description |
|--------|-------------|
| `Diagram(theme, cols, cell_w, cell_h, gap_x, gap_y)` | Create a new diagram |
| `.add_box(name, *, row, col, span, width, height, shape)` | Add a labeled shape |
| `.add_arrow(from, to, *, label, start_arrowhead, end_arrowhead)` | Connect two boxes |
| `.add_text(content, x, y, *, font_size)` | Add standalone text |
| `.add_line(x1, y1, x2, y2)` | Add a plain line |
| `.add_frame(name, x, y, width, height)` | Add a grouping frame |
| `.add_element(dict)` | Add a raw Excalidraw element |
| `.save(path)` | Write the `.excalidraw` file |
| `.to_json()` | Return JSON string |
| `.to_dict()` | Return document dict |

### Low-Level Builders

```python
from ec_draw import rect, ellipse, diamond, arrow, line, text_label, frame, get_theme

theme = get_theme("sketchy")
e = rect(100, 100, 200, 80, text="Hello", theme=theme, color_index=0)
```

### Layout Helpers

```python
from ec_draw import layout

layout.vertical(5, item_h=70, gap=30)          # stack 5 items
layout.horizontal(4, item_w=140, gap=30)        # row of 4 items
layout.tree(3, [2, 3, 2], direction="TB")      # parent→children
layout.layered([3, 5, 2])                       # 3-tier architecture
```

## Themes

| Theme | Look | Background | Font |
|-------|------|------------|------|
| `sketchy` | Hand-drawn, warm earth tones | #F8F5F0 | Virgil |
| `professional` | Clean lines, blue/gray | #FFFFFF | Helvetica |
| `dark` | Dark bg, neon accents | #111827 | Virgil |
| `colorful` | Bright primaries | #FFFBEB | Virgil |

## Project Structure

```
ec-draw/
├── SKILL.md                  # Claude Code skill definition
├── README.md                 # This file
├── ec_draw/                  # Python package
│   ├── __init__.py           # Public API
│   ├── diagram.py            # Diagram builder
│   ├── elements.py           # Element builders
│   ├── themes.py             # Visual themes
│   ├── layout.py             # Layout engines
│   ├── mermaid.py            # Mermaid → Excalidraw converter
│   └── cli.py                # CLI entry point
├── templates/                # Prompt templates
│   ├── flowchart.md
│   ├── architecture.md
│   ├── sequence.md
│   ├── er.md
│   └── whiteboard.md
├── examples/                 # Example .excalidraw files
│   ├── architecture.excalidraw
│   ├── flowchart.excalidraw
│   └── whiteboard.excalidraw
├── library/                  # Reusable element presets
│   └── icons.json
└── docs/
    └── design.md
```

## Examples

Open these in [Excalidraw](https://excalidraw.com):

| Example | Theme | Description |
|---------|-------|-------------|
| [`examples/architecture.excalidraw`](examples/architecture.excalidraw) | professional | 3-tier web app with CDN, LB, app servers, DB |
| [`examples/flowchart.excalidraw`](examples/flowchart.excalidraw) | sketchy | Login flow with validation and error handling |
| [`examples/whiteboard.excalidraw`](examples/whiteboard.excalidraw) | sketchy | Brainstorm: improving page load time |
| [`examples/mermaid_flowchart.excalidraw`](examples/mermaid_flowchart.excalidraw) | sketchy | Mermaid flowchart with validation loop |
| [`examples/mermaid_sequence.excalidraw`](examples/mermaid_sequence.excalidraw) | professional | Mermaid sequence: login API flow |
| [`examples/mermaid_er.excalidraw`](examples/mermaid_er.excalidraw) | professional | Mermaid ER: blog data model |

## Contributing

1. Add new themes to `ec_draw/themes.py`
2. Add new layout engines to `ec_draw/layout.py`
3. Add new icon presets to `library/icons.json`
4. Add new prompt templates to `templates/`
5. Generate new examples and add them to `examples/`

## License

MIT
