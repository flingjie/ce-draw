# Architecture Diagram Template

Use this template when the user asks for a system architecture, service topology,
infrastructure diagram, cloud architecture, or component diagram.

## Pattern

Boxes arranged in layers or a grid, connected by arrows showing data flow or
dependencies. Use frames to group related components into layers/tiers.

## Layered Architecture

```python
from ec_draw import Diagram, layout

layers = layout.layered(
    [3, 4, 2],           # items per layer: Web=3, Services=4, Data=2
    start_x=50, start_y=50,
    item_w=150, item_h=55,
    layer_gap=40,
    layer_w=900,
)

d = Diagram(theme="professional", cols=4, cell_w=150, cell_h=55)

layer_names = ["Web Tier", "Services Tier", "Data Tier"]
layer_items = [
    ["CDN", "Load Balancer", "Web Server"],        # Web tier
    ["Auth", "Users API", "Orders API", "Worker"],  # Services tier
    ["PostgreSQL", "Redis"],                        # Data tier
]

for i, (name, items) in enumerate(zip(layer_names, layer_items)):
    lx, ly, lw, lh = layers[i]["layer_rect"]
    d.add_frame(name, lx, ly, lw, lh)

    for j, (ix, iy, iw, ih) in enumerate(layers[i]["items"]):
        label = items[j]
        d.add_box(label, row=0, col=0, width=iw, height=ih)
        d._named[label]["x"] = ix
        d._named[label]["y"] = iy

d.save("layered_architecture.excalidraw")
```

## Service Mesh (Grid)

```python
d = Diagram(theme="professional", cols=4, cell_w=170, cell_h=70, gap_x=40, gap_y=50)

# Top: ingress
d.add_box("API Gateway", row=0, col=0, span=4, height=50)

# Middle: services
d.add_box("Auth", row=1, col=0)
d.add_box("Users", row=1, col=1)
d.add_box("Orders", row=1, col=2)
d.add_box("Payments", row=1, col=3)

# Bottom: data
d.add_box("PostgreSQL", row=2, col=0, span=2, height=50)
d.add_box("Redis", row=2, col=2)
d.add_box("S3", row=2, col=3)

# Connections
for svc in ["Auth", "Users", "Orders", "Payments"]:
    d.add_arrow("API Gateway", svc)
for svc in ["Auth", "Users", "Orders"]:
    d.add_arrow(svc, "PostgreSQL")
d.add_arrow("Orders", "Redis")
d.add_arrow("Payments", "S3")

d.save("service_mesh.excalidraw")
```

## Cloud Architecture (With Icons)

```python
import json
from ec_draw import Diagram

# Load icons from library
with open("library/icons.json") as f:
    icons = json.load(f)

d = Diagram(theme="professional", cols=4, cell_w=150, cell_h=80, gap_x=50, gap_y=60)

# Use icon presets for cloud services
d.add_box("Load Balancer", row=0, col=1, span=2)
d.add_box("Web Server", row=1, col=0)
d.add_box("Web Server", row=1, col=1)
d.add_box("App Server", row=1, col=2)
d.add_box("App Server", row=1, col=3)
d.add_box("Database", row=2, col=1, span=2, height=50)

d.add_arrow("Load Balancer", "Web Server")
d.add_arrow("Load Balancer", "Web Server")
d.add_arrow("Web Server", "App Server")
d.add_arrow("Web Server", "App Server")
d.add_arrow("App Server", "Database")
d.add_arrow("App Server", "Database")

d.save("cloud_architecture.excalidraw")
```

## Tips
- Use `theme="professional"` for clean, crisp architecture diagrams
- Layer frames (dashed borders) visually separate tiers
- Span wide boxes across columns with `span=N`
- Name boxes after real service names for clarity
- Vertical flows: API Gateway at top, data stores at bottom
- Check `library/icons.json` before drawing common infra shapes
