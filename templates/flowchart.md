# Flowchart Template

Use this template when the user asks for a flowchart, process diagram, decision
tree, state machine, or workflow.

## Mermaid Approach (Recommended)

Generate Mermaid syntax, ec-draw converts to themed Excalidraw:

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

### Mermaid Flowchart Syntax Quick Reference

```
flowchart TD              # Top→Down (also TB, LR, RL, BT)
    A[rectangle]          # Rectangle node
    B{diamond}            # Diamond (decision) node
    C((circle))           # Circle node
    D[(database)]         # Database (cylinder) node
    A --> B               # Arrow
    A -->|label| B        # Labeled arrow
    A -.-> B              # Dotted arrow
    A ==> B               # Thick arrow
    subgraph title        # Group nodes
        A --> B
    end
```

### Branching Flow

```python
mermaid = """
flowchart TD
    Start[Start] --> Check{Type?}
    Check -->|A| HandleA[Handle A]
    Check -->|B| HandleB[Handle B]
    Check -->|C| HandleC[Handle C]
    HandleA --> Merge[Done]
    HandleB --> Merge
    HandleC --> Merge
"""
d = mermaid_to_diagram(mermaid, theme="sketchy")
d.save("branching.excalidraw")
```

## Python API Approach (for custom layouts)

## Pattern

Linear or branching flow of steps connected by arrows. Decision nodes are
diamonds, process steps are rectangles, start/end are rounded rectangles.

## Basic Linear Flow

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy", cols=1, cell_w=200, cell_h=70, gap_y=50)

steps = ["Start", "Validate Input", "Process Data", "Save Results", "End"]
for i, step in enumerate(steps):
    d.add_box(step, row=i, col=0)

for i in range(len(steps) - 1):
    d.add_arrow(steps[i], steps[i + 1])

d.save("flowchart.excalidraw")
```

## With Decision Diamond

```python
d = Diagram(theme="sketchy", cols=1, cell_w=200, cell_h=70, gap_y=50)

d.add_box("Start", row=0, col=0)
d.add_box("Is Valid?", row=1, col=0, shape="diamond", width=160, height=80)
d.add_box("Process", row=2, col=0)
d.add_box("Show Error", row=3, col=0)
d.add_box("End", row=4, col=0)

d.add_arrow("Start", "Is Valid?")
d.add_arrow("Is Valid?", "Process", label="Yes")
d.add_arrow("Is Valid?", "Show Error", label="No")
d.add_arrow("Show Error", "End")
d.add_arrow("Process", "End")

d.save("decision_flow.excalidraw")
```

## Branching (Multi-Column)

```python
d = Diagram(theme="sketchy", cols=3, cell_w=180, cell_h=70, gap_x=60, gap_y=50)

d.add_box("Start", row=0, col=1)  # centered
d.add_box("Check Type?", row=1, col=1, shape="diamond", width=140, height=80)
d.add_box("Handle A", row=2, col=0)
d.add_box("Handle B", row=2, col=1)
d.add_box("Handle C", row=2, col=2)
d.add_box("Merge", row=3, col=1)

d.add_arrow("Start", "Check Type?")
d.add_arrow("Check Type?", "Handle A", label="type=A")
d.add_arrow("Check Type?", "Handle B", label="type=B")
d.add_arrow("Check Type?", "Handle C", label="type=C")
d.add_arrow("Handle A", "Merge")
d.add_arrow("Handle B", "Merge")
d.add_arrow("Handle C", "Merge")

d.save("branching_flow.excalidraw")
```

## Tips
- Use `cols=1` for vertical flows, `cols>1` for branching
- Diamond shape with `?` in the label signals a decision
- Use `label=` on arrows for branch conditions
- Keep step names short — they become box labels
