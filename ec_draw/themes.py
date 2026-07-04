"""Style themes for ce-draw diagrams.

Each theme is a dict of default element properties. Themes control color palette,
stroke width, roughness, roundness, font, and background. Apply a theme at Diagram
creation or override per-element.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ThemeColors:
    """Color palette for a theme. 5 shape colors, arrow/text/accent colors, background."""

    shapes: list[tuple[str, str]]  # (strokeColor, backgroundColor) pairs
    arrow: str  # arrow/connector color
    text: str  # text color
    accent: str  # accent/highlight color
    background: str  # canvas background


@dataclass
class Theme:
    """Complete visual theme for a diagram."""

    name: str
    colors: ThemeColors
    stroke_width: int = 2
    roughness: int = 1
    roundness: Optional[dict] = field(default_factory=lambda: {"type": 3})
    font_family: int = 1  # 1=Virgil (hand-drawn), 2=Helvetica, 3=Cascadia
    font_size: int = 16
    fill_style: str = "solid"
    stroke_style: str = "solid"
    opacity: int = 100


def _professional() -> Theme:
    """Clean, precise look — good for architecture diagrams and documentation."""
    return Theme(
        name="professional",
        colors=ThemeColors(
            shapes=[
                ("#2563EB", "#DBEAFE"),  # blue
                ("#059669", "#D1FAE5"),  # green
                ("#7C3AED", "#EDE9FE"),  # purple
                ("#DC2626", "#FEE2E2"),  # red
                ("#D97706", "#FEF3C7"),  # amber
            ],
            arrow="#6B7280",
            text="#1F2937",
            accent="#2563EB",
            background="#FFFFFF",
        ),
        stroke_width=2,
        roughness=0,
        roundness=None,
        font_family=2,  # Helvetica
    )


def _sketchy() -> Theme:
    """Hand-drawn, warm look — good for brainstorming and early-stage ideas."""
    return Theme(
        name="sketchy",
        colors=ThemeColors(
            shapes=[
                ("#1E3A5F", "#B8D4F0"),  # slate blue
                ("#2D5A27", "#C5E8C0"),  # moss green
                ("#6B3A5B", "#F0D5E5"),  # mauve
                ("#8B4513", "#F5D5B8"),  # warm brown
                ("#4A3728", "#E8D5C0"),  # taupe
            ],
            arrow="#5A5A5A",
            text="#2C2C2C",
            accent="#1E3A5F",
            background="#F8F5F0",
        ),
        stroke_width=3,
        roughness=2,
        roundness={"type": 3},
        font_family=1,  # Virgil
    )


def _dark() -> Theme:
    """Dark mode — neon accents on dark background."""
    return Theme(
        name="dark",
        colors=ThemeColors(
            shapes=[
                ("#60A5FA", "#1E3A5F"),  # blue
                ("#34D399", "#064E3B"),  # green
                ("#A78BFA", "#4C1D95"),  # purple
                ("#F87171", "#7F1D1D"),  # red
                ("#FBBF24", "#78350F"),  # amber
            ],
            arrow="#9CA3AF",
            text="#F3F4F6",
            accent="#60A5FA",
            background="#111827",
        ),
        stroke_width=2,
        roughness=1,
        roundness={"type": 2},
        font_family=1,
    )


def _colorful() -> Theme:
    """Bright, playful — good for presentations and slides."""
    return Theme(
        name="colorful",
        colors=ThemeColors(
            shapes=[
                ("#E03131", "#FFC9C9"),  # red
                ("#E8590C", "#FFD8A8"),  # orange
                ("#FCC419", "#FFF3BF"),  # yellow
                ("#2F9E44", "#B2F2BB"),  # green
                ("#1C7ED6", "#A5D8FF"),  # blue
            ],
            arrow="#495057",
            text="#212529",
            accent="#E03131",
            background="#FFFBEB",
        ),
        stroke_width=3,
        roughness=1,
        roundness={"type": 3},
        font_family=1,
    )


THEMES: dict[str, Theme] = {
    "professional": _professional(),
    "sketchy": _sketchy(),
    "dark": _dark(),
    "colorful": _colorful(),
}


def get_theme(name: str) -> Theme:
    """Get a theme by name. Raises ValueError if not found."""
    name = name.lower().strip()
    if name not in THEMES:
        available = ", ".join(THEMES.keys())
        raise ValueError(f"Unknown theme '{name}'. Available: {available}")
    return THEMES[name]


def list_themes() -> list[str]:
    """List all available theme names."""
    return list(THEMES.keys())
