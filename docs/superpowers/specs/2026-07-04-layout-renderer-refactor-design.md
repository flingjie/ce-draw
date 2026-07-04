# Refactor to layout/ + renderer/ Directory Structure

**Date:** 2026-07-04
**Goal:** 4.3 — Decouple mermaid.ts and normalize.ts into pure layout engines and renderer modules.

## Motivation

`mermaid.ts` (486 lines) mixes three distinct responsibilities:
1. **Parsing** — Mermaid syntax → `ParsedDiagram` AST
2. **Layout** — dagre graph layout, arrow routing, sequence lifeline positioning
3. **Rendering** — shape/arrow/lifeline/field/method element construction + icon resolution + margin adjustment

`normalize.ts` (196 lines) contains element factories and theme normalization that belong in a renderer layer.

`diagram.ts` (243 lines) has a manual grid layout function (`_gridPos`) embedded in the `Diagram` class.

## Target Structure

```
src/
├── types.ts               — unchanged
├── themes.ts              — unchanged
├── token_compiler.ts      — unchanged
├── icon_resolver.ts       — unchanged
├── library.ts             — unchanged
├── cli.ts                 — unchanged
├── index.ts               — updated re-exports
│
├── mermaid.ts             — parser + orchestrator (thin, delegates to layout/ + renderer/)
├── diagram.ts             — Diagram class (uses layout/grid + renderer/factory)
│
├── layout/                — pure: input = graph/options, output = positions
│   ├── dagre.ts           — runDagreLayout() + routeArrow()
│   ├── sequence.ts        — calculateSequenceLayout() → lifeline + message positions
│   └── grid.ts            — gridPosition() → x/y from row/col
│
└── renderer/              — pure: input = positions + theme, output = elements
    ├── factory.ts         — makeId(), hashSeed(), textWidth(), createElement(), createTextElement()
    ├── normalize.ts       — normalizeElement(), normalize(), buildAppState()
    └── shapes.ts          — buildShape(), buildArrow(), renderLifelines(), renderSequenceMessages()
                            — renderEntityFields(), renderClassMembers(), applyViewportMargin()
```

### Files to DELETE
- `src/normalize.ts` — absorbed into `renderer/factory.ts` + `renderer/normalize.ts`

### Files to CREATE

#### `src/layout/dagre.ts`
- `runDagreLayout(nodes, edges, direction, fontSize)` → `Map<string, Position>`
- `routeArrow(fromPos, toPos, direction)` → `{fx, fy, tx, ty}`
- Imports: dagre, spacing tokens
- Pure functions, zero element creation

#### `src/layout/sequence.ts`
- `calculateSequenceLayout(nodes, positions, messages)` → `SequenceLayout`
- `SequenceLayout`: `{ lifelineTop, lifelineBottom, lifelines[], messagePositions[] }`
- Pure computation — no elements created

#### `src/layout/grid.ts`
- `gridPosition(index, cols, cellW, cellH, gapX, gapY, originX?, originY?)` → `{x, y}`
- Used by `Diagram._gridPos()` — replaces instance method with a function call

#### `src/renderer/factory.ts`
- `makeId(): string`
- `hashSeed(id: string): number`
- `textWidth(content: string, fontSize: number): number`
- `createElement(type, overrides?): ExcalidrawElement`
- `createTextElement(content, x, y, fontSize, fontFamily, containerId?): ExcalidrawElement`
- Imports: types.ts

#### `src/renderer/normalize.ts`
- `buildAppState(theme): ExcalidrawDocument["appState"]`
- `normalizeElement(el, theme, colorIndex): ExcalidrawElement`
- `normalize(elements, theme): ExcalidrawElement[]`
- Imports: types.ts

#### `src/renderer/shapes.ts`
- `buildShape(label, shapeType, pos, stroke, bg, theme)` → `ExcalidrawElement[]`
  - `shapeType` is `ShapeType` (already converted from parser's `Shape` by orchestrator)
- `buildArrow(fromPos, toPos, direction, label, theme)` → `ExcalidrawElement[]`
  - Inputs are plain positions + label, NOT `ParsedEdge`
- `renderLifelines(nodes, positions, layout: SequenceLayout, theme)` → `ExcalidrawElement[]`
- `renderLifelines(layout: SequenceLayout, theme)` → `ExcalidrawElement[]`
- `renderSequenceMessages(layout: SequenceLayout, theme)` → `ExcalidrawElement[]`
- `renderEntityFields(entityId, pos, fields, theme)` → `ExcalidrawElement[]`
- `renderClassMembers(classId, pos, attributes, methods, theme)` → `ExcalidrawElement[]`
- `applyViewportMargin(elements, margin)` → `ExcalidrawElement[]` (returns adjusted elements)
- Imports: types.ts, renderer/factory.ts, themes.ts

### Files to MODIFY

#### `src/mermaid.ts`
- Remove: layout functions → imports from `layout/dagre.ts` + `layout/sequence.ts`
- Remove: renderer functions → imports from `renderer/shapes.ts`
- Remove: icon resolution logic → already in `icon_resolver.ts`, just use it
- Keep: all `parse*` functions (these stay as the parser layer)
- Keep: `mermaidToExcalidraw()` orchestrator → now thin: parse → layout → render
- ~200 lines (down from 486)

#### `src/diagram.ts`
- `_gridPos()` → replaced by `gridPosition()` from `layout/grid.ts`
- `createElement/createTextElement` → import from `renderer/factory.ts`
- `normalizeElement` → import from `renderer/normalize.ts`
- `buildAppState` → import from `renderer/normalize.ts`
- ~220 lines (down from 243, minimal change)

#### `src/index.ts`
- Update re-export paths:
  - `Diagram` from `./diagram.js`
  - `mermaidToExcalidraw` from `./mermaid.js`
  - `getTheme, listThemes, THEMES` from `./themes.js`
  - `normalize, normalizeElement, makeId` from `./renderer/normalize.js` + `./renderer/factory.js`
  - `ICONS, listIcons, loadLibraryIcon, listLibrary, listLibraries` from `./library.js`
  - `resolveIcon, resolveIconName` from `./icon_resolver.js`
  - `loadThemesFromTokens, getSpacing, getShadowTokens` from `./token_compiler.js`

## Migration Strategy

1. Create all 6 new files with extracted code (no behavioral changes)
2. Update `diagram.ts` imports
3. Update `mermaid.ts` to delegate to layout/ + renderer/
4. Update `index.ts` re-export paths
5. Delete `normalize.ts`
6. Build + run golden tests — all must pass with zero diff

## Constraints

- **Zero behavioral change** — outputs must be byte-identical to current
- **All golden tests pass** — 5/5 without modification
- **All public exports preserved** — `index.ts` exports identical set of symbols
- **No new dependencies** — dagre is the only external dependency

## Type Design

### New types added to `types.ts`

```ts
export type Direction = "TB" | "LR" | "RL" | "BT";

export interface Position {
  x: number; y: number; width: number; height: number;
}
```

### Types staying local

| Type | File | Reason |
|------|------|--------|
| `Shape` (`"rectangle" \| "diamond" \| "ellipse" \| "roundrect"`) | `mermaid.ts` | Parser domain — converted to `ShapeType` before reaching renderer |
| `ParsedNode`, `ParsedEdge`, `ParsedDiagram` | `mermaid.ts` | Parser domain — orchestrator unpacks these into layout/renderer inputs |
| `SequenceLayout` | `layout/sequence.ts` | Layout domain — exported for consumption by `renderer/shapes.ts` |

### Cross-module dependency rules

```
layout/     — imports: types.ts, token_compiler.ts (spacing), dagre (npm)
renderer/   — imports: types.ts, themes.ts
              renderer/shapes.ts also imports layout/sequence.ts (SequenceLayout type only)
mermaid.ts  — imports: layout/*, renderer/*, parser (self), types.ts, themes.ts, icon_resolver.ts, library.ts
diagram.ts  — imports: layout/grid.ts, renderer/factory.ts, renderer/normalize.ts, types.ts, themes.ts, library.ts
```

> `renderer/shapes.ts` imports `SequenceLayout` from `layout/sequence.ts` — a type-only dependency. The layering is: layout produces Positions, renderer consumes them. This is the only permitted cross-layer import.
