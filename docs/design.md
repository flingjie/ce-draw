# ec-draw Design Principles

## Architecture Decisions

### Pipeline: Layout → Normalize → Theme → Excalidraw

1. Create nodes and edges (via Diagram API or JSON descriptor)
2. Layout with router (dagre/grid/pipeline/sequence)
3. Normalize: apply consistent roughness, font, stroke
4. Theme: map semantic roles to visual styles
5. Output: write .excalidraw JSON

### Two Entry Points

**Diagram API** — programmatic grid-based positioning:
```
new Diagram() → addBox/addArrow → normalize → .excalidraw
```

**JSON Descriptor** — declarative with auto-layout:
```
renderDiagram({type, nodes, edges}) → routeLayout() → buildShapes → .excalidraw
```

### Why dagre?

- Deterministic layout — same input = same output
- Handles edge routing, rank assignment, node sizing
- Lightweight, no browser dependency
- Excalidraw uses dagre internally

### Style Normalization Layer

Every element goes through `normalize.ts` before theme application:

- Roundness → roughness mapping
- Font family/size enforcement
- Stroke width normalization
- Opacity clamping
- Padding enforcement

This ensures themes only control color, not structure.

## Constraint System

All prompts follow these constraints (enforced by `SKILL.md`):

- Max 5 colors per diagram
- 120px margin on all sides
- Left-to-right flow preferred
- Library icons first, inline shapes second
- Never duplicate icon definitions
