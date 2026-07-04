# Sequence Diagram Template

Use when the user asks for a sequence diagram, message flow, API interaction,
timeline, or request/response flow.

## Mermaid Approach (Recommended)

```ts
import { mermaidToExcalidraw } from "ec-draw";

const mermaid = `
sequenceDiagram
    Client->>API: POST /login
    API->>Auth: validate(token)
    Auth->>DB: SELECT user
    DB-->>Auth: user row
    Auth-->>API: 200 OK
    API-->>Client: JWT token
`;
mermaidToExcalidraw(mermaid, "professional");
```

### Mermaid Sequence Syntax

```
sequenceDiagram
    participant Name        Declare participant (optional)
    A->>B: Message          Solid arrow (request)
    B-->>A: Response        Dashed arrow (return/response)
    Note over A: Text       Annotation note
```

### Multi-service Example

```ts
const mermaid = `
sequenceDiagram
    Browser->>Gateway: HTTPS request
    Gateway->>Auth: verify JWT
    Auth-->>Gateway: valid
    Gateway->>Service: proxied request
    Service->>Database: query
    Database-->>Service: results
    Service-->>Gateway: 200 OK
    Gateway-->>Browser: JSON response
`;
mermaidToExcalidraw(mermaid, "sketchy");
```

## Tips
- Participants are auto-detected from messages — no need to declare them
- `->>` for forward messages, `-->>` for returns/responses
- Messages render top-to-bottom in the order written
- Use `professional` for API docs, `sketchy` for whiteboarding
