"""High-level Diagram builder.

The Diagram class is the main entry point for creating Excalidraw diagrams.
It tracks elements, applies themes and layouts, and renders to .excalidraw files.

Usage:
    from ec_draw import Diagram

    d = Diagram(theme="sketchy")
    d.add_box("API Gateway", row=0, col=0, span=3)
    d.add_box("Auth Service", row=1, col=0)
    d.add_box("Database", row=1, col=1)
    d.add_arrow("API Gateway", "Auth Service")
    d.add_arrow("Auth Service", "Database")
    d.save("architecture.excalidraw")
"""

import json
import os
from typing import Optional

from .elements import (
    rect,
    ellipse,
    diamond,
    arrow,
    line,
    text_label,
    frame,
    _make_id,
)
from .themes import Theme, get_theme, list_themes
from .layout import GridLayout


class Diagram:
    """Build an Excalidraw diagram with a consistent theme and layout."""

    def __init__(
        self,
        theme: str = "sketchy",
        *,
        cols: int = 3,
        cell_w: int = 160,
        cell_h: int = 80,
        gap_x: int = 40,
        gap_y: int = 50,
    ):
        """Create a new diagram.

        Args:
            theme: theme name ("sketchy", "professional", "dark", "colorful")
            cols: default grid columns
            cell_w, cell_h: default cell size for grid layout
            gap_x, gap_y: spacing between cells
        """
        self.theme: Theme = get_theme(theme) if isinstance(theme, str) else theme
        self.elements: list[dict] = []
        self._extra_elements: list[dict] = []  # text labels, etc.
        self._named: dict[str, dict] = {}  # name → element lookup
        self._grid = GridLayout(
            cols=cols,
            cell_w=cell_w,
            cell_h=cell_h,
            gap_x=gap_x,
            gap_y=gap_y,
        )
        self._color_idx = 0

    # ── Adding elements ───────────────────────────────────────────

    def add_box(
        self,
        name: str,
        *,
        row: Optional[int] = None,
        col: Optional[int] = None,
        span: int = 1,
        width: Optional[float] = None,
        height: Optional[float] = None,
        shape: str = "rect",
    ) -> dict:
        """Add a labeled box (rectangle) to the diagram.

        Args:
            name: label text and lookup key
            row, col: grid position (auto-increments if omitted)
            span: how many columns this box spans
            width, height: override default cell size
            shape: "rect", "ellipse", or "diamond"

        Returns:
            The element dict for the shape
        """
        if row is None and col is None:
            # auto-position
            idx = len(self._named)
            row = idx // self._grid.cols
            col = idx % self._grid.cols
        elif row is None:
            row = 0
        elif col is None:
            col = 0

        x, y = self._grid.position(row * self._grid.cols + col)
        w = width or (self._grid.cell_w + (span - 1) * (self._grid.cell_w + self._grid.gap_x))
        h = height or self._grid.cell_h

        builders = {
            "rect": rect,
            "ellipse": ellipse,
            "diamond": diamond,
        }
        build = builders.get(shape, rect)

        elem = build(
            x, y, w, h,
            text=name,
            theme=self.theme,
            color_index=self._color_idx,
        )
        self._color_idx += 1
        self.elements.append(elem)
        self._named[name] = elem

        # Add bound text element
        if name:
            text_elem = text_label(
                x + w / 2 - len(name) * self.theme.font_size * 0.3,
                y + h / 2 - self.theme.font_size * 0.6,
                name,
                theme=self.theme,
                container_id=elem["id"],
            )
            self.elements.append(text_elem)

        return elem

    def add_arrow(
        self,
        from_name: str,
        to_name: str,
        *,
        label: Optional[str] = None,
        start_arrowhead: Optional[str] = None,
        end_arrowhead: Optional[str] = "arrow",
    ) -> dict:
        """Add an arrow connecting two named boxes.

        Args:
            from_name: name of the source box
            to_name: name of the target box
            label: optional text on the arrow
            start_arrowhead: arrowhead at start (None, "arrow", "bar", "dot", "triangle")
            end_arrowhead: arrowhead at end

        Returns:
            The arrow element dict
        """
        from_elem = self._named.get(from_name)
        to_elem = self._named.get(to_name)

        if not from_elem:
            raise KeyError(f"No element named '{from_name}'. Available: {list(self._named.keys())}")
        if not to_elem:
            raise KeyError(f"No element named '{to_name}'. Available: {list(self._named.keys())}")

        # Draw from center-right of from_elem to center-left of to_elem
        fx = from_elem["x"] + from_elem["width"]
        fy = from_elem["y"] + from_elem["height"] / 2
        tx = to_elem["x"]
        ty = to_elem["y"] + to_elem["height"] / 2

        elem = arrow(
            fx, fy, tx, ty,
            label=label,
            theme=self.theme,
            start_arrowhead=start_arrowhead,
            end_arrowhead=end_arrowhead,
        )
        self.elements.append(elem)
        return elem

    def add_text(
        self,
        content: str,
        x: float,
        y: float,
        *,
        font_size: Optional[int] = None,
    ) -> dict:
        """Add a standalone text element.

        Args:
            content: the text to display
            x, y: position
            font_size: override theme default

        Returns:
            The text element dict
        """
        fs = font_size or self.theme.font_size
        elem = text_label(x, y, content, theme=self.theme, fontSize=fs)
        self.elements.append(elem)
        return elem

    def add_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
    ) -> dict:
        """Add a plain line (no arrowheads).

        Args:
            x1, y1: start point
            x2, y2: end point

        Returns:
            The line element dict
        """
        elem = line(x1, y1, x2, y2, theme=self.theme)
        self.elements.append(elem)
        return elem

    def add_frame(
        self,
        name: str,
        x: float,
        y: float,
        width: float,
        height: float,
    ) -> dict:
        """Add a frame (grouping container) around elements.

        Args:
            name: frame label
            x, y: position
            width, height: dimensions

        Returns:
            The frame element dict
        """
        elem = frame(x, y, width, height, name, theme=self.theme)
        self.elements.append(elem)
        return elem

    def add_element(self, element: dict) -> dict:
        """Add a raw element dict directly.

        Useful for custom elements not covered by the convenience methods.

        Returns:
            The element dict (same as input)
        """
        self.elements.append(element)
        return element

    # ── Rendering ──────────────────────────────────────────────────

    def to_dict(self) -> dict:
        """Return the complete .excalidraw document as a dict."""
        return {
            "type": "excalidraw",
            "version": 2,
            "source": "https://excalidraw.com",
            "elements": self.elements,
            "appState": {
                "gridSize": None,
                "viewBackgroundColor": self.theme.colors.background,
                "currentItemFontFamily": self.theme.font_family,
                "currentItemFontSize": self.theme.font_size,
                "theme": "dark" if self.theme.name == "dark" else "light",
            },
            "files": {},
        }

    def to_json(self, indent: int = 2) -> str:
        """Return the .excalidraw document as a JSON string."""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

    def save(self, path: str) -> str:
        """Save the diagram as a .excalidraw file.

        Args:
            path: output file path (should end with .excalidraw)

        Returns:
            The absolute path to the saved file
        """
        if not path.endswith(".excalidraw"):
            path += ".excalidraw"

        doc = self.to_dict()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)

        abs_path = os.path.abspath(path)
        return abs_path

    # ── Utilities ──────────────────────────────────────────────────

    def __len__(self) -> int:
        return len(self.elements)

    def __repr__(self) -> str:
        return f"Diagram(theme={self.theme.name!r}, elements={len(self.elements)})"
