#!/usr/bin/env python3
"""CLI for ec-draw: generate Excalidraw diagrams from the command line.

Usage:
    ec-draw flowchart "Start -> Process -> End" -o flow.excalidraw
    ec-draw architecture --layers "Web:3" "Services:5" "Data:2" -o arch.excalidraw
    ec-draw --theme professional --list-themes
"""

import argparse
import json
import sys

from ec_draw import Diagram, list_themes, layout


def cmd_list_themes():
    """Print available themes."""
    print("Available themes:")
    for name in list_themes():
        print(f"  - {name}")


def cmd_flowchart(args):
    """Generate a flowchart from a description string.

    Format: "Node A -> Node B -> Node C" or "Start -> Decision? -> [Yes] Process -> End"
    """
    # Parse simple linear flowchart: "A -> B -> C"
    parts = [p.strip() for p in args.description.split("->")]
    if len(parts) < 2:
        print("Error: flowchart needs at least 2 nodes separated by '->'", file=sys.stderr)
        sys.exit(1)

    d = Diagram(theme=args.theme, cols=1, cell_w=180, cell_h=70, gap_y=60)

    for i, label in enumerate(parts):
        # Check if this is a decision diamond
        if label.endswith("?"):
            d.add_box(label, row=i, col=0, shape="diamond")
        else:
            d.add_box(label, row=i, col=0)

    for i in range(len(parts) - 1):
        d.add_arrow(parts[i], parts[i + 1])

    path = d.save(args.output)
    print(f"Flowchart saved to: {path}")


def cmd_architecture(args):
    """Generate a layered architecture diagram.

    --layers "Web:3" "Services:5" "Data:2"
    """
    layer_names = []
    layer_counts = []

    for spec in args.layers:
        if ":" in spec:
            name, count = spec.split(":", 1)
            layer_names.append(name.strip())
            layer_counts.append(int(count.strip()))
        else:
            layer_names.append(spec.strip())
            layer_counts.append(3)  # default

    layers_data = layout.layered(
        layer_counts,
        start_x=50,
        start_y=50,
        item_w=140,
        item_h=55,
        layer_gap=60,
    )

    d = Diagram(theme=args.theme, cols=1, cell_w=140, cell_h=55)

    for i, layer_data in enumerate(layers_data):
        lx, ly, lw, lh = layer_data["layer_rect"]
        d.add_frame(layer_names[i], lx, ly, lw, lh)

        for j, (ix, iy, iw, ih) in enumerate(layer_data["items"]):
            label = f"{layer_names[i]}-{j + 1}"
            d.add_box(label, row=0, col=0, width=iw, height=ih)
            # Manually reposition since we used layered layout
            elem = d._named[label]
            elem["x"] = ix
            elem["y"] = iy

    path = d.save(args.output)
    print(f"Architecture diagram saved to: {path}")


def main():
    parser = argparse.ArgumentParser(
        prog="ec-draw",
        description="Generate Excalidraw diagrams from the command line.",
    )
    parser.add_argument(
        "--theme", "-t",
        default="sketchy",
        choices=list_themes(),
        help="Visual theme (default: sketchy)",
    )
    parser.add_argument(
        "--output", "-o",
        default="diagram.excalidraw",
        help="Output file path (default: diagram.excalidraw)",
    )
    parser.add_argument(
        "--list-themes",
        action="store_true",
        help="List available themes and exit",
    )

    subparsers = parser.add_subparsers(dest="command", help="Diagram type")

    # flowchart subcommand
    flow_parser = subparsers.add_parser("flowchart", help="Generate a flowchart")
    flow_parser.add_argument("description", help="Flowchart description: 'A -> B -> C'")

    # architecture subcommand
    arch_parser = subparsers.add_parser("architecture", help="Generate an architecture diagram")
    arch_parser.add_argument(
        "--layers", "-l",
        nargs="+",
        required=True,
        help='Layer specs: "Web:3" "Services:5" "Data:2"',
    )

    args = parser.parse_args()

    if args.list_themes:
        cmd_list_themes()
        return

    if args.command == "flowchart":
        cmd_flowchart(args)
    elif args.command == "architecture":
        cmd_architecture(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
