# Mermaid Syntax Reference

## Flowchart

```
flowchart TD              Top→Down (also TB, LR, RL, BT)
    A[rectangle label]    Rectangle node
    B{diamond label}      Diamond (decision)
    C((circle label))     Circle/ellipse
    D[(database label)]   Database cylinder
    A --> B               Solid arrow
    A -->|label| B        Arrow with label
    A -.-> B              Dotted arrow
    A ==> B               Thick arrow
```

### Examples

```
flowchart TD
    Start[Start] --> Input[Get Input]
    Input --> Check{Valid?}
    Check -->|Yes| Process[Process]
    Check -->|No| Error[Show Error]
    Process --> End[End]
    Error --> Input
```

```
flowchart LR
    A[Browser] --> B[Load Balancer]
    B --> C[Web Server 1]
    B --> D[Web Server 2]
    C --> E[Database]
    D --> E
```

## Sequence Diagram

```
sequenceDiagram
    Alice->>Bob: Message       Solid arrow
    Bob-->>Alice: Reply        Dashed return
    A->>B: Request             Forward message
    B-->>A: Response           Return message
```

### Example

```
sequenceDiagram
    Client->>API: POST /login
    API->>Auth: validate(token)
    Auth->>DB: SELECT user
    DB-->>Auth: user row
    Auth-->>API: 200 OK
    API-->>Client: JWT token
```

## ER Diagram

```
erDiagram
    ENTITY1 ||--o{ ENTITY2 : relationship label
    ENTITY1 {
        type field_name
        type field_name PK
    }
```

### Cardinality

| Symbol | Meaning |
|--------|---------|
| `\|\|` | exactly one |
| `}\|` | one or more |
| `\|o` | zero or one |
| `o{` | zero or more |

### Example

```
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
    }
```

## Class Diagram

```
classDiagram
    Animal <|-- Duck          Inheritance
    Animal : +int age         Attribute
    Animal : +swim()          Method
```

### Example

```
classDiagram
    Vehicle <|-- Car
    Vehicle <|-- Motorcycle
    Vehicle : +String brand
    Vehicle : +int speed
    Vehicle : +drive()
    Car : +int doors
    Car : +honk()
```
