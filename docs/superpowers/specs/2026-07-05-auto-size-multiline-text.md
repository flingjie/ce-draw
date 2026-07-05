# Auto-Size Bounding Boxes & Multi-Line Text Measurement

**Date:** 2026-07-05
**Status:** approved

## Problem

Two related issues in text rendering:

1. **Bounding boxes too small / not adaptive** — Layout engines (dagre, grid, pipeline) use hardcoded node dimensions (e.g., dagre: 150×65 for all rectangles). A 3-char label gets the same box as a 30-char label. Long text overflows.

2. **Multi-line text not correctly measured** — `textWidth()` treats the entire string as one line. Newlines (`\n`) are not split, so a multi-line label gets one enormous width value and incorrect vertical positioning. `createTextElement()` always sets `height: fontSize * 1.5` (single-line only).

## Design

### 1. Core Utilities (`normalize.ts`)

**New: `TextMetrics` interface**

```typescript
export interface TextMetrics {
  width: number;       // max line width
  height: number;      // total text block height (lineCount × lineHeight)
  lines: string[];     // individual lines after split
  lineCount: number;   // number of lines
  lineHeight: number;  // fontSize × 1.25
}
```

**New: `measureText(content, fontSize)` → `TextMetrics`**

Splits on `\n`, measures each line independently using the existing character-width heuristic (0.6× ASCII, 1.0× CJK), returns max width + total height.

**New: `normalizeLabel(label: string | string[])` → `string`**

Joins array input with `\n`. Called at API boundaries so internal code always works with `string` + `\n`.

**Modified: `textWidth(content, fontSize)`**

Delegates to `measureText(content, fontSize).width` internally. Backward compatible.

**Modified: `createTextElement(...)`**

- Gains optional `metrics?: TextMetrics` parameter (avoids double measurement)
- `height` becomes `metrics.height` instead of hardcoded `fontSize * 1.5`
- `width` already uses `textWidth` → now uses `metrics.width`

### 2. Layout Engine Auto-Sizing

Each engine measures node labels and computes dimensions with padding + minimums:

| Engine | Min W | Min H | Pad X | Pad Y |
|--------|-------|-------|-------|-------|
| dagre (rectangle) | 120 | 50 | 32 | 24 |
| dagre (diamond) | 100 | 80 | 32 | 24 |
| grid | max label width | max label height | 32 | 24 |
| pipeline | max label width | max label height | 32 | 24 |

- `LayoutOptions.fontSize` already exists in the type — now actually wired in.
- Explicit `cellW`/`cellH`/`stageW`/`stageH` in opts still override (backward compatible).
- Grid and pipeline use global max across all nodes (uniform stages/cells look better).

### 3. API Boundaries — Label Normalization

**`renderDiagram()` entry point:**
Normalize all `node.label` and `edge.label` via `normalizeLabel()` at the top.

**`JSONNode` type:**
`label: string | string[]` (was `string`).

**`buildShape()` in `render.ts`:**
Use `measureText` for multi-line-aware centering:
```typescript
const m = measureText(node.label, theme.fontSize);
const textX = pos.x + pos.width / 2 - m.width / 2;
const textY = pos.y + pos.height / 2 - m.height / 2;  // was: - fontSize * 0.6
```

**`buildArrow()` in `render.ts`:**
Same treatment for edge labels.

### 4. Diagram API Auto-Sizing (`diagram.ts`)

**`addBox()`:**
When `opts.width`/`opts.height` are not provided, auto-size from `measureText(name, this.theme.fontSize)` + padding + minimums. Text positioning inside the box uses metrics for centering.

**`addArrow()` edge labels:**
Same `measureText` for correct multi-line edge label centering.

**`addText()`:**
Gets metrics-aware behavior automatically via updated `createTextElement`.

### 5. Sequence Diagrams (`buildSequence`)

Participant boxes come from dagre layout (already fixed by Section 2). The message label positioning in `buildSequence` also uses `textWidth` → gains multi-line awareness via the updated function.

## Files Changed

| File | Change |
|------|--------|
| `src/normalize.ts` | Add `TextMetrics`, `measureText()`, `normalizeLabel()`. Update `textWidth()`, `createTextElement()` |
| `src/layout/dagre.ts` | Measure labels for node dimensions, use `opts.fontSize` |
| `src/layout/grid.ts` | Auto-size from max label when opts not provided |
| `src/layout/pipeline.ts` | Auto-size from max label when opts not provided |
| `src/render.ts` | Multi-line-aware centering in `buildShape`, `buildArrow`, `buildSequence`. Normalize labels in `renderDiagram` |
| `src/types.ts` | `JSONNode.label` → `string \| string[]` |
| `src/diagram.ts` | Auto-size in `addBox`, multi-line in `addArrow` labels |
| `src/layout/types.ts` | (no change — `fontSize` already exists in `LayoutOptions`) |

## Risks / Edge Cases

- **Empty labels** — `measureText("")` returns `width: fontSize` (matching current behavior) and `height: lineHeight` for one line.
- **Very long single-word labels** (no spaces, e.g., URLs) — width grows linearly, no wrapping. Acceptable for diagram labels (users should keep labels short).
- **Mixed CJK + ASCII on same line** — heuristic is additive per character, reasonable.
- **Dagre layout with varied node sizes** — dagre natively handles per-node dimensions. No issue.
- **Golden tests** — `tests/expected/*.excalidraw` will need regeneration since node sizes and text positions change.
- **Backward compatibility** — explicit `width`/`height`/`cellW`/`stageW` opts still override auto-sizing. The `textWidth` function signature is unchanged. Only net-new behavior is triggered by multi-line labels or omitted size params.

## Test Strategy

1. Run existing golden tests, regenerate expected outputs
2. Add a multi-line label case to golden test inputs (e.g., `"Line 1\nLine 2\nLine 3"`)
3. Add an array-label case (`["Line 1", "Line 2"]`)
4. Verify output `.excalidraw` files have correct text element `width`, `height`, and `y` positioning for multi-line labels
5. Verify node bounding boxes are larger for longer labels
