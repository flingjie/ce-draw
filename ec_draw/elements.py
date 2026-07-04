"""Element builders for Excalidraw elements.

Each builder returns a dict matching the Excalidraw element JSON schema.
All builders accept a Theme for defaults and **overrides for per-element tweaks.

Element types: rect, ellipse, diamond, arrow, line, text, image, frame
"""

import uuid
from typing import Optional

from .themes import Theme


def _make_id() -> str:
    return str(uuid.uuid4())


def _base_element(
    element_type: str,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    theme: Theme,
    overrides: dict,
) -> dict:
    """Build the common base for all element types."""
    return {
        "id": overrides.get("id", _make_id()),
        "type": element_type,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": overrides.get("angle", 0),
        "strokeColor": overrides.get("strokeColor", theme.colors.arrow),
        "backgroundColor": overrides.get("backgroundColor", "transparent"),
        "fillStyle": overrides.get("fillStyle", theme.fill_style),
        "strokeWidth": overrides.get("strokeWidth", theme.stroke_width),
        "strokeStyle": overrides.get("strokeStyle", theme.stroke_style),
        "roughness": overrides.get("roughness", theme.roughness),
        "opacity": overrides.get("opacity", theme.opacity),
        "groupIds": overrides.get("groupIds", []),
        "roundness": overrides.get("roundness", theme.roundness),
        "boundElements": overrides.get("boundElements", None),
        "locked": overrides.get("locked", False),
        "strokeSharpness": overrides.get("strokeSharpness", "round"),
        "isDeleted": False,
        "link": overrides.get("link", None),
        "updated": 0,
        "seed": overrides.get("seed", hash(uuid.uuid4()) & 0x7FFFFFFF),
        "version": overrides.get("version", 2),
        "versionNonce": overrides.get("versionNonce", 0),
        "frameId": overrides.get("frameId", None),
    }


def rect(
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    text: Optional[str] = None,
    theme: Theme,
    color_index: int = 0,
    **overrides,
) -> dict:
    """Build a rectangle element.

    Args:
        x, y: top-left position
        width, height: dimensions
        text: optional label text (creates a bound text element)
        theme: style theme
        color_index: which color from the theme's shape palette to use
        **overrides: per-element property overrides

    Returns:
        Excalidraw element dict
    """
    stroke, bg = theme.colors.shapes[color_index % len(theme.colors.shapes)]
    base = _base_element("rectangle", x, y, width, height, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", stroke)
    base.setdefault("backgroundColor", bg)
    base.setdefault("roundness", theme.roundness)

    if text:
        text_id = _make_id()
        base["boundElements"] = (base["boundElements"] or []) + [
            {"id": text_id, "type": "text"}
        ]

    return base


def ellipse(
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    theme: Theme,
    color_index: int = 0,
    **overrides,
) -> dict:
    """Build an ellipse element."""
    stroke, bg = theme.colors.shapes[color_index % len(theme.colors.shapes)]
    base = _base_element("ellipse", x, y, width, height, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", stroke)
    base.setdefault("backgroundColor", bg)
    base.setdefault("roundness", theme.roundness)
    return base


def diamond(
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    text: Optional[str] = None,
    theme: Theme,
    color_index: int = 0,
    **overrides,
) -> dict:
    """Build a diamond element."""
    stroke, bg = theme.colors.shapes[color_index % len(theme.colors.shapes)]
    base = _base_element("diamond", x, y, width, height, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", stroke)
    base.setdefault("backgroundColor", bg)
    base.setdefault("roundness", theme.roundness)

    if text:
        text_id = _make_id()
        base["boundElements"] = (base["boundElements"] or []) + [
            {"id": text_id, "type": "text"}
        ]

    return base


def arrow(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    label: Optional[str] = None,
    theme: Theme,
    start_arrowhead: Optional[str] = None,
    end_arrowhead: Optional[str] = "arrow",
    **overrides,
) -> dict:
    """Build an arrow/connector element.

    Args:
        x1, y1: start point
        x2, y2: end point
        label: optional text label on the arrow
        theme: style theme
        start_arrowhead: arrowhead style at start (None, "arrow", "bar", "dot", "triangle")
        end_arrowhead: arrowhead style at end
    """
    dy = y2 - y1
    dx = x2 - x1
    base = _base_element("arrow", x1, y1, dx, dy, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", theme.colors.arrow)
    base.setdefault("backgroundColor", "transparent")
    base["roundness"] = None  # arrows never have roundness
    base["points"] = overrides.get("points", [{"x": 0, "y": 0}, {"x": dx, "y": dy}])
    base["startArrowhead"] = start_arrowhead
    base["endArrowhead"] = end_arrowhead
    base["startBinding"] = overrides.get("startBinding")
    base["endBinding"] = overrides.get("endBinding")

    if label:
        text_elem = text_label(
            x1 + dx / 2 - len(label) * 3,
            y1 + dy / 2 - 20,
            label,
            theme=theme,
            container_id=base["id"],
        )
        base["boundElements"] = (base["boundElements"] or []) + [
            {"id": text_elem["id"], "type": "text"}
        ]

    return base


def line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    theme: Theme,
    **overrides,
) -> dict:
    """Build a line element (no arrowheads)."""
    dy = y2 - y1
    dx = x2 - x1
    base = _base_element("line", x1, y1, dx, dy, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", theme.colors.arrow)
    base.setdefault("backgroundColor", "transparent")
    base["roundness"] = None
    base["points"] = overrides.get("points", [{"x": 0, "y": 0}, {"x": dx, "y": dy}])
    return base


def text_label(
    x: float,
    y: float,
    content: str,
    *,
    theme: Theme,
    container_id: Optional[str] = None,
    **overrides,
) -> dict:
    """Build a standalone text element.

    Args:
        x, y: position
        content: the text string
        theme: style theme
        container_id: if this text is bound inside a shape, that shape's ID
    """
    font_size = overrides.get("fontSize", theme.font_size)
    # Rough width estimate — Excalidraw auto-sizes, but we put a starting value
    est_width = len(content) * font_size * 0.6
    est_height = font_size * 1.5

    return {
        "id": overrides.get("id", _make_id()),
        "type": "text",
        "x": x,
        "y": y,
        "width": overrides.get("width", est_width),
        "height": overrides.get("height", est_height),
        "angle": overrides.get("angle", 0),
        "strokeColor": overrides.get("strokeColor", theme.colors.text),
        "backgroundColor": overrides.get("backgroundColor", "transparent"),
        "fillStyle": overrides.get("fillStyle", "solid"),
        "strokeWidth": overrides.get("strokeWidth", 1),
        "strokeStyle": overrides.get("strokeStyle", "solid"),
        "roughness": overrides.get("roughness", 1),
        "opacity": overrides.get("opacity", 100),
        "groupIds": overrides.get("groupIds", []),
        "roundness": None,
        "boundElements": overrides.get("boundElements", None),
        "locked": overrides.get("locked", False),
        "strokeSharpness": "round",
        "isDeleted": False,
        "link": overrides.get("link", None),
        "updated": 0,
        "seed": overrides.get("seed", hash(uuid.uuid4()) & 0x7FFFFFFF),
        "version": overrides.get("version", 2),
        "versionNonce": overrides.get("versionNonce", 0),
        "frameId": overrides.get("frameId", None),
        # text-specific
        "text": content,
        "fontSize": font_size,
        "fontFamily": overrides.get("fontFamily", theme.font_family),
        "textAlign": overrides.get("textAlign", "center"),
        "verticalAlign": overrides.get("verticalAlign", "middle"),
        "containerId": container_id,
        "autoResize": overrides.get("autoResize", True),
        "lineHeight": overrides.get("lineHeight", 1.25),
        "baseline": overrides.get("baseline", font_size * 0.8),
        "originalText": overrides.get("originalText", content),
    }


def frame(
    x: float,
    y: float,
    width: float,
    height: float,
    name: str,
    *,
    theme: Theme,
    **overrides,
) -> dict:
    """Build a frame element (grouping container)."""
    base = _base_element("frame", x, y, width, height, theme=theme, overrides=overrides)
    base.setdefault("strokeColor", theme.colors.accent)
    base.setdefault("backgroundColor", "transparent")
    base.setdefault("strokeStyle", "dashed")
    base["roundness"] = None
    base["name"] = name
    return base


__all__ = [
    "rect",
    "ellipse",
    "diamond",
    "arrow",
    "line",
    "text_label",
    "frame",
    "_make_id",
]
