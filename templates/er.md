# Entity-Relationship Diagram Template

Use when the user asks for an ER diagram, data model, database schema,
entity relationship, or table relationship diagram.

## Mermaid Approach (Recommended)

```ts
import { mermaidToExcalidraw } from "ec-draw";

const mermaid = `
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : includes
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created_at
        string status
        int customer_id FK
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
`;
mermaidToExcalidraw(mermaid, "professional");
```

### Mermaid ER Cardinality

| Symbol | Meaning |
|--------|---------|
| `\|\|` | exactly one |
| `}\|` | one or more |
| `\|o` | zero or one |
| `o{` | zero or more |

### Relationship Patterns

```
erDiagram
    A ||--|| B : one-to-one
    A ||--o{ B : one-to-many
    A }o--o{ B : many-to-many
    A ||--o| B : one-to-zero-or-one
```

## Tips
- Entity names should be singular: `USER` not `USERS`
- Mark PK (primary key) and FK (foreign key) in attribute types
- Attributes render below the entity box automatically
- Use `professional` for formal data models, `sketchy` for whiteboarding
