# Architecture Diagram Template

System topology, service mesh, infrastructure, or component diagrams.
Nodes arranged in layers or grid; edges show data flow.

Belongs to `topology` archetype (formerly `architecture`).

## When to use

- System architecture, service topology
- Infrastructure diagram, cloud architecture
- Component diagram, layered architecture
- Any diagram with services+nodes connected by data flow

## Information slots (required)

- [ ] Layers clearly separated (entry → logic → data)
- [ ] Each node has a descriptive label
- [ ] Edges show data flow direction
- [ ] Optional: icons for databases, servers, CDN, etc.

## Visual hierarchy

1. Entry layer at top (CDN, Load Balancer, API Gateway)
2. Logic layer in middle (services, workers)
3. Data layer at bottom (databases, caches, queues)
4. Icons on infrastructure nodes (database for DB, server for compute)

## Layout rules

- Direction: **TB** (entry at top, data at bottom)
- Wide boxes span across columns with `span: N`
- Group related services in same row
- Use `professional` theme for clean documentation look
- Use `d.addIcon("database", x, y)` for database visuals

## Anti-patterns

- ❌ Single-layer flat layout — use layers
- ❌ Missing edge labels on critical data flows
- ❌ Too many services in one row (max 4)

## Recommended API

### Structured (JSON descriptor + grid layout)

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "architecture",
  nodes: [
    { id: "CDN", label: "CDN" },
    { id: "LB", label: "Load Balancer" },
    { id: "Web1", label: "Web Server 1" },
    { id: "API", label: "API Server" },
    { id: "DB", label: "PostgreSQL" },
  ],
  edges: [
    { from: "CDN", to: "LB" },
    { from: "LB", to: "Web1" },
    { from: "Web1", to: "API" },
    { from: "API", to: "DB" },
  ],
}, "professional");
```

### Programmatic (Diagram API for fine control)

```ts
import { Diagram } from "ec-draw";

const d = new Diagram("professional", { cols: 4, cellW: 160, cellH: 60, gapX: 40, gapY: 60 });

// Entry tier
d.addBox("CDN", { row: 0, col: 0, span: 4 });
d.addBox("Load Balancer", { row: 1, col: 0, span: 4 });

// Service tier
d.addBox("Auth", { row: 2, col: 0 });
d.addBox("Users", { row: 2, col: 1 });
d.addBox("Orders", { row: 2, col: 2 });
d.addBox("Payments", { row: 2, col: 3 });

// Data tier
d.addBox("PostgreSQL", { row: 3, col: 0, span: 2 });
d.addBox("Redis", { row: 3, col: 2, span: 2 });

["Auth", "Users", "Orders", "Payments"].forEach(s => d.addArrow("Load Balancer", s));
["Auth", "Users", "Orders"].forEach(s => d.addArrow(s, "PostgreSQL"));

d.save("layered_arch.excalidraw");
```

## Golden reference

→ `tests/expected/architecture.excalidraw`
