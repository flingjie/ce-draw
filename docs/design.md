# ec-draw Design Principles

## Architecture Decisions

### Pipeline: Mermaid → Dagre → Normalize → Theme → Excalidraw

1. Parse Mermaid text into AST
2. Layout with dagre (directed graph layout engine)
3. Normalize: apply consistent roughness, font, stroke
4. Theme: map semantic roles to visual styles
5. Output: write .excalidraw JSON

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

All prompts follow these constraints (enforced by `AGENTS.md`):

- Max 5 colors per diagram
- 120px margin on all sides
- Left-to-right flow preferred
- Library icons first, inline shapes second
- Never duplicate icon definitions
