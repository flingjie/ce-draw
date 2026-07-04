"""Layout engines for automatically positioning elements.

Each layout function takes a list of node descriptors and returns (x, y)
position tuples. Layout functions are pure — they don't mutate anything.

Available layouts:
    grid — regular grid with configurable columns and spacing
    tree — parent-child tree in any direction
    layered — stacked horizontal layers (for architecture diagrams)
    vertical — simple vertical stack
    horizontal — simple horizontal row
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class GridLayout:
    """Position items in a regular grid.

    Args:
        cols: number of columns
        cell_w: width of each cell
        cell_h: height of each cell
        start_x: starting x position
        start_y: starting y position
        gap_x: horizontal gap between cells
        gap_y: vertical gap between cells
    """

    cols: int = 3
    cell_w: int = 160
    cell_h: int = 80
    start_x: int = 50
    start_y: int = 50
    gap_x: int = 40
    gap_y: int = 40

    def position(self, index: int, span: int = 1) -> tuple[float, float]:
        """Get (x, y) for the item at the given grid index."""
        col = index % self.cols
        row = index // self.cols
        x = self.start_x + col * (self.cell_w + self.gap_x)
        y = self.start_y + row * (self.cell_h + self.gap_y)
        return (x, y)

    def cell_center(self, index: int, span: int = 1) -> tuple[float, float]:
        """Get the center point of the cell at the given index."""
        x, y = self.position(index, span)
        return (x + self.cell_w / 2, y + self.cell_h / 2)


def vertical(
    count: int,
    *,
    item_h: int = 70,
    gap: int = 30,
    start_x: int = 100,
    start_y: int = 50,
    item_w: int = 160,
) -> list[tuple[float, float, float, float]]:
    """Stack items vertically. Returns [(x, y, w, h), ...]."""
    return [
        (start_x, start_y + i * (item_h + gap), item_w, item_h)
        for i in range(count)
    ]


def horizontal(
    count: int,
    *,
    item_w: int = 140,
    gap: int = 30,
    start_x: int = 50,
    start_y: int = 100,
    item_h: int = 70,
) -> list[tuple[float, float, float, float]]:
    """Arrange items in a horizontal row. Returns [(x, y, w, h), ...]."""
    return [
        (start_x + i * (item_w + gap), start_y, item_w, item_h)
        for i in range(count)
    ]


def tree(
    parent_count: int,
    children_per_parent: list[int],
    *,
    direction: str = "TB",
    parent_w: int = 140,
    parent_h: int = 60,
    child_w: int = 130,
    child_h: int = 50,
    gap_parent: int = 200,
    gap_child: int = 40,
    start_x: int = 50,
    start_y: int = 50,
) -> tuple[list[tuple], list[list[tuple]]]:
    """Layout a parent-child tree.

    Args:
        parent_count: number of parent nodes
        children_per_parent: list of child counts for each parent
        direction: "TB" (top→bottom), "LR" (left→right), "BT", "RL"

    Returns:
        (parent_positions, children_positions) where each is a list of (x, y, w, h) tuples.
        children_positions is a list of lists, one per parent.
    """
    parent_positions = []
    children_positions = []

    if direction in ("TB", "BT"):
        for i in range(parent_count):
            px = start_x + i * (parent_w + gap_parent)
            py = start_y if direction == "TB" else start_y + parent_h + gap_parent
            parent_positions.append((px, py, parent_w, parent_h))

            child_y = start_y + parent_h + gap_parent if direction == "TB" else start_y
            n_children = children_per_parent[i] if i < len(children_per_parent) else 0
            total_child_w = n_children * child_w + (n_children - 1) * gap_child
            child_start_x = px + parent_w / 2 - total_child_w / 2

            child_list = []
            for j in range(n_children):
                cx = child_start_x + j * (child_w + gap_child)
                child_list.append((cx, child_y, child_w, child_h))
            children_positions.append(child_list)
    else:  # LR or RL
        for i in range(parent_count):
            py = start_y + i * (parent_h + gap_parent)
            px = start_x if direction == "LR" else start_x + parent_w + gap_parent
            parent_positions.append((px, py, parent_w, parent_h))

            child_x = start_x + parent_w + gap_parent if direction == "LR" else start_x
            n_children = children_per_parent[i] if i < len(children_per_parent) else 0
            total_child_h = n_children * child_h + (n_children - 1) * gap_child
            child_start_y = py + parent_h / 2 - total_child_h / 2

            child_list = []
            for j in range(n_children):
                cy = child_start_y + j * (child_h + gap_child)
                child_list.append((child_x, cy, child_w, child_h))
            children_positions.append(child_list)

    return parent_positions, children_positions


def layered(
    layers: list[int],
    *,
    layer_gap: int = 100,
    item_w: int = 150,
    item_h: int = 60,
    item_gap: int = 30,
    start_x: int = 50,
    start_y: int = 50,
    layer_w: int = 900,
    layer_padding: int = 30,
) -> list[dict]:
    """Layout a layered architecture diagram.

    Args:
        layers: number of items in each layer, e.g. [3, 5, 2] = 3 layers
        layer_gap: vertical gap between layers
        item_w, item_h: size of each item
        item_gap: horizontal gap between items in a layer
        start_x, start_y: top-left origin
        layer_w: width of the layer outline box

    Returns:
        List of dicts, one per layer: {
            "layer_rect": (x, y, w, h),  # the outline box
            "items": [(x, y, w, h), ...],  # items inside the layer
            "label_y": float,  # y position for the layer label
        }
    """
    result = []
    current_y = start_y

    for i, item_count in enumerate(layers):
        total_item_w = item_count * item_w + max(0, item_count - 1) * item_gap
        item_start_x = start_x + (layer_w - total_item_w) / 2

        items = []
        for j in range(item_count):
            ix = item_start_x + j * (item_w + item_gap)
            items.append((ix, current_y + layer_padding, item_w, item_h))

        layer_h = item_h + 2 * layer_padding

        result.append(
            {
                "layer_rect": (
                    start_x,
                    current_y,
                    layer_w,
                    layer_h + layer_padding,
                ),
                "items": items,
                "label_y": current_y + layer_padding // 3,
            }
        )

        current_y += layer_h + layer_gap

    return result
