# Layout/Renderer Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple `mermaid.ts` and `normalize.ts` into pure `layout/` engines and `renderer/` modules — zero behavioral change.

**Architecture:** Extract layout functions (dagre, sequence, grid) into `layout/`, extract rendering functions (factory, normalize, shapes) into `renderer/`. `mermaid.ts` becomes a thin orchestrator (~200 lines). `normalize.ts` file deleted.

**Tech Stack:** TypeScript, dagre, Node.js crypto

## Global Constraints

- Zero behavioral change — outputs must be byte-identical to current
- All 5 golden tests pass without modification
- All public exports preserved in `index.ts`
- No new npm dependencies

---

### Task 1: Add shared types to `types.ts`

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `Position`, `Direction` types for layout/ and renderer/ consumers

- [ ] **Step 1: Add `Position` and `Direction` types**

Add to `src/types.ts` after the `Point` interface (line 10):

```ts
export type Direction = "TB" | "LR" | "RL" | "BT";

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

- [ ] **Step 2: Build to verify types compile**

```bash
npm run build
```

Expected: clean compile

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add Position and Direction for layout/renderer modules"
```

---

### Task 2: Create `src/layout/grid.ts`

**Files:**
- Create: `src/layout/grid.ts`

**Interfaces:**
- Produces: `gridPosition(index, cols, cellW, cellH, gapX, gapY, originX?, originY?) → {x, y}`

- [ ] **Step 1: Create the file**

```ts
/**
 * Manual grid layout — computes x/y from row/column index.
 * Used by the Diagram class for freeform layouts.
 */

export function gridPosition(
  index: number,
  cols: number,
  cellW: number,
  cellH: number,
  gapX: number,
  gapY: number,
  originX: number = 50,
  originY: number = 50
): { x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: originX + col * (cellW + gapX),
    y: originY + row * (cellH + gapY),
  };
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean compile

- [ ] **Step 3: Commit**

```bash
git add src/layout/grid.ts
git commit -m "feat(layout): add grid layout function"
```

---

### Task 3: Create `src/layout/dagre.ts`

**Files:**
- Create: `src/layout/dagre.ts`

**Interfaces:**
- Produces: `runDagreLayout(nodes, edges, direction, fontSize) → Map<string, Position>`, `routeArrow(fromPos, toPos, direction) → {fx, fy, tx, ty}`
- Internal: `DagreNode { id, label, shape }`, `DagreEdge { from, to }`

- [ ] **Step 1: Create the file**

Extract `runDagreLayout` and `routeArrow` from `src/mermaid.ts` lines 202-271. Use minimal internal interfaces instead of parser types.

```ts
/**
 * Dagre layout engine — wraps dagre for automatic graph positioning.
 * Pure functions: input = nodes + edges, output = positions.
 */

import dagre from "dagre";
import type { Position, Direction } from "../types.js";
import { getSpacing } from "../token_compiler.js";
import { textWidth } from "../renderer/factory.js";

// Minimal internal types — satisfied by ParsedNode/ParsedEdge from mermaid.ts
interface DagreNode { id: string; label: string; shape: string; }
interface DagreEdge { from: string; to: string; }

/**
 * Run dagre layout on a graph. Returns a map of node id → position.
 */
export function runDagreLayout(
  nodes: DagreNode[],
  edges: DagreEdge[],
  direction: Direction = "TB",
  fontSize: number = 16
): Map<string, Position> {
  const sp = getSpacing();
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: direction,
    nodesep: sp.nodeSep,
    ranksep: sp.rankSep,
    edgesep: sp.edgeSep,
    marginx: sp.marginX,
    marginy: sp.marginY,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    const lineHeight = fontSize * 1.4;
    const lines = n.label.split("\n");
    const maxLineW = Math.max(...lines.map(l => textWidth(l, fontSize)));
    const w = Math.max(maxLineW + sp.nodePadX, n.shape === "diamond" ? 100 : 80);
    const h = Math.max(lines.length * lineHeight + sp.nodePadY, n.shape === "diamond" ? 70 : 50);
    g.setNode(n.id, { label: n.label, width: w, height: h });
  }
  for (const e of edges) g.setEdge(e.from, e.to, {});

  dagre.layout(g);

  const positions = new Map<string, Position>();
  for (const nid of g.nodes()) {
    const n = g.node(nid);
    positions.set(nid, { x: n.x - n.width / 2, y: n.y - n.height / 2, width: n.width, height: n.height });
  }
  return positions;
}

/**
 * Compute arrow start/end points based on layout direction.
 */
export function routeArrow(
  fromPos: Position,
  toPos: Position,
  direction: Direction
): { fx: number; fy: number; tx: number; ty: number } {
  if (direction === "TB") {
    return {
      fx: fromPos.x + fromPos.width / 2, fy: fromPos.y + fromPos.height,
      tx: toPos.x + toPos.width / 2,   ty: toPos.y,
    };
  }
  if (direction === "BT") {
    return {
      fx: fromPos.x + fromPos.width / 2, fy: fromPos.y,
      tx: toPos.x + toPos.width / 2,   ty: toPos.y + toPos.height,
    };
  }
  if (direction === "RL") {
    return {
      fx: fromPos.x,                     fy: fromPos.y + fromPos.height / 2,
      tx: toPos.x + toPos.width,        ty: toPos.y + toPos.height / 2,
    };
  }
  // LR
  return {
    fx: fromPos.x + fromPos.width,      fy: fromPos.y + fromPos.height / 2,
    tx: toPos.x,                        ty: toPos.y + toPos.height / 2,
  };
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: FAIL — `../renderer/factory.js` doesn't exist yet. This is expected; the dependency will be satisfied when Task 5 creates it. Proceed to commit.

- [ ] **Step 3: Commit**

```bash
git add src/layout/dagre.ts
git commit -m "feat(layout): add dagre layout engine"
```

---

### Task 4: Create `src/layout/sequence.ts`

**Files:**
- Create: `src/layout/sequence.ts`

**Interfaces:**
- Produces: `SequenceLayout` interface, `calculateSequenceLayout(nodes, positions, messages) → SequenceLayout`

- [ ] **Step 1: Create the file**

Extract lifeline and message position computation from `mermaid.ts` lines 427-482. Pure computation only — no element creation.

```ts
/**
 * Sequence diagram layout — computes lifeline and message positions.
 * Pure functions: input = participants + positions, output = layout data.
 */

import type { Position } from "../types.js";

export interface SequenceLayout {
  lifelineTop: number;
  lifelineBottom: number;
  lifelines: Array<{ nodeId: string; cx: number }>;
  messageSlots: Array<{
    from: string;
    to: string;
    fromX: number;
    toX: number;
    y: number;
    text: string | null;
  }>;
}

export function calculateSequenceLayout(
  nodes: Array<{ id: string }>,
  positions: Map<string, Position>,
  messages: Array<{ from: string; to: string; text: string }> | undefined
): SequenceLayout {
  const firstPos = positions.values().next().value;
  const lifelineTop = (firstPos?.y ?? 50) + 70;
  const msgCount = messages?.length ?? 0;
  const lifelineBottom = lifelineTop + Math.max(msgCount * 60, 100) + 20;

  const lifelines = nodes.map(node => {
    const pos = positions.get(node.id)!;
    return { nodeId: node.id, cx: pos.x + pos.width / 2 };
  });

  const msgSpacing = 55;
  let msgY = lifelineTop + 15;
  const messageSlots = (messages ?? []).map(msg => {
    const fp = positions.get(msg.from);
    const tp = positions.get(msg.to);
    const fromX = fp ? fp.x + fp.width / 2 : 0;
    const toX = tp ? tp.x + tp.width / 2 : 0;
    const slot = {
      from: msg.from,
      to: msg.to,
      fromX,
      toX,
      y: msgY,
      text: msg.text,
    };
    msgY += msgSpacing;
    return slot;
  });

  return { lifelineTop, lifelineBottom, lifelines, messageSlots };
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean compile (no new deps on uncreated files)

- [ ] **Step 3: Commit**

```bash
git add src/layout/sequence.ts
git commit -m "feat(layout): add sequence layout calculator"
```

---

### Task 5: Create `src/renderer/factory.ts`

**Files:**
- Create: `src/renderer/factory.ts`

**Interfaces:**
- Produces: `makeId()`, `hashSeed()`, `textWidth()`, `createElement()`, `createTextElement()`
- These are exact copies from `src/normalize.ts`

- [ ] **Step 1: Create the file**

Copy from `src/normalize.ts` lines 12-94 (makeId, hashSeed, textWidth, createElement, createTextElement):

```ts
/**
 * Element factory — low-level Excalidraw element constructors.
 * Every element originates from createElement() / createTextElement().
 */

import type { ExcalidrawElement } from "../types.js";

// ── ID & Text Helpers ──────────────────────────────────────────

/** Create an element ID using Node.js built-in crypto. */
export function makeId(): string {
  return crypto.randomUUID();
}

/**
 * Compute a deterministic seed from an element ID via djb2 hash.
 * Same ID → same seed → same roughness jitter.
 */
export function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 0x7fffffff;
}

/** Estimate text display width. 0.6× for ASCII, 1.0× for CJK/emoji. */
export function textWidth(content: string, fontSize: number): number {
  let width = 0;
  for (const ch of content) {
    if (/[一-鿿　-〿＀-￯\u{1f300}-\u{1f9ff}]/u.test(ch)) {
      width += fontSize;
    } else {
      width += fontSize * 0.6;
    }
  }
  return width || fontSize;
}

// ── Element Factory ────────────────────────────────────────────

/**
 * Shared element factory — the single source of truth for building
 * Excalidraw element dicts. Every element originates here.
 */
export function createElement(
  type: string,
  overrides: Record<string, any> = {}
): ExcalidrawElement {
  const id = overrides.id ?? makeId();
  return {
    id,
    type,
    x: 0, y: 0, width: 0, height: 0,
    angle: 0,
    strokeColor: "#000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    boundElements: null,
    locked: false,
    strokeSharpness: "round",
    isDeleted: false,
    link: null,
    updated: 0,
    seed: hashSeed(id),
    version: 2,
    versionNonce: 0,
    frameId: null,
    ...overrides,
  } as unknown as ExcalidrawElement;
}

/** Create a text element with text-specific defaults. */
export function createTextElement(
  content: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: number,
  containerId: string | null = null
): ExcalidrawElement {
  return createElement("text", {
    x, y,
    width: textWidth(content, fontSize),
    height: fontSize * 1.5,
    text: content,
    fontSize,
    fontFamily,
    textAlign: "center",
    verticalAlign: "middle",
    containerId,
    autoResize: true,
    lineHeight: 1.25,
    baseline: fontSize * 0.8,
    originalText: content,
    strokeColor: "#1F2937",
    strokeWidth: 1,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/factory.ts
git commit -m "feat(renderer): add element factory (extracted from normalize.ts)"
```

---

### Task 6: Create `src/renderer/normalize.ts`

**Files:**
- Create: `src/renderer/normalize.ts`

**Interfaces:**
- Consumes: `hashSeed` from `./factory.js`
- Produces: `normalizeElement()`, `normalize()`, `buildAppState()`

- [ ] **Step 1: Create the file**

Copy from `src/normalize.ts` lines 96-181 (buildAppState, normalizeElement, normalize):

```ts
/**
 * Style normalizer — applies theme config to elements.
 */

import type { ExcalidrawElement, ExcalidrawDocument, ThemeConfig } from "../types.js";
import { hashSeed } from "./factory.js";

/** Build the appState section of an .excalidraw document. */
export function buildAppState(theme: ThemeConfig): ExcalidrawDocument["appState"] {
  return {
    gridSize: null,
    viewBackgroundColor: theme.background,
    currentItemFontFamily: theme.fontFamily,
    currentItemFontSize: theme.fontSize,
    theme: theme.name === "dark" ? "dark" : "light",
  };
}

/**
 * Apply a theme to a single element. Returns a new element.
 */
export function normalizeElement(
  el: ExcalidrawElement,
  theme: ThemeConfig,
  colorIndex: number
): ExcalidrawElement {
  const [stroke, bg] = theme.shapes[colorIndex % theme.shapes.length];

  const base = {
    ...el,
    strokeColor: theme.arrow,
    backgroundColor: "transparent",
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    strokeStyle: theme.strokeStyle,
    roughness: theme.roughness,
    opacity: 100,
    strokeSharpness: "round" as const,
    seed: hashSeed(el.id),
  };

  switch (el.type) {
    case "rectangle":
    case "ellipse":
    case "diamond":
      return { ...base, strokeColor: stroke, backgroundColor: bg, roundness: theme.roundness };

    case "arrow":
    case "line":
      return { ...base, strokeColor: theme.arrow, backgroundColor: "transparent", roundness: null };

    case "text":
      return {
        ...base,
        strokeColor: theme.text,
        backgroundColor: "transparent",
        roundness: null,
        strokeWidth: 1,
        ...("fontFamily" in el ? { fontFamily: theme.fontFamily } : {}),
        ...("fontSize" in el ? { fontSize: theme.fontSize } : {}),
      };

    case "frame":
      return {
        ...base,
        strokeColor: theme.accent,
        backgroundColor: "transparent",
        strokeStyle: "dashed",
        roundness: null,
      };

    default:
      return base;
  }
}

/**
 * Apply a theme to all elements. Color-cycles shapes.
 */
export function normalize(
  elements: ExcalidrawElement[],
  theme: ThemeConfig
): ExcalidrawElement[] {
  let colorIndex = 0;
  return elements.map((el) => {
    const isShape = ["rectangle", "ellipse", "diamond"].includes(el.type);
    const normalized = normalizeElement(el, theme, isShape ? colorIndex : 0);
    if (isShape) colorIndex++;
    return normalized;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/normalize.ts
git commit -m "feat(renderer): add style normalizer (extracted from normalize.ts)"
```

---

### Task 7: Create `src/renderer/shapes.ts`

**Files:**
- Create: `src/renderer/shapes.ts`

**Interfaces:**
- Consumes: `createElement`, `createTextElement`, `textWidth` from `./factory.js`; `getTheme` from `../themes.js`; `SequenceLayout` from `../layout/sequence.js`
- Produces: `buildShape()`, `buildArrow()`, `renderLifelines()`, `renderSequenceMessages()`, `renderEntityFields()`, `renderClassMembers()`, `applyViewportMargin()`

- [ ] **Step 1: Create the file**

Extract `buildShape` and `buildArrow` from `mermaid.ts` lines 260-330, plus lifeline/field/method rendering and margin logic from `mermaidToExcalidraw()`. Functions take plain inputs (no parser types).

```ts
/**
 * Shape renderer — constructs themed Excalidraw elements from positions.
 * Pure: input = positions + theme, output = elements.
 */

import type { ExcalidrawElement, ShapeType } from "../types.js";
import type { ThemeConfig } from "../themes.js";
import type { SequenceLayout } from "../layout/sequence.js";
import { getTheme } from "../themes.js";
import { createElement, createTextElement, textWidth } from "./factory.js";

// ── Core Shapes ────────────────────────────────────────────────

/**
 * Build a shape element with bound text label.
 */
export function buildShape(
  label: string,
  shapeType: ShapeType,
  pos: { x: number; y: number; width: number; height: number },
  stroke: string,
  bg: string,
  theme: ThemeConfig
): ExcalidrawElement[] {
  const el = createElement(shapeType, {
    x: pos.x, y: pos.y, width: pos.width, height: pos.height,
    strokeColor: stroke,
    backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: shapeType === "rectangle" ? theme.roundness : (shapeType === "ellipse" ? null : theme.roundness),
  });

  const lbl = createTextElement(
    label,
    pos.x + pos.width / 2 - textWidth(label, theme.fontSize) / 2,
    pos.y + pos.height / 2 - theme.fontSize * 0.6,
    theme.fontSize,
    theme.fontFamily,
    el.id
  );
  lbl.strokeColor = theme.text;

  el.boundElements = [{ id: lbl.id, type: "text" }];
  return [el, lbl];
}

/**
 * Build an arrow between two positions with optional label.
 */
export function buildArrow(
  fromPos: { x: number; y: number; width: number; height: number },
  toPos: { x: number; y: number; width: number; height: number },
  direction: string,
  label: string | null,
  theme: ThemeConfig
): ExcalidrawElement[] {
  const { fx, fy, tx, ty } = _routeArrow(fromPos, toPos, direction);
  const dx = tx - fx, dy = ty - fy;

  const arrowEl = createElement("arrow", {
    x: fx, y: fy, width: dx, height: dy,
    strokeColor: theme.arrow,
    roundness: null,
  }) as any;
  arrowEl.points = [{ x: 0, y: 0 }, { x: dx, y: dy }];
  arrowEl.startArrowhead = null;
  arrowEl.endArrowhead = "arrow";
  arrowEl.startBinding = null;
  arrowEl.endBinding = null;

  const result: ExcalidrawElement[] = [arrowEl];

  if (label) {
    const lbl = createTextElement(
      label,
      fx + dx / 2 - textWidth(label, 14) / 2,
      fy + dy / 2 - 20,
      14, theme.fontFamily, arrowEl.id
    );
    lbl.strokeColor = theme.text;
    arrowEl.boundElements = [{ id: lbl.id, type: "text" }];
    result.push(lbl);
  }

  return result;
}

/** Internal: copied from layout/dagre.ts to avoid circular dep in shapes.ts */
function _routeArrow(
  fromPos: { x: number; y: number; width: number; height: number },
  toPos: { x: number; y: number; width: number; height: number },
  direction: string
): { fx: number; fy: number; tx: number; ty: number } {
  if (direction === "TB") {
    return { fx: fromPos.x + fromPos.width / 2, fy: fromPos.y + fromPos.height, tx: toPos.x + toPos.width / 2, ty: toPos.y };
  }
  if (direction === "BT") {
    return { fx: fromPos.x + fromPos.width / 2, fy: fromPos.y, tx: toPos.x + toPos.width / 2, ty: toPos.y + toPos.height };
  }
  if (direction === "RL") {
    return { fx: fromPos.x, fy: fromPos.y + fromPos.height / 2, tx: toPos.x + toPos.width, ty: toPos.y + toPos.height / 2 };
  }
  return { fx: fromPos.x + fromPos.width, fy: fromPos.y + fromPos.height / 2, tx: toPos.x, ty: toPos.y + toPos.height / 2 };
}

// ── Sequence Diagram ───────────────────────────────────────────

/** Render lifeline dashed lines for sequence diagrams. */
export function renderLifelines(
  nodes: Array<{ id: string }>,
  positions: Map<string, { x: number; y: number; width: number; height: number }>,
  layout: SequenceLayout,
  theme: ThemeConfig
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const cx = pos.x + pos.width / 2;
    const l = createElement("line", {
      x: cx, y: layout.lifelineTop, width: 0, height: layout.lifelineBottom - layout.lifelineTop,
      strokeColor: theme.arrow, strokeWidth: 1, roundness: null, strokeStyle: "dashed",
    });
    elements.push(l);
  }
  return elements;
}

/** Render message arrows for sequence diagrams. */
export function renderSequenceMessages(
  layout: SequenceLayout,
  theme: ThemeConfig
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  for (const slot of layout.messageSlots) {
    const dx = slot.toX - slot.fromX;

    const arr = createElement("arrow", {
      x: slot.fromX, y: slot.y, width: dx, height: 0,
      strokeColor: theme.arrow, roundness: null,
    }) as any;
    arr.points = [{ x: 0, y: 0 }, { x: dx, y: 0 }];
    arr.startArrowhead = null;
    arr.endArrowhead = "arrow";

    if (slot.text) {
      const lbl = createTextElement(
        slot.text,
        slot.fromX + dx / 2 - textWidth(slot.text, 12) / 2,
        slot.y - 18,
        12, theme.fontFamily, arr.id
      ) as any;
      lbl.strokeColor = theme.text;
      arr.boundElements = [{ id: lbl.id, type: "text" }];
      elements.push(lbl);
    }

    elements.push(arr);
  }
  return elements;
}

// ── Entity / Class Renderers ───────────────────────────────────

/** Render ER entity fields below a node shape. */
export function renderEntityFields(
  pos: { x: number; y: number; width: number; height: number },
  fields: string[],
  theme: ThemeConfig
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  let fy = pos.y + pos.height + 5;
  for (const f of fields) {
    const t = createTextElement(f, pos.x + 8, fy, 12, theme.fontFamily) as any;
    t.strokeColor = theme.text;
    t.textAlign = "left";
    elements.push(t);
    fy += 16;
  }
  return elements;
}

/** Render class attributes + separator + methods below a node shape. */
export function renderClassMembers(
  pos: { x: number; y: number; width: number; height: number },
  attributes: string[],
  methods: string[],
  theme: ThemeConfig
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  let fy = pos.y + pos.height + 5;

  // Attributes
  for (const attr of attributes) {
    const t = createTextElement(attr, pos.x + 8, fy, 12, theme.fontFamily) as any;
    t.strokeColor = theme.text;
    t.textAlign = "left";
    elements.push(t);
    fy += 16;
  }

  // Separator before methods
  if (methods.length > 0) {
    const sep = createElement("line", {
      x: pos.x + 4, y: fy, width: pos.width - 8, height: 0,
      strokeColor: theme.arrow, strokeWidth: 1, roundness: null,
    });
    elements.push(sep);
    fy += 10;
  }

  // Methods
  for (const m of methods) {
    const t = createTextElement(m, pos.x + 8, fy, 12, theme.fontFamily) as any;
    t.strokeColor = theme.text;
    t.textAlign = "left";
    elements.push(t);
    fy += 16;
  }

  return elements;
}

// ── Viewport ───────────────────────────────────────────────────

/**
 * Shift all elements so minimum x/y is at the given margin.
 * Returns elements in-place (mutated) for convenience.
 */
export function applyViewportMargin(
  elements: ExcalidrawElement[],
  margin: number
): ExcalidrawElement[] {
  if (elements.length === 0) return elements;
  let minX = Infinity, minY = Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
  }
  const dx = margin - minX;
  const dy = margin - minY;
  if (dx > 0 || dy > 0) {
    for (const el of elements) {
      if (dx > 0) el.x += dx;
      if (dy > 0) el.y += dy;
    }
  }
  return elements;
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean compile (dagre.ts dependency on renderer/factory.js now satisfied)

- [ ] **Step 3: Commit**

```bash
git add src/renderer/shapes.ts
git commit -m "feat(renderer): add shape renderers (extracted from mermaid.ts)"
```

---

### Task 8: Update `diagram.ts` to use layout/ and renderer/

**Files:**
- Modify: `src/diagram.ts`

**Interfaces:**
- Consumes: `gridPosition` from `layout/grid.js`; `createElement`, `createTextElement` from `renderer/factory.js`; `normalizeElement`, `buildAppState` from `renderer/normalize.js`

- [ ] **Step 1: Update imports**

Replace lines 10-15 in `diagram.ts`:

```ts
import { writeFileSync } from "fs";
import { resolve } from "path";
import type { ExcalidrawElement, ExcalidrawDocument, ShapeType } from "./types.js";
import { getTheme, type ThemeConfig } from "./themes.js";
import { createElement, createTextElement } from "./renderer/factory.js";
import { normalizeElement, buildAppState } from "./renderer/normalize.js";
import { gridPosition } from "./layout/grid.js";
import { ICONS, loadLibraryIcon } from "./library.js";
```

- [ ] **Step 2: Replace `_gridPos` with `gridPosition`**

Replace the `_gridPos` method (lines 58-65):

```ts
  private _gridPos(index: number): { x: number; y: number } {
    return gridPosition(index, this._cols, this._cellW, this._cellH, this._gapX, this._gapY);
  }
```

- [ ] **Step 3: Remove `textWidth` from local imports**

`textWidth` was imported via `normalize.ts`. Since we removed that import, the `addBox` method (line 110) calls `textWidth(name, this.theme.fontSize)`. Need to add `textWidth` to the import from `renderer/factory.js`:

```ts
import { createElement, createTextElement, textWidth } from "./renderer/factory.js";
```

And verify `addBox` still compiles — it uses `textWidth` at line 110 and `addArrow` uses it at line 163.

- [ ] **Step 4: Build and test**

```bash
npm run build
```

Expected: clean compile

- [ ] **Step 5: Commit**

```bash
git add src/diagram.ts
git commit -m "refactor(diagram): use layout/grid and renderer/ modules"
```

---

### Task 9: Slim down `mermaid.ts` to parser + orchestrator

**Files:**
- Modify: `src/mermaid.ts`

**Interfaces:**
- Consumes: `runDagreLayout`, `routeArrow` from `layout/dagre.js`; `calculateSequenceLayout` from `layout/sequence.js`; `buildShape`, `buildArrow`, `renderLifelines`, `renderSequenceMessages`, `renderEntityFields`, `renderClassMembers`, `applyViewportMargin` from `renderer/shapes.js`
- Produces: `mermaidToExcalidraw()` (unchanged signature)

- [ ] **Step 1: Update imports**

Replace the import block (lines 10-21):

```ts
import type { ExcalidrawElement, ExcalidrawDocument, Direction } from "./types.js";
import { getTheme } from "./themes.js";
import { runDagreLayout } from "./layout/dagre.js";
import { calculateSequenceLayout, type SequenceLayout } from "./layout/sequence.js";
import {
  buildShape,
  buildArrow,
  renderLifelines,
  renderSequenceMessages,
  renderEntityFields,
  renderClassMembers,
  applyViewportMargin,
} from "./renderer/shapes.js";
import { resolveIcon, resolveIconName } from "./icon_resolver.js";
import { ICONS } from "./library.js";
import { getSpacing } from "./token_compiler.js";
```

Remove the `dagre` import (moved to `layout/dagre.ts`).

- [ ] **Step 2: Remove layout functions**

Delete:
- `function runDagreLayout(...)` (lines 207-239)
- `function routeArrow(...)` (lines 243-271)

These are now in `layout/dagre.ts`.

- [ ] **Step 3: Remove renderer functions**

Delete:
- `function buildShape(...)` (lines 275-292)
- `function buildArrow(...)` (lines 309-330)

These are now in `renderer/shapes.ts`.

- [ ] **Step 4: Rewrite `mermaidToExcalidraw()` as orchestrator**

Replace the function body (lines 355-549). The parser types and flow remain identical — only the inline rendering is replaced with imported functions:

```ts
export function mermaidToExcalidraw(
  mermaidText: string,
  themeName: string = "sketchy"
): ExcalidrawDocument {
  const theme = getTheme(themeName);
  const parsed = parseMermaid(mermaidText.trim());

  if (parsed.nodes.length === 0) {
    throw new Error("No nodes found in Mermaid text. Check your syntax.");
  }

  const direction = parsed.direction ?? "TB";
  const positions = runDagreLayout(parsed.nodes, parsed.edges, direction, theme.fontSize);

  const elements: ExcalidrawElement[] = [];
  let colorIdx = 0;

  // Build shapes
  for (const node of parsed.nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
    colorIdx++;

    const shapeType = (node.shape === "roundrect" ? "rectangle" : node.shape) as "rectangle" | "diamond" | "ellipse";
    elements.push(...buildShape(node.label, shapeType, pos, stroke, bg, theme));

    // ER: render entity fields below the shape
    if (parsed.entities?.[node.id]) {
      elements.push(...renderEntityFields(pos, parsed.entities[node.id].fields, theme));
    }

    // Class: render attributes and methods below the shape
    if (parsed.classes?.[node.id]) {
      const info = parsed.classes[node.id];
      elements.push(...renderClassMembers(pos, info.attributes, info.methods, theme));
    }
  }

  // Sequence state (used by lifelines + message arrows)
  let seqLayout: SequenceLayout | null = null;
  if (parsed.type === "sequence") {
    seqLayout = calculateSequenceLayout(parsed.nodes, positions, parsed.messages);
    elements.push(...renderLifelines(parsed.nodes, positions, seqLayout, theme));
  }

  // Build arrows
  if (parsed.type === "sequence" && seqLayout) {
    elements.push(...renderSequenceMessages(seqLayout, theme));
  } else {
    for (const edge of parsed.edges) {
      const fp = positions.get(edge.from);
      const tp = positions.get(edge.to);
      if (!fp || !tp) continue;
      elements.push(...buildArrow(fp, tp, direction, edge.label, theme));
    }
  }

  // Icon resolution — replace shapes whose label matches an icon
  for (const node of parsed.nodes) {
    const iconName = resolveIconName(node.label);
    if (!iconName || !ICONS[iconName]) continue;

    const shapeIdx = elements.findIndex(
      e => ["rectangle","ellipse","diamond"].includes(e.type) &&
           e.boundElements?.some(b => {
             const t = elements.find(x => x.id === b.id) as any;
             return t?.text === node.label;
           })
    );
    if (shapeIdx === -1) continue;

    const shapeEl = elements[shapeIdx];
    const pos = positions.get(node.id);
    if (!pos) continue;

    const boundIds = new Set((shapeEl.boundElements || []).map((b: any) => b.id));
    elements.splice(shapeIdx, 1);
    for (let i = elements.length - 1; i >= 0; i--) {
      if (boundIds.has(elements[i].id)) elements.splice(i, 1);
    }

    const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
    colorIdx++;
    const iconEls = resolveIcon(iconName, pos.x, pos.y, themeName, colorIdx);
    if (iconEls) elements.push(...iconEls);
  }

  // Ensure minimum viewport margins
  applyViewportMargin(elements, getSpacing().margin);

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: theme.background,
      currentItemFontFamily: theme.fontFamily,
      currentItemFontSize: theme.fontSize,
      theme: theme.name === "dark" ? "dark" : "light",
    },
    files: {},
  };
}
```

- [ ] **Step 5: Remove local `Direction` type alias (now in types.ts)**

`Direction` is added to `types.ts` in Task 1. Remove the local `type Direction = "TB" | ...` from mermaid.ts and import it:

```ts
import type { ExcalidrawElement, ExcalidrawDocument, Direction } from "./types.js";
```

Keep `type Shape` (line 25) — it's a parser-internal type not in `types.ts`.

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: clean compile

- [ ] **Step 7: Commit**

```bash
git add src/mermaid.ts
git commit -m "refactor(mermaid): slim to parser + orchestrator, delegate to layout/ and renderer/"
```

---

### Task 10: Update `index.ts` re-exports

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update re-export paths**

Change the `normalize, normalizeElement, makeId` export line:

```ts
export { mermaidToExcalidraw } from "./mermaid.js";
export { Diagram } from "./diagram.js";
export { getTheme, listThemes, THEMES } from "./themes.js";
export { normalize, normalizeElement } from "./renderer/normalize.js";
export { makeId } from "./renderer/factory.js";
export { ICONS, listIcons, loadLibraryIcon, listLibrary, listLibraries } from "./library.js";
export type { IconDef } from "./library.js";
export { resolveIcon, resolveIconName } from "./icon_resolver.js";
export { loadThemesFromTokens, getSpacing, getShadowTokens } from "./token_compiler.js";
export type {
  ExcalidrawElement,
  ExcalidrawDocument,
  ThemeConfig,
  TextElement,
  ArrowElement,
  FrameElement,
  Point,
} from "./types.js";
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean compile

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor(index): update re-export paths to layout/renderer"
```

---

### Task 11: Delete `src/normalize.ts` and verify

**Files:**
- Delete: `src/normalize.ts`

- [ ] **Step 1: Delete the file**

```bash
git rm src/normalize.ts
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean compile — nothing imports `./normalize.js` anymore

- [ ] **Step 3: Run golden tests**

```bash
bash tests/run_golden.sh
```

Expected: 5 passed, 0 failed

- [ ] **Step 4: Quick end-to-end smoke test**

```bash
node --input-type=module -e "
import { mermaidToExcalidraw, Diagram, listThemes, listIcons, makeId } from './dist/index.js';
const doc = mermaidToExcalidraw('flowchart TD\n    A[Start] --> B{Ok?}\n    B -->|Yes| C[Done]', 'sketchy');
console.log('mermaidToExcalidraw: ' + doc.elements.length + ' elements, bg: ' + doc.appState.viewBackgroundColor);
const d = new Diagram('professional');
d.addBox('Test');
console.log('Diagram: ' + d.elements.length + ' elements');
console.log('Themes: ' + listThemes().join(', '));
console.log('Icons: ' + listIcons().length);
console.log('makeId: ' + makeId().length);
"
```

Expected output:
```
mermaidToExcalidraw: 7 elements, bg: #F8F5F0
Diagram: 2 elements
Themes: professional, sketchy, dark, colorful
Icons: 17
makeId: 36
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: delete normalize.ts — fully absorbed into renderer/"
```

---

### Task 12: Final verification and summary

- [ ] **Step 1: Run full golden test suite**

```bash
bash tests/run_golden.sh
```

Expected: `5 passed, 0 failed`

- [ ] **Step 2: Verify file count**

```bash
echo "=== src/ ===" && ls src/*.ts && echo "" && echo "=== src/layout/ ===" && ls src/layout/ && echo "" && echo "=== src/renderer/ ===" && ls src/renderer/
```

Expected:
```
src/: cli.ts  diagram.ts  icon_resolver.ts  index.ts  library.ts  mermaid.ts  themes.ts  token_compiler.ts  types.ts
src/layout/: dagre.ts  grid.ts  sequence.ts
src/renderer/: factory.ts  normalize.ts  shapes.ts
```

No `normalize.ts` in `src/`.

- [ ] **Step 3: Verify mermaid.ts line count dropped**

```bash
wc -l src/mermaid.ts
```

Expected: ~200-250 lines (down from 486)

- [ ] **Step 4: Final commit if any remaining changes**

```bash
git status
```
