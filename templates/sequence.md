# Sequence Diagram Template

Use this template when the user asks for a sequence diagram, message flow,
API interaction, timeline, or request/response flow.

## Mermaid Approach (Recommended)

```python
from ec_draw import mermaid_to_diagram

mermaid = """
sequenceDiagram
    Client->>API: POST /login
    API->>Auth: validate(token)
    Auth->>DB: SELECT user
    DB-->>Auth: user row
    Auth-->>API: 200 OK
    API-->>Client: JWT token
"""
d = mermaid_to_diagram(mermaid, theme="professional")
d.save("sequence.excalidraw")
```

### Mermaid Sequence Syntax Quick Reference

```
sequenceDiagram
    participant Name          # Declare participant
    A->>B: Message            # Solid arrow
    B-->>A: Response          # Dashed arrow (return)
    A->>A: Self-call          # Self-referential
    Note over A: Description  # Note/annotation
```

## Python API Approach (for custom lifelines)
lifelines. Messages are arrows between lifelines, ordered top to bottom.

## Basic Sequence

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy", cols=4, cell_w=160, cell_h=50, gap_x=60, gap_y=30)

# Participants across the top
participants = ["Client", "API Gateway", "Auth Service", "Database"]
for i, name in enumerate(participants):
    d.add_box(name, row=0, col=i)

# Lifelines (vertical dashed lines below each participant)
box_h = 50
total_msgs = 5
msg_spacing = 60
lifeline_top = box_h + 30
lifeline_bottom = lifeline_top + total_msgs * msg_spacing + 30

for i, name in enumerate(participants):
    elem = d._named[name]
    cx = elem["x"] + elem["width"] / 2
    d.add_line(cx, lifeline_top, cx, lifeline_bottom)

# Messages (arrows between participants)
msg_y = lifeline_top + 20
messages = [
    ("Client", "API Gateway", "POST /login"),
    ("API Gateway", "Auth Service", "validate(token)"),
    ("Auth Service", "Database", "SELECT user"),
    ("Database", "Auth Service", "user row"),
    ("Auth Service", "API Gateway", "200 OK + JWT"),
    ("API Gateway", "Client", "200 OK"),
]

for from_name, to_name, msg_text in messages:
    from_elem = d._named[from_name]
    to_elem = d._named[to_name]
    fx = from_elem["x"] + from_elem["width"] / 2
    tx = to_elem["x"] + to_elem["width"] / 2
    d.add_arrow(from_name, to_name, label=msg_text)
    # Reposition arrow to correct y level
    arrows = [e for e in d.elements if e["type"] == "arrow"]
    arrows[-1]["y"] = msg_y
    arrows[-1]["height"] = 0  # horizontal arrow
    msg_y += msg_spacing

d.save("sequence.excalidraw")
```

## API Flow (Simplified)

```python
d = Diagram(theme="professional", cols=3, cell_w=160, cell_h=50, gap_x=80, gap_y=50)

actors = ["Browser", "Server", "Database"]
for i, name in enumerate(actors):
    d.add_box(name, row=0, col=i)

d.add_arrow("Browser", "Server", label="GET /api/users")
d.add_arrow("Server", "Database", label="SELECT * FROM users")
d.add_arrow("Database", "Server", label="rows[]")
d.add_arrow("Server", "Browser", label="200 OK + JSON")

d.save("api_flow.excalidraw")
```

## Tips
- Participants go across the top in order of involvement
- Messages read top-to-bottom in chronological order
- Use `label=` on arrows for the message content
- Return/response arrows can use `start_arrowhead="arrow"` for open arrows
- Add vertical lifelines for a more complete sequence diagram look
- For complex sequences, increase `gap_y` to leave room for labels
