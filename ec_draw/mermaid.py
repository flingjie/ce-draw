"""Mermaid syntax parser — converts Mermaid diagrams to Excalidraw elements.

Supports flowchart, sequenceDiagram, erDiagram, and classDiagram.
Pure Python, zero dependencies. Parses AI-generated Mermaid syntax into
structured data, then renders it with ec_draw's themes and layouts.

Usage:
    from ec_draw import Diagram
    from ec_draw.mermaid import mermaid_to_diagram

    mermaid = '''
    flowchart TD
        A[Login] --> B{Valid?}
        B -->|Yes| C[Dashboard]
        B -->|No| D[Error]
    '''

    d = mermaid_to_diagram(mermaid, theme="sketchy")
    d.save("flowchart.excalidraw")
"""

import re
from typing import Optional

from .diagram import Diagram
from . import layout


def parse_flowchart(text: str) -> dict:
    """Parse Mermaid flowchart syntax into nodes and edges.

    Handles:
        flowchart TD/LR/RL/BT
        A[rectangle label]
        B{diamond label}
        C((circle label))
        D[(database)]
        E>asymmetric]
        A --> B
        A -->|label| B
        A -.-> B  (dotted)
        A ==> B   (thick)
    """
    nodes = {}  # id → {label, shape}
    edges = []  # [(from_id, to_id, label, style)]

    # Extract direction: flowchart TD / LR / RL / BT
    direction = "TD"
    dir_match = re.search(r'flowchart\s+(TB|TD|LR|RL|BT)', text, re.IGNORECASE)
    if dir_match:
        direction = dir_match.group(1).upper()

    # Parse node definitions: id[Label], id{Label}, id((Label)), id[(Label)]
    node_patterns = [
        (r'(\w+)\[([^\]]+)\]', 'rect'),           # A[rectangle]
        (r'(\w+)\{([^}]+)\}', 'diamond'),          # B{diamond}
        (r'(\w+)\(\(([^)]+)\)\)', 'ellipse'),      # C((circle))
        (r'(\w+)\[\(([^\]]+)\)\]', 'database'),    # D[(database)]
    ]

    for pattern, shape in node_patterns:
        for match in re.finditer(pattern, text):
            node_id = match.group(1)
            label = match.group(2).strip()
            if node_id not in nodes:
                nodes[node_id] = {"label": label, "shape": shape}

    # Remove nodes that appear in edge definitions (they're references, not defs)
    # Parse edges: A -->|label| B, A --> B, A -.-> B, A ==> B
    edge_pattern = re.compile(
        r'(\w+)\s*(--?>|-->>|-\\.->|==>|-->)\s*(?:\|([^|]+)\|)?\s*(\w+)'
    )

    for match in edge_pattern.finditer(text):
        from_id = match.group(1)
        arrow_type = match.group(2)
        label = match.group(3)
        to_id = match.group(4)

        # Determine arrow style
        style = "solid"
        if "-.->" in arrow_type:
            style = "dotted"
        elif "==>" in arrow_type:
            style = "thick"
        elif "-->>" in arrow_type:
            style = "dashed"

        edges.append((from_id, to_id, label.strip() if label else None, style))

    # For any node IDs referenced in edges but not defined, create default rects
    all_node_ids = set(nodes.keys())
    for from_id, to_id, _, _ in edges:
        for nid in (from_id, to_id):
            if nid not in all_node_ids:
                nodes[nid] = {"label": nid, "shape": "rect"}
                all_node_ids.add(nid)

    return {
        "type": "flowchart",
        "direction": direction,
        "nodes": nodes,
        "edges": edges,
    }


def parse_sequence(text: str) -> dict:
    """Parse Mermaid sequenceDiagram syntax.

    Handles:
        sequenceDiagram
        participant Name
        Actor->>Receiver: Message
        Actor-->>Receiver: Response
        Note over Actor: some note
    """
    participants = []
    messages = []

    for line in text.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("%%"):
            continue

        # participant definition
        if line.lower().startswith("participant "):
            name = line.split(" ", 1)[1].strip().strip('"')
            if name not in participants:
                participants.append(name)
            continue

        # actor alias: "actor Name as Alias"
        actor_match = re.match(r'actor\s+(\w+)(?:\s+as\s+(\w+))?', line, re.IGNORECASE)
        if actor_match:
            alias = actor_match.group(2) or actor_match.group(1)
            if alias not in participants:
                participants.append(alias)
            continue

        # message: Actor->>Receiver: Message or Actor-->>Receiver: Message
        msg_match = re.match(
            r'(\w+)\s*(->>|-->>|->|-->)+\s*(\w+)\s*:\s*(.+)', line
        )
        if msg_match:
            from_name = msg_match.group(1)
            to_name = msg_match.group(3)
            msg_text = msg_match.group(4).strip()
            arrow_style = msg_match.group(2)

            if from_name not in participants:
                participants.append(from_name)
            if to_name not in participants:
                participants.append(to_name)

            messages.append({
                "from": from_name,
                "to": to_name,
                "text": msg_text,
                "dashed": "--" in arrow_style,
            })
            continue

    return {
        "type": "sequence",
        "participants": participants,
        "messages": messages,
    }


def parse_er(text: str) -> dict:
    """Parse Mermaid erDiagram syntax.

    Handles:
        erDiagram
        ENTITY ||--o{ OTHER_ENTITY : relationship
        ENTITY {
            type field_name
            type field_name
        }
    """
    entities = {}  # name → {fields: [...]}
    relationships = []  # [(from, to, label, cardinality_from, cardinality_to)]

    # Precompile relationship regex
    rel_re = re.compile(
        r'(\w+)\s+(\|\||}o|o\{|\|o|o\||\}\||\|\{)\s*'
        r'(--|\.\.)\s*'
        r'(\|\||}o|o\{|\|o|o\||\}\||\|\{)\s+'
        r'(\w+)\s*:\s*(.+)'
    )

    lines = text.strip().split("\n")
    current_entity = None

    for line in lines:
        line = line.strip()
        if not line or line.startswith("%%") or line.lower() == "erdiagram":
            continue

        # Check for relationship FIRST (before block check, since cardinality
        # like o{ contains "{" which would otherwise be mistaken for a block open)
        rel_match = rel_re.match(line)
        if rel_match:
            from_entity = rel_match.group(1)
            from_card = rel_match.group(2)
            to_card = rel_match.group(4)
            to_entity = rel_match.group(5)
            label = rel_match.group(6).strip()

            if from_entity not in entities:
                entities[from_entity] = {"fields": []}
            if to_entity not in entities:
                entities[to_entity] = {"fields": []}

            relationships.append((from_entity, to_entity, label, from_card, to_card))
            continue

        # Entity attributes block
        if "{" in line:
            name = line.split("{")[0].strip()
            current_entity = name
            if name not in entities:
                entities[name] = {"fields": []}
            continue

        if "}" in line:
            current_entity = None
            continue

        if current_entity:
            field_line = line.strip()
            if field_line:
                entities[current_entity]["fields"].append(field_line)
            continue

    return {
        "type": "er",
        "entities": entities,
        "relationships": relationships,
    }


def parse_class(text: str) -> dict:
    """Parse Mermaid classDiagram syntax.

    Handles:
        classDiagram
        ClassName <|-- ParentClass  (inheritance)
        ClassName *-- OtherClass    (composition)
        ClassName : +Type field
        ClassName: +method()
        class ClassName {
            +Type field
            +method()
        }
    """
    classes = {}  # name → {attributes, methods}
    relationships = []

    lines = text.strip().split("\n")
    current_class = None

    for line in lines:
        line = line.strip()
        if not line or line.startswith("%%") or line.lower() == "classdiagram":
            continue

        # Class block
        block_match = re.match(r'class\s+(\w+)\s*\{', line)
        if block_match:
            current_class = block_match.group(1)
            if current_class not in classes:
                classes[current_class] = {"attributes": [], "methods": []}
            continue

        if current_class and "}" in line:
            current_class = None
            continue

        if current_class:
            inner = line.strip()
            if inner and not inner.startswith("}"):
                if "(" in line:
                    classes[current_class]["methods"].append(inner)
                else:
                    classes[current_class]["attributes"].append(inner)
            continue

        # Inheritance: Child <|-- Parent
        inherit_match = re.match(r'(\w+)\s*<\|--\s*(\w+)', line)
        if inherit_match:
            child = inherit_match.group(1)
            parent = inherit_match.group(2)
            for c in (child, parent):
                if c not in classes:
                    classes[c] = {"attributes": [], "methods": []}
            relationships.append((child, parent, "extends", "inheritance"))
            continue

        # Composition: Class *-- Member
        comp_match = re.match(r'(\w+)\s*\*--\s*(\w+)\s*:\s*(.+)', line)
        if comp_match:
            a = comp_match.group(1)
            b = comp_match.group(2)
            label = comp_match.group(3).strip()
            for c in (a, b):
                if c not in classes:
                    classes[c] = {"attributes": [], "methods": []}
            relationships.append((a, b, label, "composition"))
            continue

        # Inline member: ClassName : +Type field / ClassName: +method()
        member_match = re.match(r'(\w+)\s*:\s*(.+)', line)
        if member_match:
            cls_name = member_match.group(1)
            member = member_match.group(2).strip()
            if cls_name not in classes:
                classes[cls_name] = {"attributes": [], "methods": []}
            if "(" in member:
                classes[cls_name]["methods"].append(member)
            else:
                classes[cls_name]["attributes"].append(member)
            continue

    return {
        "type": "class",
        "classes": classes,
        "relationships": relationships,
    }


def parse_mermaid(text: str) -> dict:
    """Parse any Mermaid diagram syntax. Auto-detects the diagram type.

    Returns a dict with 'type' and type-specific data.
    """
    text = text.strip()

    if not text:
        raise ValueError("Empty Mermaid input")

    first_line = text.split("\n")[0].strip().lower()

    if "flowchart" in first_line or "graph " in first_line:
        return parse_flowchart(text)
    elif "sequencediagram" in first_line:
        return parse_sequence(text)
    elif "erdiagram" in first_line:
        return parse_er(text)
    elif "classdiagram" in first_line:
        return parse_class(text)
    else:
        raise ValueError(
            f"Unsupported Mermaid diagram type: '{first_line}'. "
            "Supported: flowchart, sequenceDiagram, erDiagram, classDiagram"
        )


def mermaid_to_diagram(
    mermaid_text: str,
    theme: str = "sketchy",
    **diagram_kwargs,
) -> Diagram:
    """Convert Mermaid syntax to an ec_draw Diagram.

    This is the main entry point. AI generates Mermaid syntax, and this
    function converts it to a themed Excalidraw diagram.

    Args:
        mermaid_text: Mermaid diagram definition
        theme: ec_draw theme name ("sketchy", "professional", "dark", "colorful")
        **diagram_kwargs: passed to Diagram() constructor

    Returns:
        Diagram ready to save with .save(path)

    Example:
        >>> d = mermaid_to_diagram('''
        ... flowchart TD
        ...     A[Start] --> B{Valid?}
        ...     B -->|Yes| C[Done]
        ...     B -->|No| D[Error]
        ... ''', theme="sketchy")
        >>> d.save("flow.excalidraw")
    """
    parsed = parse_mermaid(mermaid_text)

    if parsed["type"] == "flowchart":
        return _render_flowchart(parsed, theme, **diagram_kwargs)
    elif parsed["type"] == "sequence":
        return _render_sequence(parsed, theme, **diagram_kwargs)
    elif parsed["type"] == "er":
        return _render_er(parsed, theme, **diagram_kwargs)
    elif parsed["type"] == "class":
        return _render_class(parsed, theme, **diagram_kwargs)
    else:
        raise ValueError(f"Unknown diagram type: {parsed['type']}")


def _render_flowchart(parsed: dict, theme: str, **kwargs) -> Diagram:
    """Render a parsed flowchart as a Diagram."""
    nodes = parsed["nodes"]
    edges = parsed["edges"]
    direction = parsed["direction"]

    # Calculate layout
    node_ids = list(nodes.keys())
    is_vertical = direction in ("TD", "TB", "BT")

    cols = 1 if is_vertical else max(3, len(node_ids))
    d = Diagram(theme=theme, cols=cols, cell_w=180, cell_h=70, gap_x=50, gap_y=60, **kwargs)

    # Determine order: use BFS from root nodes (nodes with no incoming edges)
    has_incoming = set()
    for from_id, to_id, _, _ in edges:
        has_incoming.add(to_id)

    # Root nodes first, then BFS order
    order = [n for n in node_ids if n not in has_incoming]
    visited = set(order)
    queue = list(order)

    while queue:
        current = queue.pop(0)
        for from_id, to_id, _, _ in edges:
            if from_id == current and to_id not in visited:
                order.append(to_id)
                visited.add(to_id)
                queue.append(to_id)

    # Add any remaining nodes
    for n in node_ids:
        if n not in visited:
            order.append(n)

    # Place nodes
    for i, nid in enumerate(order):
        node = nodes[nid]
        shape = node.get("shape", "rect")
        d.add_box(
            node["label"],
            row=i if is_vertical else i // cols,
            col=0 if is_vertical else i % cols,
            shape=shape,
        )

    # Add edges
    for from_id, to_id, label, style in edges:
        if from_id in nodes and to_id in nodes:
            from_label = nodes[from_id]["label"]
            to_label = nodes[to_id]["label"]
            d.add_arrow(from_label, to_label, label=label)

    return d


def _render_sequence(parsed: dict, theme: str, **kwargs) -> Diagram:
    """Render a parsed sequence diagram as a Diagram."""
    participants = parsed["participants"]
    messages = parsed["messages"]

    n = len(participants)
    d = Diagram(theme=theme, cols=n, cell_w=150, cell_h=50, gap_x=40, gap_y=40, **kwargs)

    # Place participant boxes
    for i, name in enumerate(participants):
        d.add_box(name, row=0, col=i)

    # Add lifelines
    lifeline_top = 80
    lifeline_bottom = lifeline_top + len(messages) * 60 + 30
    for i, name in enumerate(participants):
        elem = d._named[name]
        cx = elem["x"] + elem["width"] / 2
        d.add_line(cx, lifeline_top, cx, lifeline_bottom)

    # Add messages
    for i, msg in enumerate(messages):
        from_name = msg["from"]
        to_name = msg["to"]
        text = msg["text"]

        d.add_arrow(from_name, to_name, label=text)

        # Reposition arrow vertically
        arrows = [e for e in d.elements if e["type"] == "arrow"]
        if arrows:
            a = arrows[-1]
            a["y"] = lifeline_top + 20 + i * 60
            a["height"] = 0

    return d


def _render_er(parsed: dict, theme: str, **kwargs) -> Diagram:
    """Render a parsed ER diagram as a Diagram."""
    entities = parsed["entities"]
    relationships = parsed["relationships"]

    n = len(entities)
    entity_names = list(entities.keys())

    d = Diagram(theme=theme, cols=n, cell_w=170, cell_h=90, gap_x=60, gap_y=50, **kwargs)

    # Place entity boxes
    for i, name in enumerate(entity_names):
        fields = entities[name].get("fields", [])
        h = 60 + len(fields) * 18
        d.add_box(name, row=0, col=i, height=h)

        # Add field text below the name
        elem = d._named[name]
        fy = elem["y"] + 35
        for f in fields:
            d.add_text(f, elem["x"] + 10, fy, font_size=12)
            fy += 18

    # Add relationships as labels on arrows
    for from_entity, to_entity, label, from_card, to_card in relationships:
        card_label = f"{from_card} {label} {to_card}"
        d.add_arrow(from_entity, to_entity, label=card_label)

    return d


def _render_class(parsed: dict, theme: str, **kwargs) -> Diagram:
    """Render a parsed class diagram as a Diagram."""
    classes = parsed["classes"]
    relationships = parsed["relationships"]

    n = len(classes)
    class_names = list(classes.keys())

    d = Diagram(theme=theme, cols=n, cell_w=180, cell_h=80, gap_x=60, gap_y=50, **kwargs)

    # Place class boxes with attributes and methods
    for i, name in enumerate(class_names):
        info = classes[name]
        attrs = info.get("attributes", [])
        methods = info.get("methods", [])
        total_lines = 1 + len(attrs) + len(methods)  # name + attrs + methods
        h = 35 + total_lines * 18

        d.add_box(name, row=0, col=i, height=h)

        # Add attributes and methods below name
        elem = d._named[name]
        cy = elem["y"] + 35

        # Separator line
        d.add_line(elem["x"] + 5, cy, elem["x"] + elem["width"] - 5, cy)
        cy += 10

        for attr in attrs:
            d.add_text(attr, elem["x"] + 10, cy, font_size=12)
            cy += 18

        # Separator line before methods
        d.add_line(elem["x"] + 5, cy, elem["x"] + elem["width"] - 5, cy)
        cy += 10

        for method in methods:
            d.add_text(method, elem["x"] + 10, cy, font_size=12)
            cy += 18

    # Add relationships
    for from_cls, to_cls, label, rel_type in relationships:
        d.add_arrow(from_cls, to_cls, label=label)

    return d
