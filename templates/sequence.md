# Sequence Diagram Template

Use when the user asks for a sequence diagram, message flow, API interaction,
timeline, or request/response flow.

## JSON Descriptor Approach (Recommended)

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "sequence",
  nodes: [
    { id: "Client", label: "Client" },
    { id: "API", label: "API" },
    { id: "Auth", label: "Auth" },
    { id: "DB", label: "DB" },
  ],
  edges: [
    { from: "Client", to: "API", label: "POST /login" },
    { from: "API", to: "Auth", label: "validate(token)" },
    { from: "Auth", to: "DB", label: "SELECT user" },
    { from: "DB", to: "Auth", label: "user row" },
    { from: "Auth", to: "API", label: "200 OK" },
    { from: "API", to: "Client", label: "JWT token" },
  ],
}, "professional");
```

### Multi-service Example

```ts
const doc = renderDiagram({
  type: "sequence",
  nodes: [
    { id: "Browser", label: "Browser" },
    { id: "Gateway", label: "Gateway" },
    { id: "Auth", label: "Auth" },
    { id: "Service", label: "Service" },
    { id: "Database", label: "Database" },
  ],
  edges: [
    { from: "Browser", to: "Gateway", label: "HTTPS request" },
    { from: "Gateway", to: "Auth", label: "verify JWT" },
    { from: "Auth", to: "Gateway", label: "valid" },
    { from: "Gateway", to: "Service", label: "proxied request" },
    { from: "Service", to: "Database", label: "query" },
    { from: "Database", to: "Service", label: "results" },
    { from: "Service", to: "Gateway", label: "200 OK" },
    { from: "Gateway", to: "Browser", label: "JSON response" },
  ],
}, "sketchy");
```

## Tips
- Participants are the node ids — list them in `nodes`
- Messages render top-to-bottom in the order in `edges`
- Use `professional` for API docs, `sketchy` for whiteboarding
- Each edge gets drawn as a horizontal arrow between participant lifelines
