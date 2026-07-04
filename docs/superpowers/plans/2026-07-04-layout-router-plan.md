# Layout Router + Layout Engine Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Extract 4 layout engines (dagre, grid, sequence, pipeline) into `layout/` with a unified interface and smart router that auto-selects the best strategy per diagram type.

**Architecture:** Each layout engine implements `(nodes, edges, opts) → Map<string, Position>` plus optional type-specific metadata. The router maps diagram intent → engine. Renderer functions consume positions only — clean separation.

**Tech Stack:** TypeScript, dagre (existing), Node.js

## Global Constraints

- Zero behavioral change for existing diagram types (flowchart, sequence, ER, class)
- All 5 golden tests pass without modification
- All public exports preserved in `index.ts`
- No new npm dependencies
- Each layout engine is a pure function: input = graph data, output = positions

---

## Target Structure

```
src/
├── layout/
│   ├── dagre.ts          — runDagreLayout() extracted from mermaid.ts
│   ├── grid.ts           — gridLayout() extracted from diagram.ts
│   ├── sequence.ts       — sequenceLayout() extracted from mermaid.ts
│   ├── pipeline.ts       — NEW: pipelineLayout() linear equidistant stages
│   ├── router.ts         — routeLayout(type, nodes, edges, opts) → LayoutResult
│   └── types.ts          — LayoutNode, LayoutEdge, LayoutOptions, LayoutResult
│
├── mermaid.ts            — parser + orchestrator (slimmed, delegates to layout/)
├── diagram.ts            — Diagram class (uses layout/grid)
└── index.ts              — updated exports
```

## Layout Engine Signatures

### Unified Node/Edge types (`layout/types.ts`)

```ts
export interface LayoutNode {
  id: string;
  label: string;
  shape?: string;        // "rectangle" | "diamond" | "ellipse" | "roundrect"
}

export interface LayoutEdge {
  from: string;
  to: string;
  label?: string | null;
}

export interface LayoutResult {
  positions: Map<string, Position>;
  type: string;          // "dagre" | "grid" | "sequence" | "pipeline"
  // Engine-specific metadata
  meta?: Record<string, any>;
}
```

### 1. `dagreLayout(nodes, edges, opts)` → LayoutResult

- `opts.direction`: `Direction` (default `"TB"`)
- `opts.fontSize`: number (default 16)
- Uses dagre library for automatic graph positioning
- Returns standard LayoutResult

### 2. `gridLayout(nodes, edges, opts)` → LayoutResult

- `opts.cols`: number (default 3)
- `opts.cellW`, `opts.cellH`: number (default 160, 80)
- `opts.gapX`, `opts.gapY`: number (default 40, 50)
- Maps node index → row/col → x/y
- Row/col can be overridden per-node via annotation

### 3. `sequenceLayout(nodes, positions, messages)` → LayoutResult with SequenceMeta

- Takes dagre positions as input (for participant boxes)
- Computes lifeline positions and message slots
- `meta.sequence`: `{ lifelineTop, lifelineBottom, lifelines[], messageSlots[] }`

### 4. `pipelineLayout(nodes, edges, opts)` → LayoutResult (NEW)

- `opts.direction`: `Direction` (default `"LR"`)
- Linear equidistant stages, arrow connections between consecutive nodes
- Stage spacing: configurable (default 200px horizontal, 150px vertical)
- Perfect for CI/CD pipelines, deployment flows, linear workflows

## Router Design (`layout/router.ts`)

```ts
function routeLayout(
  diagramType: string,   // "flowchart" | "sequence" | "er" | "class" | "pipeline" | "architecture"
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts?: {
    direction?: Direction;
    explicit?: "dagre" | "grid" | "sequence" | "pipeline"; // force a specific engine
    cols?: number;
    cellW?: number;
    cellH?: number;
  }
): LayoutResult
```

**Routing table:**

| Type | Engine | Default opts |
|------|--------|-------------|
| `flowchart` (TB/TD) | dagre | direction: TB |
| `flowchart` (LR) | dagre | direction: LR |
| `flowchart` (RL) | dagre | direction: RL |
| `flowchart` (BT) | dagre | direction: BT |
| `sequence` | sequence (wrapper: dagre for actants + sequence for lifelines) |
| `er` | dagre | direction: TB |
| `class` | dagre | direction: TB |
| `pipeline` / `workflow` | pipeline | direction: LR |
| `architecture` / `arch` | grid | cols: 4, cellW: 160 |

`opts.explicit` bypasses detection — user forces a specific engine.

---

## Task Breakdown

### Task 1: Create `src/layout/types.ts` — shared layout interfaces

**Files:** Create `src/layout/types.ts`

Add `LayoutNode`, `LayoutEdge`, `LayoutOptions`, `LayoutResult` interfaces. Also re-export `Position` and `Direction` from `types.ts` for convenience.

### Task 2: Extract `src/layout/dagre.ts` from `mermaid.ts`

**Files:** Create `src/layout/dagre.ts`, Modify `src/mermaid.ts` imports

Move `runDagreLayout` and `routeArrow` from `mermaid.ts` → `layout/dagre.ts`. The function now accepts `LayoutNode[]` and `LayoutEdge[]` (structural subtype of `ParsedNode`/`ParsedEdge`). `mermaid.ts` imports from `layout/dagre.js`.

### Task 3: Extract `src/layout/grid.ts` from `diagram.ts`

**Files:** Create `src/layout/grid.ts`, Modify `src/diagram.ts`

Extract `_gridPos` logic into `gridLayout(nodes, edges, opts)`. The `Diagram` class calls `gridLayout` internally.

### Task 4: Extract `src/layout/sequence.ts` from `mermaid.ts`

**Files:** Create `src/layout/sequence.ts`, Modify `src/mermaid.ts`

Extract lifeline + message position computation into `sequenceLayout(nodes, positions, messages)`. Pure computation, zero element creation.

### Task 5: Create `src/layout/pipeline.ts` — NEW pipeline layout

**Files:** Create `src/layout/pipeline.ts`

Implement `pipelineLayout(nodes, edges, opts)`. Linear equidistant stages:
- Horizontal (LR): stages at fixed x intervals, centered vertically
- Vertical (TB): stages at fixed y intervals, centered horizontally
- Arrow routing: simple straight lines between consecutive stages
- Stage box size: configurable (default 160×60)

### Task 6: Create `src/layout/router.ts` — layout router

**Files:** Create `src/layout/router.ts`

Implement `routeLayout(type, nodes, edges, opts)`. Contains the routing table and dispatches to the correct engine. This is the main entry point for layout selection.

### Task 7: Integrate router into `mermaid.ts`

**Files:** Modify `src/mermaid.ts`

`mermaidToExcalidraw()` now calls `routeLayout(parsed.type, parsed.nodes, parsed.edges, { direction: parsed.direction })` instead of directly calling `runDagreLayout`. Sequence handling is part of the router.

### Task 8: Update `index.ts` exports

**Files:** Modify `src/index.ts`

Export new public symbols: `routeLayout`, `pipelineLayout`, `gridLayout`, `dagreLayout`, `LayoutNode`, `LayoutEdge`, `LayoutResult`.

### Task 9: Build + golden tests + verification

- Build, run all 5 golden tests, verify zero diff
- Smoke test with a pipeline diagram
