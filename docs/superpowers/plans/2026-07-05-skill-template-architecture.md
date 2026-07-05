# Three-Layer Decoupling Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Skill→Template→Library three-layer architecture: introduce TemplateSchema types, `renderFromRecipe()`, role color resolution, a Recipe-format template, and a thinned SKILL.md.

**Architecture:** Insert a stable `TemplateConfig` schema between templates and the Diagram API. Templates define slots+constraints in YAML frontmatter instead of embedding API code. `renderFromRecipe()` reads templates, validates slots, builds a Scene Graph (or renders directly via Diagram API for now), and returns an `ExcalidrawDocument`. Role colors flow from `tokens.yaml` through `ThemeConfig.roles` into component colors, replacing index-based cycling.

**Tech Stack:** TypeScript (Node.js), dagre (existing), no new dependencies.

## Global Constraints

- `renderFromRecipe` is additive — does not replace `renderDiagram` or `Diagram` API
- Template frontmatter uses `schema_version: 1` independent of library version
- Template body is markdown for AI — frontmatter is structured data for the library
- Skill only references template directory path and `renderFromRecipe` function name
- Diagram API public signatures unchanged — new methods are additive

---

### Task 1: Recipe Types (`src/recipe_types.ts`)

**Files:**
- Create: `src/recipe_types.ts`

**Interfaces:**
- Produces: `TemplateConfig`, `NarrativeSlots`, `RecipeSlots`, `Archetype`

- [ ] **Step 1: Write `src/recipe_types.ts`**

```ts
/** Archetype determines which layout engine renders the diagram. */
export type Archetype = "narrative" | "flow" | "topology" | "comparison" | "pipeline";

/** Template frontmatter — parsed from YAML between --- markers. */
export interface TemplateConfig {
  id: string;
  schema_version: number;
  archetype: Archetype;
  description: string;
  grid: {
    cols: number;
    cellW: number;
    cellH: number;
    gapX: number;
    gapY: number;
  };
  direction: "TB" | "LR";
  /** Role name → color key (resolved via tokens.yaml colors) */
  roles: Record<string, string>;
}

// ── Per-archetype slot types ────────────────────────────────────

export interface CardSlot {
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface SectionSlot {
  heading: string;
  subtitle?: string;
  role: string;
  items: CardSlot[];
}

export interface TransitionSlot {
  from: number; // section index
  to: number;   // section index
  label: string;
}

export interface CalloutSlot {
  text: string;
  icon?: string;
}

export interface NarrativeSlots {
  title?: string;
  sections: SectionSlot[];
  transitions: TransitionSlot[];
  callout?: CalloutSlot;
}

// Future archetype slot types (not yet wired):
// export interface FlowSlots { nodes: ...; edges: ... }
// export interface TopologySlots { ... }
// export interface ComparisonSlots { ... }
// export interface PipelineSlots { ... }

/** Union of all archetype slot types. */
export type RecipeSlots = NarrativeSlots;
// | FlowSlots | TopologySlots | ComparisonSlots | PipelineSlots;
```

- [ ] **Step 2: Build and verify no errors**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/recipe_types.ts
git commit -m "feat: add recipe type definitions"
```

---

### Task 2: Role Colors in ThemeConfig + Design Tokens

**Files:**
- Modify: `src/types.ts:107-121` — add `roles` to `ThemeConfig`
- Modify: `design-tokens/tokens.yaml` — add `roles` section
- Modify: `src/token_compiler.ts:13-23,46-51,133-147` — parse and compile roles
- Modify: `src/themes.ts:18-104` — fallback themes get roles

**Interfaces:**
- Produces: `ThemeConfig.roles?: Record<string, [string, string]>`
- Consumes: `FlatTokens` gains `roles` section (from Task 2 Step 2)

- [ ] **Step 1: Add `roles` to `ThemeConfig` in `src/types.ts`**

```ts
// At the end of the ThemeConfig interface (line 121, before closing `}`):
  /** Semantic role → [strokeColor, backgroundColor]. Resolved from tokens.yaml. */
  roles?: Record<string, [string, string]>;
```

Edit `src/types.ts`:

```ts
export interface ThemeConfig {
  name: string;
  shapes: Array<[string, string]>;
  arrow: string;
  text: string;
  accent: string;
  background: string;
  strokeWidth: number;
  roughness: number;
  roundness: Roundness | null;
  fontFamily: FontFamily;
  fontSize: number;
  fillStyle: FillStyle;
  strokeStyle: StrokeStyle;
  /** Semantic role → [strokeColor, backgroundColor]. Compiled from tokens.yaml roles section. */
  roles?: Record<string, [string, string]>;
}
```

- [ ] **Step 2: Add `roles` section to `design-tokens/tokens.yaml`**

Append after the `shadow` section:

```yaml
# ── Role Colors ────────────────────────────────────────────────

roles:
  primary: slate
  secondary: moss
  gap: brown
  callout: amber
  muted: taupe
```

- [ ] **Step 3: Update `FlatTokens` interface and parser in `src/token_compiler.ts`**

Add `roles` to the interface and parser:

```ts
// In FlatTokens interface (line 13), add:
  roles: Record<string, string>;

// In parseTokens result init (line 47), add `roles: {}`:
  const result: any = {
    colors: {}, shapes: {}, spacing: {}, typography: {},
    stroke_width: {}, stroke_roughness: {}, stroke_roundness: {},
    stroke_style: {}, shadow: {}, roles: {},
  };

// In the kv parsing block (line 70-85), add a case for roles:
    if (section === "colors" && Array.isArray(val)) {
      result.colors[key] = val as [string, string];
    } else if (section === "roles") {
      result.roles[key] = val as string;
    } else if (section === "shapes") {
```

- [ ] **Step 4: Compile roles in `compileTheme()` in `src/token_compiler.ts`**

Add after the `fontFamily` assignment (line 131) in `compileTheme`:

```ts
  // Compile role colors: role_name → color_key → [stroke, bg]
  const roles: Record<string, [string, string]> = {};
  for (const [roleName, colorKey] of Object.entries(tokens.roles)) {
    roles[roleName] = resolveColor(colorKey as string, tokens);
  }
```

And add `roles: Object.keys(roles).length > 0 ? roles : undefined` to the return object (after `fontSize`):

```ts
  return {
    name,
    shapes,
    arrow: String(tokens.colors[`arrow_${name}`] || "#6B7280"),
    text: String(tokens.colors[`text_${name}`] || "#1F2937"),
    accent: String(tokens.colors[`accent_${name}`] || "#2563EB"),
    background: String(tokens.colors[`bg_${name}`] || "#FFFFFF"),
    strokeWidth: tokens.stroke_width.default ?? 2,
    roughness: roughness ?? 1,
    roundness,
    fontFamily: fontFamily ?? 1,
    fontSize: tokens.typography.font_size_default ?? 16,
    fillStyle: "solid",
    strokeStyle: "solid",
    roles: Object.keys(roles).length > 0 ? roles : undefined,
  } as ThemeConfig;
```

- [ ] **Step 5: Add role defaults to fallback themes in `src/themes.ts`**

Each fallback theme needs a `roles` field. Add to `_sketchy` (after `strokeStyle`):

```ts
  roles: {
    primary:  ["#1E3A5F", "#B8D4F0"], // slate
    secondary: ["#2D5A27", "#C5E8C0"], // moss
    gap:       ["#8B4513", "#F5D5B8"], // brown
    callout:   ["#D97706", "#FEF3C7"], // amber
    muted:     ["#4A3728", "#E8D5C0"], // taupe
  },
```

Add to `_professional`:

```ts
  roles: {
    primary:  ["#2563EB", "#DBEAFE"], // blue
    secondary: ["#059669", "#D1FAE5"], // green
    gap:       ["#D97706", "#FEF3C7"], // amber
    callout:   ["#DC2626", "#FEE2E2"], // red
    muted:     ["#9CA3AF", "#F3F4F6"], // gray
  },
```

Add to `_dark` (after `strokeStyle`):

```ts
  roles: {
    primary:  ["#60A5FA", "#1E3A5F"], // neon blue
    secondary: ["#34D399", "#064E3B"], // neon green
    gap:       ["#FBBF24", "#78350F"], // neon amber
    callout:   ["#F87171", "#7F1D1D"], // neon red
    muted:     ["#9CA3AF", "#374151"], // gray
  },
```

Add to `_colorful` (after `strokeStyle`):

```ts
  roles: {
    primary:  ["#1C7ED6", "#A5D8FF"], // bright blue
    secondary: ["#2F9E44", "#B2F2BB"], // bright green
    gap:       ["#E8590C", "#FFD8A8"], // bright orange
    callout:   ["#E03131", "#FFC9C9"], // bright red
    muted:     ["#ADB5BD", "#F8F9FA"], // gray
  },
```

- [ ] **Step 6: Build and verify**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors. Verify `dist/themes.js` includes role colors.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts design-tokens/tokens.yaml src/token_compiler.ts src/themes.ts
git commit -m "feat: add semantic role colors to ThemeConfig and design tokens"
```

---

### Task 3: `renderFromRecipe()` + Template Loading (`src/recipe.ts`)

**Files:**
- Create: `src/recipe.ts`
- Create: `src/recipe_validate.ts`

**Interfaces:**
- Consumes: `TemplateConfig` from `recipe_types.ts`, `Card/Section/Callout` from `components.ts`, `Diagram` from `diagram.ts`, `ThemeConfig` from `types.ts`, `getTheme` from `themes.ts`
- Produces: `loadTemplate(templateId: string): { config: TemplateConfig; body: string }`, `renderFromRecipe(templateId: string, slots: RecipeSlots, themeName?: string): ExcalidrawDocument`

- [ ] **Step 1: Write `src/recipe_validate.ts` — slot validation**

```ts
import type { TemplateConfig, NarrativeSlots, CardSlot, SectionSlot, TransitionSlot, CalloutSlot } from "./recipe_types.js";

/** Validate NarrativeSlots against template config. Returns errors array (empty = valid). */
export function validateNarrativeSlots(
  slots: NarrativeSlots,
  config: TemplateConfig
): string[] {
  const errors: string[] = [];

  // sections
  if (!Array.isArray(slots.sections) || slots.sections.length === 0) {
    errors.push("sections: must be a non-empty array");
  } else if (slots.sections.length < 2) {
    errors.push("sections: narrative archetype requires at least 2 sections");
  } else {
    for (let i = 0; i < slots.sections.length; i++) {
      const s = slots.sections[i];
      if (!s.heading || typeof s.heading !== "string") {
        errors.push(`sections[${i}].heading: required string`);
      }
      if (!s.role || typeof s.role !== "string") {
        errors.push(`sections[${i}].role: required string`);
      } else if (config.roles && !config.roles[s.role]) {
        errors.push(`sections[${i}].role: "${s.role}" not defined in template roles (${Object.keys(config.roles).join(", ")})`);
      }
      if (!Array.isArray(s.items) || s.items.length === 0) {
        errors.push(`sections[${i}].items: must be a non-empty array`);
      } else {
        for (let j = 0; j < s.items.length; j++) {
          if (!s.items[j].title || typeof s.items[j].title !== "string") {
            errors.push(`sections[${i}].items[${j}].title: required string`);
          }
        }
      }
    }
  }

  // transitions
  if (!Array.isArray(slots.transitions)) {
    errors.push("transitions: must be an array");
  } else {
    for (let i = 0; i < slots.transitions.length; i++) {
      const t = slots.transitions[i];
      if (typeof t.from !== "number" || t.from < 0 || t.from >= slots.sections.length) {
        errors.push(`transitions[${i}].from: must be valid section index (0–${slots.sections.length - 1})`);
      }
      if (typeof t.to !== "number" || t.to < 0 || t.to >= slots.sections.length) {
        errors.push(`transitions[${i}].to: must be valid section index (0–${slots.sections.length - 1})`);
      }
      if (t.from === t.to) {
        errors.push(`transitions[${i}]: from and to must be different (got ${t.from})`);
      }
      if (!t.label || typeof t.label !== "string" || t.label.trim() === "") {
        errors.push(`transitions[${i}].label: required non-empty string (narrative arrows need labels)`);
      }
    }
  }

  // callout (optional)
  if (slots.callout !== undefined) {
    if (!slots.callout.text || typeof slots.callout.text !== "string") {
      errors.push("callout.text: required string when callout is present");
    }
  }

  return errors;
}
```

- [ ] **Step 2: Write `src/recipe.ts` — template loading and main entry point**

```ts
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { ExcalidrawDocument } from "./types.js";
import type { TemplateConfig, RecipeSlots, NarrativeSlots } from "./recipe_types.js";
import { validateNarrativeSlots } from "./recipe_validate.js";
import { getTheme } from "./themes.js";
import { Diagram } from "./diagram.js";
import { createElement, normalizeElement, makeId, textWidth } from "./normalize.js";

// ── Template Loading ──────────────────────────────────────────

/** Parse YAML frontmatter between --- markers. Returns { config, body }. */
function parseFrontmatter(raw: string): { config: Record<string, unknown>; body: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    throw new Error(`Template must start with YAML frontmatter (---)`);
  }
  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    throw new Error(`Template frontmatter not closed (missing second ---)`);
  }
  const fm = trimmed.slice(3, endIdx).trim();
  const body = trimmed.slice(endIdx + 3).trim();

  // Simple YAML parser for flat + one-level-nested values
  const config: Record<string, unknown> = {};
  const lines = fm.split("\n");
  let currentKey = "";
  let currentObj: Record<string, unknown> = {};

  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    // Strip inline comment
    const ci = t.indexOf("  #");
    const content = ci >= 0 ? t.slice(0, ci).trim() : t;

    if (/^[a-z_]+:$/.test(content) && !content.startsWith(" ")) {
      // Top-level key
      if (currentKey && Object.keys(currentObj).length > 0) {
        config[currentKey] = currentObj;
        currentObj = {};
      }
      currentKey = content.slice(0, -1);
    } else if (currentKey && content.startsWith("  ")) {
      // Nested key: "  key: value"
      const kv = content.trim().match(/^([a-z_]+):\s*(.+)/);
      if (kv) {
        const val = _parseYamlValue(kv[2].trim());
        currentObj[kv[1]] = val;
      }
    } else if (currentKey && !content.startsWith(" ")) {
      // Simple top-level key: "key: value"
      const kv = content.match(/^([a-z_]+):\s*(.+)/);
      if (kv) {
        const val = _parseYamlValue(kv[1] === currentKey ? kv[2].trim() : kv[2].trim());
        config[kv[1]] = val;
      }
    }
  }
  if (currentKey && Object.keys(currentObj).length > 0) {
    config[currentKey] = currentObj;
  }

  return { config, body };
}

function _parseYamlValue(s: string): any {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function resolveTemplatePath(templateId: string): string {
  // Try multiple locations relative to cwd and package
  const candidates = [
    resolve(process.cwd(), "templates", `${templateId}.md`),
    resolve(dirname(fileURLToPath(import.meta.url)), "../templates", `${templateId}.md`),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../templates", `${templateId}.md`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Template "${templateId}" not found in templates/. Looked in: ${candidates.join(", ")}`
  );
}

/** Load a template by ID (e.g. "narrative-framework" → templates/narrative-framework.md). */
export function loadTemplate(templateId: string): { config: TemplateConfig; body: string } {
  const path = resolveTemplatePath(templateId);
  const raw = readFileSync(path, "utf-8");
  const { config, body } = parseFrontmatter(raw);

  // Coerce to TemplateConfig
  const tc: TemplateConfig = {
    id: config.id as string,
    schema_version: config.schema_version as number,
    archetype: config.archetype as TemplateConfig["archetype"],
    description: config.description as string,
    grid: config.grid as TemplateConfig["grid"],
    direction: config.direction as TemplateConfig["direction"],
    roles: config.roles as Record<string, string>,
  };

  if (!tc.id || !tc.archetype || !tc.grid) {
    throw new Error(`Template "${templateId}" is missing required frontmatter fields (id, archetype, grid).`);
  }

  return { config: tc, body };
}

// ── Narrative Renderer ─────────────────────────────────────────

function _renderNarrative(
  config: TemplateConfig,
  slots: NarrativeSlots,
  themeName: string
): ExcalidrawDocument {
  const theme = getTheme(themeName);
  const { cols, cellW, cellH, gapX, gapY } = config.grid;
  const fullW = cols * cellW + (cols - 1) * gapX;

  const d = new Diagram(theme, { cols, cellW, cellH, gapX, gapY });

  // Headroom offsets — sections stack vertically
  let sectionY = 0;
  const sectionNames: string[] = [];
  const sectionBottoms: number[] = [];

  // ── Title ──
  if (slots.title) {
    d.addText(slots.title, fullW / 2 - textWidth(slots.title, 24) / 2, sectionY, 24);
    sectionY += 48;
  }

  // ── Sections + Cards ──
  for (let si = 0; si < slots.sections.length; si++) {
    const sec = slots.sections[si];
    const cardRows = Math.ceil(sec.items.length / cols);
    const headingH = 56; // heading + subtitle area
    const secH = headingH + cardRows * (cellH + gapY) + gapY;

    const roleColors = theme.roles?.[sec.role];
    const [stroke, bg] = roleColors ?? theme.shapes[si % theme.shapes.length];

    // Register a phantom anchor for arrow connections
    const anchorId = `sec_${si}`;
    const anchorEl = createElement("rectangle", {
      x: 0, y: sectionY, width: fullW, height: secH,
      strokeColor: "transparent", backgroundColor: "transparent",
      fillStyle: "solid", strokeWidth: 0, roughness: 0, roundness: null,
      id: anchorId,
    });
    (d as any)._named.set(anchorId, normalizeElement(anchorEl, theme, 0));

    sectionNames.push(anchorId);
    sectionBottoms.push(sectionY + secH);

    // Section frame + heading
    const comp = d.addSection(`sec_frame_${si}`, {
      heading: sec.heading,
      subtitle: sec.subtitle,
      role: sec.role,
      row: 0, col: 0, span: cols, width: fullW, height: secH,
    });

    // Override the section's colors with role colors
    comp.primary.strokeColor = stroke;
    comp.primary.backgroundColor = bg;
    for (const el of comp.elements) {
      if (el.type === "rectangle") {
        el.strokeColor = stroke;
        el.backgroundColor = bg;
      }
    }

    // Cards within section: grid of min(itemCount, 3) columns
    const cardAreaY = sectionY + headingH + gapY / 2;
    for (let ci = 0; ci < sec.items.length; ci++) {
      const item = sec.items[ci];
      const cardCol = ci % cols;
      const cardRow = Math.floor(ci / cols);
      const cx = cardCol * (cellW + gapX);
      const cy = cardAreaY + cardRow * (cellH + gapY);

      const card = d.addCard(`sec_${si}_card_${ci}`, {
        title: item.title,
        subtitle: item.subtitle,
        icon: item.icon,
        role: sec.role,
        width: cellW, height: cellH,
      });

      // Override card colors with role colors
      card.primary.strokeColor = stroke;
      card.primary.backgroundColor = bg;
      for (const el of card.elements) {
        if (el.type === "rectangle") {
          el.strokeColor = stroke;
          el.backgroundColor = bg;
        }
      }
    }

    sectionY += secH + gapY;
  }

  // ── Transitions ──
  for (const t of slots.transitions) {
    const fromBot = sectionBottoms[t.from];
    const toTop = sectionBottoms[t.to] - 
      (slots.sections[t.to] ? 
        (Math.ceil(slots.sections[t.to].items.length / cols) * (cellH + gapY) + 56 + gapY) : 
        cellH + 56 + gapY);

    const fromX = fullW / 2;
    const toX = fullW / 2;
    const arrowY = fromBot + gapY / 4;
    const arrowH = toTop - fromBot - gapY / 2;

    const arrowEl = createElement("arrow", {
      x: fromX, y: arrowY, width: 0, height: arrowH,
      strokeColor: theme.arrow,
      roundness: { type: 2 },
    }) as any;
    arrowEl.points = [[0, 0], [0, arrowH]];
    arrowEl.startArrowhead = null;
    arrowEl.endArrowhead = "arrow";
    arrowEl.startBinding = null;
    arrowEl.endBinding = null;

    const lbl = d.addText(
      t.label,
      fromX - textWidth(t.label, 14) / 2,
      arrowY + arrowH / 2 - 10,
      14
    );

    d.elements.push(normalizeElement(arrowEl, theme, 0));
  }

  // ── Callout ──
  if (slots.callout) {
    d.addCallout("callout", {
      text: slots.callout.text,
      icon: slots.callout.icon,
      role: "callout",
      span: cols,
    });
  }

  return d.toDocument();
}

// ── Public API ─────────────────────────────────────────────────

/** Render a diagram from a template + slot data. */
export function renderFromRecipe(
  templateId: string,
  slots: RecipeSlots,
  themeName: string = "sketchy"
): ExcalidrawDocument {
  const { config } = loadTemplate(templateId);

  // Validate
  const errors = validateNarrativeSlots(slots as NarrativeSlots, config);
  if (errors.length > 0) {
    throw new Error(`Slot validation failed for template "${templateId}":\n  - ${errors.join("\n  - ")}`);
  }

  // Dispatch to archetype renderer
  switch (config.archetype) {
    case "narrative":
      return _renderNarrative(config, slots as NarrativeSlots, themeName);
    default:
      throw new Error(`Archetype "${config.archetype}" not yet supported in renderFromRecipe.`);
  }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/recipe_types.ts src/recipe.ts src/recipe_validate.ts
git commit -m "feat: add renderFromRecipe with narrative archetype renderer"
```

---

### Task 4: Role Color Resolution in Diagram

**Files:**
- Modify: `src/diagram.ts` — add `resolveRoleColor()` method, update `addCard`/`addSection`/`addCallout`

**Interfaces:**
- Produces: `Diagram.resolveRoleColor(role: string): [string, string]`
- Consumes: `ThemeConfig.roles` from Task 2

- [ ] **Step 1: Add `resolveRoleColor` and a role-tracker to Diagram class**

In `src/diagram.ts`, add a `_roleIdx` map and `resolveRoleColor` method.

After the existing fields (line 37):

```ts
  private _roleIdx: Map<string, number>;
```

In `constructor`, after `this._gapY` (line 58):

```ts
    this._roleIdx = new Map();
```

After the constructor, before `_gridPos`:

```ts
  /** Resolve role-based colors. Falls back to shape palette cycling. */
  private _resolveRoleColor(role?: string): [string, string] {
    if (role && this.theme.roles && this.theme.roles[role]) {
      return this.theme.roles[role];
    }
    const [stroke, bg] = this.theme.shapes[this._colorIdx % this.theme.shapes.length];
    this._colorIdx++;
    return [stroke, bg];
  }
```

- [ ] **Step 2: Replace color cycling in `addCard` with `_resolveRoleColor`**

In `addCard` (line 273), replace:

```ts
// Old:
    const [stroke, bg] = this.theme.shapes[this._colorIdx % this.theme.shapes.length];
    this._colorIdx++;

// New:
    const [stroke, bg] = this._resolveRoleColor(opts.role);
```

- [ ] **Step 3: Replace color cycling in `addSection` with `_resolveRoleColor`**

In `addSection` (line 319), same replacement:

```ts
// Old:
    const [stroke, bg] = this.theme.shapes[this._colorIdx % this.theme.shapes.length];
    this._colorIdx++;

// New:
    const [stroke, bg] = this._resolveRoleColor(opts.role);
```

- [ ] **Step 4: Replace color cycling in `addCallout` with `_resolveRoleColor`**

In `addCallout` (line 351), same replacement:

```ts
// Old:
    const [stroke, bg] = this.theme.shapes[this._colorIdx % this.theme.shapes.length];
    this._colorIdx++;

// New:
    const [stroke, bg] = this._resolveRoleColor(opts.role);
```

- [ ] **Step 5: Build and verify**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors. Existing golden tests should still pass (color cycling fallback works when no role).

- [ ] **Step 6: Commit**

```bash
git add src/diagram.ts
git commit -m "feat: resolve component colors by semantic role with shape-palette fallback"
```

---

### Task 5: First Recipe-Format Template

**Files:**
- Create: `templates/narrative-framework.md`

**Interfaces:**
- Consumes: TemplateSchema frontmatter format (from `recipe_types.ts`)
- Produces: AI-readable template for narrative concept diagrams

- [ ] **Step 1: Write `templates/narrative-framework.md`**

```markdown
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
                        //   server, user, gear, globe, mobile, lock, fire, brain, lock
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
```

- [ ] **Step 2: Commit**

```bash
git add templates/narrative-framework.md
git commit -m "docs: add narrative-framework recipe template"
```

---

### Task 6: Thin SKILL.md

**Files:**
- Modify: `SKILL.md` — reduce from 269 lines to ~40 lines

**Interfaces:**
- Consumes: template directory path, `renderFromRecipe` function name
- Produces: AI routing instructions

- [ ] **Step 1: Rewrite `SKILL.md`**

```markdown
---
name: ec-draw
description: >
  Generate hand-drawn Excalidraw diagrams. Use when the user asks to draw, sketch,
  or create a diagram, flowchart, architecture diagram, concept diagram, or any visual diagram.
  Trigger on "draw", "sketch", "diagram", "flowchart", "visualize", "excalidraw".
---

# ec-draw: Excalidraw Diagram Generator

Generate themed `.excalidraw` files by filling a template's content slots and calling `renderFromRecipe`.

## Workflow

1. **Pick a template** — Read the matching template from `templates/` for the diagram type the user wants:
   - `templates/narrative-framework.md` — concept diagrams, frameworks, mental models
   - `templates/flowchart.md` — decision trees, process flows (coming soon in recipe format)
   - `templates/architecture.md` — system topology diagrams (coming soon in recipe format)

2. **Fill the slots** — Each template defines a `## Slots` section. Fill in the content (headings, items, icons, labels) based on what the user asked for. Templates define grid, colors, and layout — do NOT include coordinates or hex colors in your slots.

3. **Call `renderFromRecipe`** — Pass the template ID, your filled slots, and the theme:

```ts
import { renderFromRecipe } from "ec-draw";
import { writeFileSync } from "fs";

const doc = renderFromRecipe("narrative-framework", {
  title: "Diagram Title",
  sections: [
    {
      heading: "Section 1",
      role: "primary",
      items: [{ title: "Card A", subtitle: "description", icon: "cloud" }],
    },
    // ... more sections
  ],
  transitions: [
    { from: 0, to: 1, label: "describes the relationship" },
  ],
  callout: { text: "Key insight message", icon: "fire" },
}, "sketchy");

writeFileSync("output.excalidraw", JSON.stringify(doc, null, 2), "utf-8");
```

4. **Save** — Write to `.excalidraw` file.

## Themes

| Theme | Best for |
|-------|----------|
| `sketchy` | Brainstorming, early ideas (default) |
| `professional` | Architecture docs, formal presentations |
| `dark` | Dark-mode contexts |
| `colorful` | Slides, teaching, demos |

## Built-in Icons

`database`, `server`, `cloud`, `user`, `gear`, `document`, `globe`, `mobile`, `lock`, `fire`, `brain`, `code`, `lock`.

## Tips

- **Read the template before writing slots** — each template defines its own roles, grid, and rules
- **Transitions must have labels** — never create silent arrows between sections
- **Use roles from the template's table** — don't invent new role names
- **Match icons to semantic meaning** — `cloud` for external services, `lock` for security, `gear` for processing
```

- [ ] **Step 2: Commit**

```bash
git add SKILL.md
git commit -m "docs: thin SKILL.md to template-slot-recipe workflow"
```

---

### Task 7: Golden Test + Exports

**Files:**
- Create: `tests/input/narrative_framework.js`
- Create: `tests/expected/narrative-framework.excalidraw`
- Modify: `src/index.ts` — export new surface
- Modify: `tests/run_golden.sh` — add narrative test

**Interfaces:**
- Produces: `renderFromRecipe`, `loadTemplate`, `TemplateConfig`, `RecipeSlots` exports

- [ ] **Step 1: Write `tests/input/narrative_framework.js`**

```js
/**
 * Golden test: narrative-framework recipe — Map vs Territory.
 * Expected: 3 sections, 6 cards, 2 labeled transitions, 1 callout.
 *
 * Wraps renderFromRecipe result in a toDocument() shim for CLI run mode.
 */
import { renderFromRecipe } from "../../dist/index.js";

const doc = renderFromRecipe("narrative-framework", {
  title: "MAP vs TERRITORY",
  sections: [
    {
      heading: "MAP — Your Mental Model",
      subtitle: "What you think the world is",
      role: "primary",
      items: [
        { title: "Prompt", subtitle: "What you ask the model", icon: "document" },
        { title: "Context", subtitle: "What the model remembers", icon: "brain" },
      ],
    },
    {
      heading: "UNKNOWNS — The Gap",
      subtitle: "What you don't know you don't know",
      role: "gap",
      items: [
        { title: "Hidden Constraints", subtitle: "Undocumented requirements", icon: "lock" },
        { title: "Missing Context", subtitle: "Context not in your prompt", icon: "document" },
      ],
    },
    {
      heading: "TERRITORY — The Real World",
      subtitle: "What actually exists",
      role: "secondary",
      items: [
        { title: "Codebase", subtitle: "Real files and logic", icon: "code" },
        { title: "Constraints", subtitle: "Physical and business limits", icon: "lock" },
      ],
    },
  ],
  transitions: [
    { from: 0, to: 1, label: "cannot fully describe reality" },
    { from: 1, to: 2, label: "must be actively discovered" },
  ],
  callout: {
    text: "Today's bottleneck is not model capability — it's your ability to clarify unknowns.",
    icon: "fire",
  },
});

// CLI expects .toDocument() on the default export
export default {
  toDocument: () => doc,
  toJSON: () => JSON.stringify(doc, null, 2),
};
```

- [ ] **Step 2: Update `tests/run_golden.sh` to include narrative test**

Add new test phase after the existing architecture test in `tests/run_golden.sh`. The script runs JS test files and compares output against expected.

Add a section that:
1. Runs `node dist/cli.js run tests/input/narrative_framework.js -o /tmp/narrative-framework.excalidraw -t sketchy`
2. Compares against `tests/expected/narrative-framework.excalidraw`

```bash
# ── Narrative Framework Test ──
echo ""
echo "--- Narrative Framework ---"
node dist/cli.js run tests/input/narrative_framework.js -o /tmp/narrative-framework.excalidraw -t sketchy

# Count elements using Node.js ESM (not require)
SECTION_COUNT=$(node --input-type=module -e "
  import { readFileSync } from 'fs';
  const d = JSON.parse(readFileSync('/tmp/narrative-framework.excalidraw', 'utf-8'));
  const frames = d.elements.filter(e => e.type === 'rectangle' && e.strokeStyle === 'dashed');
  console.log(frames.length);
")
CARD_COUNT=$(node --input-type=module -e "
  import { readFileSync } from 'fs';
  const d = JSON.parse(readFileSync('/tmp/narrative-framework.excalidraw', 'utf-8'));
  const rects = d.elements.filter(e => e.type === 'rectangle' && e.strokeStyle !== 'dashed' && e.width >= 120);
  console.log(rects.length);
")
ARROW_COUNT=$(node --input-type=module -e "
  import { readFileSync } from 'fs';
  const d = JSON.parse(readFileSync('/tmp/narrative-framework.excalidraw', 'utf-8'));
  const arrows = d.elements.filter(e => e.type === 'arrow');
  console.log(arrows.length);
")

echo "Sections: $SECTION_COUNT (expected ≥ 3)"
echo "Cards: $CARD_COUNT (expected ≥ 6)"
echo "Arrows: $ARROW_COUNT (expected ≥ 2)"

if [ "$SECTION_COUNT" -lt 3 ]; then echo "FAIL: too few sections"; exit 1; fi
if [ "$CARD_COUNT" -lt 6 ]; then echo "FAIL: too few cards"; exit 1; fi
if [ "$ARROW_COUNT" -lt 2 ]; then echo "FAIL: too few arrows"; exit 1; fi

echo "PASS: narrative-framework"
cp /tmp/narrative-framework.excalidraw tests/expected/narrative-framework.excalidraw
```

- [ ] **Step 3: Add exports to `src/index.ts`**

After the existing exports (line 51):

```ts
// Recipe system — template-driven diagram generation
export { renderFromRecipe, loadTemplate } from "./recipe.js";
export type { TemplateConfig, RecipeSlots, NarrativeSlots, Archetype } from "./recipe_types.js";
```

- [ ] **Step 4: Build and run golden tests**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

```bash
npm run test 2>&1
```

Expected: all golden tests pass, including new narrative-framework test.

- [ ] **Step 5: Commit**

```bash
git add tests/input/narrative_framework.js tests/expected/narrative-framework.excalidraw tests/run_golden.sh src/index.ts
git commit -m "feat: export recipe system + add narrative-framework golden test"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| TemplateSchema types (TemplateConfig, RecipeSlots) | Task 1 |
| Role colors in ThemeConfig + tokens.yaml | Task 2 |
| renderFromRecipe() entry point | Task 3 |
| loadTemplate() — YAML frontmatter parser | Task 3 |
| validateSlots() — schema validation | Task 3 (recipe_validate.ts) |
| Role color resolution in Diagram | Task 4 |
| First Recipe template (narrative-framework) | Task 5 |
| Thinned SKILL.md (< 40 lines) | Task 6 |
| Export new surface from index.ts | Task 7 |
| Golden test — narrative concept diagram | Task 7 |
| Template frontmatter versioning (`schema_version: 1`) | Task 3, Task 5 |
| renderFromRecipe is additive (doesn't replace existing APIs) | All tasks (new files only) |

**Not in this plan** (deferred to follow-up plans):
- Other archetype slot types (FlowSlots, TopologySlots, etc.)
- Narrative layout engine as standalone engine (uses inline logic in _renderNarrative)
- Existing template migration to recipe format (5 templates)
- Auto-sizing (pipeline expansion Phase 3)
- Scene Graph as explicit intermediate representation (uses Diagram API directly)
