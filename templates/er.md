# Entity-Relationship Diagram Template

Use when the user asks for an ER diagram, data model, database schema,
entity relationship, or table relationship diagram.

## JSON Descriptor Approach

```ts
import { renderDiagram } from "ec-draw";

const doc = renderDiagram({
  type: "er",
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

## Diagram Builder Approach

```ts
import { Diagram } from "ec-draw";

const d = new Diagram("professional", { cols: 4, cellW: 160, cellH: 60, gapX: 40, gapY: 80 });

d.addBox("CUSTOMER", { row: 0, col: 0 });
d.addBox("ORDER", { row: 0, col: 2 });
d.addBox("PRODUCT", { row: 2, col: 0 });
d.addBox("LINE_ITEM", { row: 1, col: 1 });

d.addArrow("CUSTOMER", "ORDER", { label: "1:N" });
d.addArrow("ORDER", "LINE_ITEM", { label: "1:N" });
d.addArrow("PRODUCT", "LINE_ITEM", { label: "1:N" });

d.save("er.excalidraw");
```

## Tips
- Entity names should be singular: `CUSTOMER` not `CUSTOMERS`
- Add relationship labels showing cardinality (`1:N`, `N:M`, etc.)
- Use `professional` for formal data models, `sketchy` for whiteboarding
- Use `d.addIcon("database", x, y)` for compact entity representation
