"""ec-draw: Generate Excalidraw diagrams from Python.

Usage:
    from ec_draw import Diagram

    d = Diagram(theme="sketchy")
    d.add_box("API Gateway", row=0, col=0, span=3)
    d.add_box("Auth Service", row=1, col=0)
    d.add_arrow("API Gateway", "Auth Service")
    d.save("architecture.excalidraw")
"""

from .diagram import Diagram
from .themes import get_theme, list_themes, Theme
from .elements import (
    rect,
    ellipse,
    diamond,
    arrow,
    line,
    text_label,
    frame,
)
from . import layout
from .mermaid import mermaid_to_diagram, parse_mermaid

__all__ = [
    "Diagram",
    "get_theme",
    "list_themes",
    "Theme",
    "rect",
    "ellipse",
    "diamond",
    "arrow",
    "line",
    "text_label",
    "frame",
    "layout",
    "mermaid_to_diagram",
    "parse_mermaid",
]
__version__ = "0.1.0"
