# Entity-Relationship Diagram Template

Use this template when the user asks for an ER diagram, data model, database
schema, entity relationship, or table relationship diagram.

## Mermaid Approach (Recommended)

```python
from ec_draw import mermaid_to_diagram

mermaid = """
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
        string status
        date created_at
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
"""
d = mermaid_to_diagram(mermaid, theme="professional")
d.save("er_diagram.excalidraw")
```

### Mermaid ER Syntax Quick Reference

```
erDiagram
    ENTITY ||--o{ OTHER : relationship
    ||      exactly one
    }|      one or more
    |o      zero or one
    o{      zero or more
    ||--o{  one to zero-or-more
    {
        type field         # Attribute in entity block
    }
```

## Python API Approach (for custom layouts)

## Pattern

Entities are rectangles with the entity name as header and attributes listed
below. Relationships are diamonds connected to entities by lines.

## Basic ER Diagram

```python
from ec_draw import Diagram

d = Diagram(theme="sketchy", cols=3, cell_w=180, cell_h=100, gap_x=80, gap_y=80)

# Entities (tables)
entities = [
    ("User", ["id (PK)", "name", "email", "created_at"]),
    ("Order", ["id (PK)", "user_id (FK)", "total", "status"]),
    ("Product", ["id (PK)", "name", "price", "stock"]),
]

for i, (name, attrs) in enumerate(entities):
    d.add_box(name, row=1, col=i, height=40 + len(attrs) * 22)

    # Add attribute text below the entity name
    elem = d._named[name]
    attr_y = elem["y"] + 40
    for attr in attrs:
        d.add_text(attr, elem["x"] + 10, attr_y, font_size=14)
        attr_y += 22

# Relationships
d.add_arrow("User", "Order", label="places")
d.add_arrow("Order", "Product", label="contains")

d.save("er_diagram.excalidraw")
```

## With Diamond Relationships

```python
d = Diagram(theme="professional", cols=5, cell_w=150, cell_h=80, gap_x=60, gap_y=60)

d.add_box("Customer", row=1, col=0)
d.add_box("Rental", row=1, col=2)
d.add_box("Movie", row=1, col=4)

# Relationship diamonds
d.add_box("rents", row=1, col=1, shape="diamond", width=100, height=60)
d.add_box("includes", row=1, col=3, shape="diamond", width=100, height=60)

d.add_arrow("Customer", "rents")
d.add_arrow("rents", "Rental")
d.add_arrow("Rental", "includes")
d.add_arrow("includes", "Movie")

d.save("er_diamond.excalidraw")
```

## Tips
- Entity names should be singular nouns (User, not Users)
- PK = Primary Key, FK = Foreign Key — mark them in attributes
- Diamonds represent relationship types
- Lines connect entities through relationships
- Cardinality labels ("1", "N", "0..1") go on arrow labels
- Use `theme="professional"` for formal data models, `"sketchy"` for whiteboarding
