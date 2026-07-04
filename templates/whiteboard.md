# Whiteboard Template

Use this template when the user asks for a freeform sketch, whiteboard,
brainstorm, rough idea, or "just draw something." Whiteboards are informal —
use the sketchy theme, free positioning, and a mix of shapes.

## Pattern

No fixed structure. Mix rectangles, ellipses, text, arrows, and lines freely.
Group related ideas visually with proximity and frames.

## Brainstorm

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy", cols=3, cell_w=180, cell_h=80, gap_x=50, gap_y=50)

# Central idea
d.add_box("Core Problem", row=1, col=1, shape="ellipse", width=200, height=100)

# Surrounding ideas
ideas = [
    ("Users hate\nthis UX", 0, 0),
    ("Too slow", 0, 2),
    ("Costs too much", 2, 0),
    ("Hard to deploy", 2, 2),
]
for text, row, col in ideas:
    d.add_box(text, row=row, col=col)

# Connect all to center
for text, _, _ in ideas:
    d.add_arrow(text, "Core Problem")

d.save("brainstorm.excalidraw")
```

## Concept Sketch

```python
d = Diagram(theme="sketchy", cols=1, cell_w=500, cell_h=60, gap_y=40)

d.add_box("User visits page", row=0, col=0)
d.add_box("System checks auth", row=1, col=0)
d.add_box("If authenticated:", row=2, col=0)
d.add_box("Show dashboard", row=3, col=0)
d.add_box("If not:", row=2, col=0, shape="diamond", width=100, height=60)
d.add_box("Redirect to login", row=4, col=0)

d.add_arrow("User visits page", "System checks auth")
d.add_arrow("System checks auth", "If authenticated:")
d.add_arrow("If authenticated:", "Show dashboard")

d.save("concept_sketch.excalidraw")
```

## Comparison / Pro-Con

```python
d = Diagram(theme="sketchy", cols=2, cell_w=250, cell_h=200, gap_x=40, gap_y=40)

d.add_box("Option A: Monolith\n\n+ Simple\n+ Fast to build\n- Hard to scale\n- Tight coupling", row=0, col=0, height=180)
d.add_box("Option B: Microservices\n\n+ Scalable\n+ Independent deploys\n- Complex\n- Network overhead", row=0, col=1, height=180)
d.add_box("Decision: Start with A,\nmigrate to B when needed", row=1, col=0, span=2, height=70)

d.add_arrow("Option A: Monolith\n\n+ Simple\n+ Fast to build\n- Hard to scale\n- Tight coupling", "Decision: Start with A,\nmigrate to B when needed")
d.add_arrow("Option B: Microservices\n\n+ Scalable\n+ Independent deploys\n- Complex\n- Network overhead", "Decision: Start with A,\nmigrate to B when needed")

d.save("comparison.excalidraw")
```

## Tips
- Use `\n` in labels for multi-line text in boxes
- Mix shapes freely — ellipses for ideas, diamonds for decisions
- Don't overthink positioning — whiteboards are meant to be rough
- Always use `theme="sketchy"` for the hand-drawn whiteboard feel
- Use `span=N` for wide boxes that span multiple columns
- Frames can group related clusters
