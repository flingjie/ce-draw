---
id: narrative-framework
schema_version: 1
archetype: narrative
description: N vertical sections with labeled transition arrows — for frameworks, mental models, concept diagrams
grid:
  cols: 3
  cellW: 160
  cellH: 80
  gapX: 50
  gapY: 60
direction: TB
roles:
  primary: slate
  secondary: moss
  gap: brown
  callout: amber
  muted: taupe
---

# Narrative / Framework Concept Diagram

A vertical concept diagram with 2–4 sections, each containing card items, connected by labeled transition arrows, with an optional bottom callout.

## When to use
- Framework explanation (e.g., Map vs Territory, Cynefin, SWOT)
- Mental models and concept maps
- Problem → Gap → Solution narratives
- Any diagram where the STORY across sections matters more than the topology

## Slots (AI fills these)

### title (optional)
`title: string` — Diagram title rendered as standalone text at top (24px).

### sections (2–4, required)
`sections: Section[]` — Each section:

```
{
  heading: string       // Section title (required, keep ≤30 chars)
  subtitle?: string     // Section description (optional, ≤50 chars)
  role: "primary" | "secondary" | "gap"  // Semantic role (required)
  items: Item[]         // Cards inside this section (1–6 required)
}
```

Each item:
```
{
  title: string         // Card title (required, ≤20 chars)
  subtitle?: string     // Card subtitle (optional, ≤40 chars)
  icon?: string         // Built-in icon name (optional): document, code, cloud, database,
                        //   server, user, gear, globe, mobile, lock, fire, brain
}
```

### transitions (required)
`transitions: Transition[]` — One per section boundary:

```
{
  from: number    // source section index (0-based)
  to: number      // target section index (0-based)
  label: string   // narrative label (required, ≤40 chars)
                    // describes the RELATIONSHIP, not just "then"
}
```

### callout (optional)
```
{
  text: string    // Key insight text (required, ≤80 chars)
  icon?: string   // Built-in icon name (optional, default: fire)
}
```

## Layout Rules
- Sections stack **vertically** (TB direction)
- Each section spans the full diagram width (3 columns)
- Cards within a section: grid of `min(itemCount, 3)` columns
- Transitions: vertical arrows between sections with labels
- Callout: full-width bar below the last section

## Role Colors
| Role | Color Key | Semantic Meaning |
|------|-----------|-----------------|
| `primary` | slate | Main concept, mental model, "what you think" |
| `secondary` | moss | Counterpart, real world, "what actually is" |
| `gap` | brown | Unknowns, blind spots, the gap between |
| `callout` | amber | Key insight, bottom-line message |
| `muted` | taupe | Background, supplementary |

## Anti-patterns
- ❌ Flat card list — always group cards into sections
- ❌ Silent arrows — every transition arrow must have a narrative label
- ❌ Role mismatch — primary concepts use `primary`, real-world counterparts use `secondary`
- ❌ More than 4 role colors — pick from the table above
- ❌ Single-word transition labels — describe the relationship, not the direction

## Golden Example
Map vs Territory concept diagram with 3 sections (MAP → UNKNOWNS → TERRITORY), 2 labeled transitions, and a callout.

See `tests/expected/narrative-framework.excalidraw` for expected output.
