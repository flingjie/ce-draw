# Sequence Diagram Template

API flows, message passing, and interaction sequences. Participant boxes
with lifelines and message arrows between them.

Belongs to `flow` archetype (sequence engine).

## When to use

- API request/response flows
- Authentication handshakes
- Microservice interaction sequences
- Any ordered message exchange between participants

## Information slots (required)

- [ ] 2–6 participants (client, server, service, database)
- [ ] Ordered messages between participants
- [ ] Message labels describing the action

## Visual hierarchy

1. Participant boxes at top (evenly spaced)
2. Lifelines extending downward
3. Message arrows between lifelines, stacked vertically in order
4. Labels on every message arrow

## Layout rules

- Auto-layout by sequence engine
- Direction: **LR** (left-to-right, horizontal arrows)
- Messages ordered top-to-bottom in `edges` array
- Max 6 participants, max ~20 messages

## Anti-patterns

- ❌ Too many participants (max 6)
- ❌ Missing message labels
- ❌ Out-of-order messages in edges array

## Recommended API

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "sequence",
  direction: "LR",
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

## Golden reference

→ `examples/sequence.excalidraw`
