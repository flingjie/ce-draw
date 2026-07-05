# Entity-Relationship / Class Diagram Template

Database schemas, data models, class hierarchies. Entities as boxes,
relationships as labeled edges.

Belongs to `flow` archetype (dagre layout).

## When to use

- Database schema, entity-relationship
- Class hierarchy, UML class diagrams
- Data modeling, table relationships

## Information slots (required)

- [ ] Entity/class nodes with descriptive labels (singular: `CUSTOMER` not `CUSTOMERS`)
- [ ] Relationship edges between entities
- [ ] Edge labels showing cardinality (`1:N`, `N:M`, `places`, `contains`)

## Visual hierarchy

1. Primary entities positioned centrally
2. Related entities connected outward
3. Cardinality labels on every edge

## Layout rules

- Direction: **TB**
- `er` or `class` type → dagre engine
- Rectangle shape for all entities
- Max 15 entities for readability

## Anti-patterns

- ❌ Too many entities without logical grouping
- ❌ Missing cardinality labels on relationships
- ❌ Plural entity names (use singular)

## Recommended API

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "er",
  direction: "TB",
  nodes: [
    { id: "CUSTOMER", label: "CUSTOMER" },
    { id: "ORDER", label: "ORDER" },
    { id: "PRODUCT", label: "PRODUCT" },
    { id: "LINE_ITEM", label: "LINE_ITEM" },
  ],
  edges: [
    { from: "CUSTOMER", to: "ORDER", label: "places (1:N)" },
    { from: "ORDER", to: "LINE_ITEM", label: "contains (1:N)" },
    { from: "PRODUCT", to: "LINE_ITEM", label: "includes (1:N)" },
  ],
}, "professional");
```

## Golden reference

→ `tests/expected/flowchart_json.excalidraw` (dagre layout pattern)
