# Architecture Diagram Template

Use when the user asks for a system architecture, service topology,
infrastructure diagram, cloud architecture, or component diagram.

## JSON Descriptor Approach (Recommended for structured topology)

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "flowchart",
  direction: "TD",
  nodes: [
    { id: "Users", label: "Users", shape: "ellipse" },
    { id: "CDN", label: "CDN" },
    { id: "LB", label: "Load Balancer" },
    { id: "Web1", label: "Web Server 1" },
    { id: "Web2", label: "Web Server 2" },
    { id: "Web3", label: "Web Server 3" },
    { id: "API", label: "API Server" },
    { id: "DB", label: "PostgreSQL" },
    { id: "Cache", label: "Redis" },
    { id: "Queue", label: "Message Queue" },
  ],
  edges: [
    { from: "Users", to: "CDN" },
    { from: "CDN", to: "LB" },
    { from: "LB", to: "Web1" },
    { from: "LB", to: "Web2" },
    { from: "LB", to: "Web3" },
    { from: "Web1", to: "API" },
    { from: "Web2", to: "API" },
    { from: "Web3", to: "API" },
    { from: "API", to: "DB" },
    { from: "API", to: "Cache" },
    { from: "API", to: "Queue" },
  ],
}, "professional");
```

### Horizontal (network) layout

```ts
const doc = renderDiagram({
  type: "flowchart",
  direction: "LR",
  nodes: [
    { id: "Browser", label: "Browser" },
    { id: "Firewall", label: "Firewall", shape: "diamond" },
    { id: "LB", label: "Load Balancer" },
    { id: "App1", label: "App 1" },
    { id: "App2", label: "App 2" },
    { id: "DB", label: "Database" },
  ],
  edges: [
    { from: "Browser", to: "Firewall" },
    { from: "Firewall", to: "LB" },
    { from: "LB", to: "App1" },
    { from: "LB", to: "App2" },
    { from: "App1", to: "DB" },
    { from: "App2", to: "DB" },
  ],
}, "professional");
```

## Diagram Builder Approach (for layered architectures)

```ts
import { Diagram } from "ec-draw";

const d = new Diagram("professional", { cols: 4, cellW: 160, cellH: 60, gapX: 40, gapY: 60 });

// Top tier: entry
d.addBox("CDN", { row: 0, col: 0, span: 4, height: 40 });
d.addBox("Load Balancer", { row: 1, col: 0, span: 4, height: 40 });

// Middle tier: services
d.addBox("Auth Service", { row: 2, col: 0 });
d.addBox("Users API", { row: 2, col: 1 });
d.addBox("Orders API", { row: 2, col: 2 });
d.addBox("Payments", { row: 2, col: 3 });

// Bottom tier: data
d.addBox("PostgreSQL", { row: 3, col: 0, span: 2, height: 45 });
d.addBox("Redis", { row: 3, col: 2 });
d.addBox("S3 Storage", { row: 3, col: 3 });

// Connections
["Auth Service", "Users API", "Orders API", "Payments"].forEach(s => {
  d.addArrow("Load Balancer", s);
});
["Auth Service", "Users API", "Orders API"].forEach(s => {
  d.addArrow(s, "PostgreSQL");
});
d.addArrow("Orders API", "Redis");
d.addArrow("Payments", "S3 Storage");

d.save("layered_arch.excalidraw");
```

## Tips
- `professional` theme for clean, document-ready architecture diagrams
- Top-to-bottom flows: entry at top, data at bottom
- Span wide boxes across columns with `span: N`
- Use `d.addIcon("database", x, y)` for database visuals
- Check `library/` for common infra icons (Google Cloud, AWS shapes)
