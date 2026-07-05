# Auto-Size Bounding Boxes & Multi-Line Text Measurement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bounding boxes size to fit text content, and correctly measure/position multi-line text labels.

**Architecture:** Add a `measureText()` utility that splits on `\n` and returns per-line metrics. Thread it through layout engines (for node sizing) and renderers (for text centering). Normalize `string | string[]` labels to `\n`-joined strings at API boundaries.

**Tech Stack:** TypeScript, Node.js, dagre (graph layout)

## Global Constraints

- Backward compatible: explicit `width`/`height`/`cellW`/`stageW` opts override auto-sizing
- `textWidth(content, fontSize)` signature unchanged; delegates to `measureText` internally
- Multi-line labels supported via `\n` in strings or `string[]` arrays
- Padding: 32px horizontal, 24px vertical; min sizes: 120×50 (rect), 100×80 (diamond)
- Empty labels: `measureText("")` returns `width: fontSize`, `height: lineHeight` for one line

---

### Task 1: Core Text Utilities (`normalize.ts`)

**Files:**
- Modify: `src/normalize.ts`

**Interfaces:**
- Produces: `TextMetrics` interface, `measureText()`, `normalizeLabel()` — consumed by Tasks 3-7
- Produces: updated `textWidth()`, `createTextElement()` — backward compatible

- [ ] **Step 1: Add `TextMetrics` interface**

Add after the `hashSeed` function (line 29) and before `textWidth` (line 31):

```typescript
/** Multi-line text measurement result. */
export interface TextMetrics {
  width: number;       // max line width
  height: number;      // total text block height (lineCount × lineHeight)
  lines: string[];     // individual lines after split
  lineCount: number;   // number of lines
  lineHeight: number;  // fontSize × 1.25
}
```

- [ ] **Step 2: Add `measureText()` function**

Add after the new `TextMetrics` interface, before `textWidth`:

```typescript
/** Measure text dimensions, accounting for multi-line content. */
export function measureText(content: string, fontSize: number): TextMetrics {
  const lines = content.split("\n");
  const lineHeight = fontSize * 1.25;
  let maxWidth = 0;
  for (const line of lines) {
    let w = 0;
    for (const ch of line) {
      if (/[一-鿿　-〿＀-￯\u{1f300}-\u{1f9ff}]/u.test(ch)) {
        w += fontSize;
      } else {
        w += fontSize * 0.6;
      }
    }
    if (w > maxWidth) maxWidth = w;
  }
  return {
    width: maxWidth || fontSize,
    height: lines.length * lineHeight,
    lines,
    lineCount: lines.length,
    lineHeight,
  };
}
```

- [ ] **Step 3: Add `normalizeLabel()` function**

Add after `measureText`:

```typescript
/** Normalize label input — accepts string or string[], returns \n-joined string. */
export function normalizeLabel(label: string | string[]): string {
  return Array.isArray(label) ? label.join("\n") : label;
}
```

- [ ] **Step 4: Update `textWidth()` to delegate to `measureText`**

Replace the body of `textWidth` (lines 32-42):

```typescript
/** Estimate text display width. Delegates to measureText for max line width. */
export function textWidth(content: string, fontSize: number): number {
  return measureText(content, fontSize).width;
}
```

- [ ] **Step 5: Update `createTextElement()` to accept optional metrics and use multi-line height**

Replace the function signature and body (lines 83-110):

```typescript
/** Create a text element with text-specific defaults. */
export function createTextElement(
  content: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: number,
  containerId: string | null = null,
  metrics?: TextMetrics
): ExcalidrawElement {
  const m = metrics ?? measureText(content, fontSize);
  return createElement("text", {
    x, y,
    width: m.width,
    height: m.height,
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
    boundElements: [],
    roundness: { type: 2 },
  });
}
```

- [ ] **Step 6: Build and verify compilation**

```bash
cd /Users/lingjiefan/underway/ce-draw/.claude/worktrees/auto-size-multiline-text
npm run build
```
Expected: builds without errors.

- [ ] **Step 7: Commit**

```bash
git add src/normalize.ts
git commit -m "feat: add measureText, normalizeLabel, multi-line-aware createTextElement"
```

---

### Task 2: Update Exports (`index.ts`)

**Files:**
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `measureText`, `normalizeLabel`, `TextMetrics` from Task 1
- Produces: public exports for consumers

- [ ] **Step 1: Add new exports to `index.ts`**

Add to the normalize exports line (line 30):

```typescript
export { normalize, normalizeElement, makeId, measureText, normalizeLabel, textWidth } from "./normalize.js";
export type { TextMetrics } from "./normalize.js";
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: export measureText, normalizeLabel, TextMetrics from index"
```

---

### Task 3: Dagre Layout Auto-Sizing (`layout/dagre.ts`)

**Files:**
- Modify: `src/layout/dagre.ts`

**Interfaces:**
- Consumes: `measureText` from Task 1
- Produces: text-driven node dimensions in dagre layout — consumed by `renderDiagram` (already wired)

- [ ] **Step 1: Import `measureText`**

Add to the import block (after line 8):

```typescript
import { measureText } from "../normalize.js";
```

- [ ] **Step 2: Replace hardcoded node dimensions with text-driven ones**

Replace lines 28-31 (the `for (const n of nodes)` loop body):

```typescript
  for (const n of nodes) {
    const fontSize = opts.fontSize ?? 16;
    const m = measureText(n.label, fontSize);
    const padX = 32, padY = 24;
    const isDiamond = n.shape === "diamond";
    const minW = isDiamond ? 100 : 120;
    const minH = isDiamond ? 80 : 50;
    const w = Math.max(minW, m.width + padX);
    const h = Math.max(minH, m.height + padY);
    g.setNode(n.id, { label: n.label, width: w, height: h });
  }
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/layout/dagre.ts
git commit -m "feat: dagre layout auto-sizes nodes based on text content"
```

---

### Task 4: Grid Layout Auto-Sizing (`layout/grid.ts`)

**Files:**
- Modify: `src/layout/grid.ts`

**Interfaces:**
- Consumes: `measureText` from Task 1
- Produces: text-driven cell dimensions in grid layout (when opts not provided)

- [ ] **Step 1: Import `measureText`**

Add to the import block (after line 7):

```typescript
import { measureText } from "../normalize.js";
```

- [ ] **Step 2: Auto-size cells when `cellW`/`cellH` not provided**

Replace lines 14-18 (the defaults extraction):

```typescript
  const fontSize = opts.fontSize ?? 16;
  const cols = opts.cols ?? 3;
  const gapX = opts.gapX ?? 40;
  const gapY = opts.gapY ?? 50;

  // Auto-size from max label when dimensions not explicitly provided
  const padX = 32, padY = 24;
  let computedW = 120, computedH = 50;
  if (nodes.length > 0) {
    let maxW = 0, maxH = 0;
    for (const n of nodes) {
      const m = measureText(n.label, fontSize);
      if (m.width > maxW) maxW = m.width;
      if (m.height > maxH) maxH = m.height;
    }
    computedW = Math.max(120, maxW + padX);
    computedH = Math.max(50, maxH + padY);
  }
  const cellW = opts.cellW ?? computedW;
  const cellH = opts.cellH ?? computedH;
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/layout/grid.ts
git commit -m "feat: grid layout auto-sizes cells based on max label text"
```

---

### Task 5: Pipeline Layout Auto-Sizing (`layout/pipeline.ts`)

**Files:**
- Modify: `src/layout/pipeline.ts`

**Interfaces:**
- Consumes: `measureText` from Task 1
- Produces: text-driven stage dimensions in pipeline layout (when opts not provided)

- [ ] **Step 1: Import `measureText`**

Add to the import block (after line 7):

```typescript
import { measureText } from "../normalize.js";
```

- [ ] **Step 2: Auto-size stages when `stageW`/`stageH` not provided**

Replace lines 14-17 (the defaults extraction):

```typescript
  const fontSize = opts.fontSize ?? 16;
  const direction = opts.direction ?? "LR";
  const stageGap = opts.stageGap ?? 60;

  // Auto-size from max label when dimensions not explicitly provided
  const padX = 32, padY = 24;
  let computedW = 120, computedH = 50;
  if (nodes.length > 0) {
    let maxW = 0, maxH = 0;
    for (const n of nodes) {
      const m = measureText(n.label, fontSize);
      if (m.width > maxW) maxW = m.width;
      if (m.height > maxH) maxH = m.height;
    }
    computedW = Math.max(120, maxW + padX);
    computedH = Math.max(50, maxH + padY);
  }
  const stageW = opts.stageW ?? computedW;
  const stageH = opts.stageH ?? computedH;
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/layout/pipeline.ts
git commit -m "feat: pipeline layout auto-sizes stages based on max label text"
```

---

### Task 6: Render Multi-Line + Label Normalization (`render.ts`)

**Files:**
- Modify: `src/render.ts`

**Interfaces:**
- Consumes: `measureText`, `normalizeLabel` from Task 1
- Produces: correct multi-line text centering in all shapes/arrows/sequences; normalized labels at API boundary

- [ ] **Step 1: Update imports**

Replace the import from normalize (lines 11-16):

```typescript
import {
  createElement,
  createTextElement,
  buildAppState,
  measureText,
  normalizeLabel,
} from "./normalize.js";
```

- [ ] **Step 2: Widen `JSONNode.label` type**

Replace line 25:

```typescript
  label: string | string[];
```

- [ ] **Step 3: Widen `JSONEdge.label` type**

Replace line 32:

```typescript
  label?: string | string[];
```

- [ ] **Step 4: Update `buildShape()` for multi-line text centering**

Replace lines 64-72 (the label creation in `buildShape`):

```typescript
  const m = measureText(node.label, theme.fontSize);
  const label = createTextElement(
    node.label,
    pos.x + pos.width / 2 - m.width / 2,
    pos.y + pos.height / 2 - m.height / 2,
    theme.fontSize,
    theme.fontFamily,
    el.id,
    m
  );
  label.strokeColor = theme.text;
```

- [ ] **Step 5: Update `buildArrow()` for multi-line edge labels**

Replace lines 101-111 (the edge label creation in `buildArrow`):

```typescript
  if (edge.label) {
    const m = measureText(edge.label, 14);
    const lbl = createTextElement(
      edge.label,
      fx + dx / 2 - m.width / 2,
      fy + dy / 2 - m.height / 2,
      14, theme.fontFamily, arrowEl.id, m
    );
    lbl.strokeColor = theme.text;
    arrowEl.boundElements = [{ id: lbl.id, type: "text" }];
    result.push(lbl);
  }
```

- [ ] **Step 6: Update `buildSequence()` message labels for multi-line**

Replace lines 171-179 (the message label creation in `buildSequence`):

```typescript
    if (edge.label) {
      const m = measureText(edge.label, 12);
      const lbl = createTextElement(
        edge.label,
        fcx + dx / 2 - m.width / 2,
        msgY - 12 - m.height / 2,
        12, theme.fontFamily, arr.id, m
      ) as any;
      lbl.strokeColor = theme.text;
      arr.boundElements = [{ id: lbl.id, type: "text" }];
      elements.push(lbl);
    }
```

- [ ] **Step 7: Normalize labels at `renderDiagram()` entry point**

Add after the empty-nodes check (line 203) and before `routeLayout` (line 206):

```typescript
  // Normalize labels (string | string[] → string with \n)
  const nodes = diagram.nodes.map(n => ({ ...n, label: normalizeLabel(n.label) }));
  const edges = diagram.edges.map(e => ({ ...e, label: e.label ? normalizeLabel(e.label) : undefined }));

  const layout = routeLayout(diagram.type, nodes, edges, { direction });
```

And update the subsequent references to use `nodes` and `edges` instead of `diagram.nodes` and `diagram.edges`:

Replace line 213:
```typescript
    elements.push(...buildSequence(nodes, edges, positions, theme));
```

Replace line 216:
```typescript
    for (const node of nodes) {
```

Replace line 225:
```typescript
    for (const edge of edges) {
```

- [ ] **Step 8: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 9: Commit**

```bash
git add src/render.ts
git commit -m "feat: multi-line text centering in render, normalize labels at API boundary"
```

---

### Task 7: Diagram API Auto-Sizing (`diagram.ts`)

**Files:**
- Modify: `src/diagram.ts`

**Interfaces:**
- Consumes: `measureText` from Task 1
- Produces: auto-sized boxes and multi-line-aware text in `addBox`, `addArrow`

- [ ] **Step 1: Update imports**

Replace the normalize import (line 15):

```typescript
import { normalizeElement, createElement, createTextElement, buildAppState, measureText } from "./normalize.js";
```

- [ ] **Step 2: Update `addBox()` — auto-size when no explicit width/height, multi-line text centering**

Replace lines 76-79 (width/height computation) and lines 104-109 (label creation):

```typescript
    const { x, y } = this._gridPos(idx);
    const m = measureText(name, this.theme.fontSize);
    const padX = 32, padY = 24;
    const isDiamond = shape === "diamond";
    const minW = isDiamond ? 100 : 120;
    const minH = isDiamond ? 80 : 50;
    const span = opts.span ?? 1;
    const baseW = opts.width ?? Math.max(minW, m.width + padX);
    const baseH = opts.height ?? Math.max(minH, m.height + padY);
    const w = opts.width ? baseW : (baseW + (span - 1) * (baseW + this._gapX));
    const h = baseH;
```

Then replace the label creation (lines 104-109):

```typescript
    // Bound text label
    if (name) {
      const textEl = normalizeElement(
        createTextElement(
          name,
          x + w / 2 - m.width / 2,
          y + h / 2 - m.height / 2,
          this.theme.fontSize,
          this.theme.fontFamily,
          el.id,
          m
        ),
        this.theme,
        0
      ) as any;
      textEl.strokeColor = this.theme.text;
      textEl.containerId = el.id;
      textEl.originalText = name;
```

- [ ] **Step 3: Update `addArrow()` — multi-line edge label centering**

Replace lines 161-168 (edge label in `addArrow`):

```typescript
    if (opts.label) {
      const m = measureText(opts.label, 14);
      const textEl = normalizeElement(
        createTextElement(
          opts.label,
          fx + dx / 2 - m.width / 2,
          fy + dy / 2 - m.height / 2,
          14,
          this.theme.fontFamily,
          el.id,
          m
        ),
        this.theme,
        0
      ) as any;
      textEl.strokeColor = this.theme.text;
      textEl.containerId = el.id;
      textEl.originalText = opts.label;
```

- [ ] **Step 4: Update `addActor()` — `textWidth` import removal not needed (still used)**

The `addActor` method still uses `textWidth` for the actor name. Keep the import. Since `textWidth` is still exported from `normalize.ts` (it delegates to `measureText` internally now), this works fine. But we removed `textWidth` from the import in Step 1. Let's add it back:

Replace the import line:

```typescript
import { normalizeElement, createElement, createTextElement, buildAppState, measureText, textWidth } from "./normalize.js";
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```
Expected: builds without errors.

- [ ] **Step 6: Commit**

```bash
git add src/diagram.ts
git commit -m "feat: Diagram API auto-sizes boxes and uses multi-line text centering"
```

---

### Task 8: Golden Tests — Regenerate + Add Multi-Line Case

**Files:**
- Create: `tests/input/multiline.js`
- Modify: `tests/expected/flowchart.excalidraw` (regenerated)
- Modify: `tests/expected/flowchart_json.excalidraw` (regenerated)
- Modify: `tests/expected/architecture.excalidraw` (regenerated)

**Interfaces:**
- Consumes: all changes from Tasks 1-7
- Produces: updated golden test expected outputs

- [ ] **Step 1: Create a multi-line test input**

Create `tests/input/multiline.js`:

```javascript
/**
 * Multi-line text golden test — verifies auto-sizing and multi-line measurement.
 */
import { Diagram } from "../../dist/index.js";

const d = new Diagram("sketchy", { cols: 2, cellW: 160, cellH: 80, gapX: 60, gapY: 80 });

// Single-line (short)
d.addBox("Hi", { row: 0, col: 0 });
// Multi-line via \n
d.addBox("Line 1\nLine 2\nLine 3", { row: 0, col: 1 });
// Single-line (long)
d.addBox("Authentication Service", { row: 1, col: 0 });
// Diamond with \n
d.addBox("Is\nValid?", { row: 1, col: 1, shape: "diamond" });

d.addArrow("Hi", "Line 1\nLine 2\nLine 3", { label: "go" });
d.addArrow("Line 1\nLine 2\nLine 3", "Authentication Service");
d.addArrow("Authentication Service", "Is\nValid?", { label: "check" });

export default d;
```

- [ ] **Step 2: Create a multi-line JSON test input**

Create `tests/input/multiline_json.json`:

```json
{
  "type": "flowchart",
  "direction": "TB",
  "theme": "sketchy",
  "nodes": [
    { "id": "A", "label": "Short" },
    { "id": "B", "label": ["Line 1", "Line 2", "Line 3"] },
    { "id": "C", "label": "Authentication Service Provider" }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "next" },
    { "from": "B", "to": "C", "label": ["go to", "next step"] }
  ]
}
```

- [ ] **Step 3: Build and regenerate golden tests**

```bash
npm run build
bash tests/run_golden.sh
```

Expected: all tests pass. The first run may auto-generate expected files for the new `multiline`/`multiline_json` tests. The existing tests may fail if node dimensions changed — if so, the golden files get auto-regenerated on first run (when expected file doesn't exist). Since they already exist, run this to force regeneration:

```bash
# Regenerate all expected outputs
rm tests/expected/flowchart.excalidraw tests/expected/flowchart_json.excalidraw tests/expected/architecture.excalidraw
bash tests/run_golden.sh
```

Expected output: all tests PASS.

- [ ] **Step 4: Verify multi-line output correctness**

```bash
cat tests/expected/multiline.excalidraw | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
const texts = d.elements.filter(e => e.type === 'text');
for (const t of texts) {
  console.log(JSON.stringify({text: t.text, width: t.width, height: t.height, x: t.x, y: t.y}));
}
"
```

Expected: the "Line 1\nLine 2\nLine 3" text element has `height` ≈ 60 (3 lines × 16 × 1.25) and `width` based on the longest line. The "Hi" text element has `height` ≈ 20 (1 line). The box containing "Line 1\nLine 2\nLine 3" is taller than the box containing "Hi".

- [ ] **Step 5: Commit**

```bash
git add tests/input/multiline.js tests/input/multiline_json.json tests/expected/
git commit -m "test: add multi-line golden tests, regenerate expected outputs"
```

---

## Task Dependency Graph

```
Task 1 (normalize.ts)
  ├── Task 2 (index.ts exports)
  ├── Task 3 (dagre.ts)
  ├── Task 4 (grid.ts)
  ├── Task 5 (pipeline.ts)
  ├── Task 6 (render.ts)
  └── Task 7 (diagram.ts)
        └── Task 8 (golden tests) — depends on ALL of 1-7
```

Tasks 2-7 can run in parallel after Task 1 completes.
