# Architecture Diagram Template

Use when the user asks for a system architecture, service topology,
infrastructure diagram, cloud architecture, or component diagram.

## Mermaid Approach (Recommended)

```ts
import { mermaidToExcalidraw } from "ec-draw";

const mermaid = `
flowchart TD
    Users((Users)) --> CDN[CDN]
    CDN --> LB[Load Balancer]
    LB --> Web1[Web Server 1]
    LB --> Web2[Web Server 2]
    LB --> Web3[Web Server 3]
    Web1 --> API[API Server]
    Web2 --> API
    Web3 --> API
    API --> DB[(PostgreSQL)]
    API --> Cache[(Redis)]
    API --> Queue[(Message Queue)]
`;
mermaidToExcalidraw(mermaid, "professional");
```

### Mermaid Patterns for Architecture

```
flowchart TD
    ((users))          Circle — external users/traffic
    [load balancer]    Rectangle — infrastructure
    [(database)]       Database cylinder — data stores
    LR layout          Horizontal layout for network diagrams
```

### Horizontal (network) layout

```ts
const mermaid = `
flowchart LR
    Browser[Browser] --> Firewall{Firewall}
    Firewall --> LB[Load Balancer]
    LB --> App1[App 1]
    LB --> App2[App 2]
    App1 --> DB[(Database)]
    App2 --> DB
`;
mermaidToExcalidraw(mermaid, "professional");
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
- `[(label)]` = database cylinder in Mermaid
- Check `library/icons.json` for common infra shapes
