# Pipeline Expansion: Content → Structure → Components → Layout → Normalize+Theme

**一句话：** ec-draw 要从「画形状的工具」升级为「表达概念的结构化渲染器」——架构上补 Scene Graph + Semantic Components + Archetype Layout 三层；模板上从代码示例升级为带 slot、层次规则、验收清单的 Pattern Recipe。`components.ts` 已经暗示了正确方向，下一步是把它从孤立文件变成整个系统的中心，而不是继续扩展 `addBox`。

**Goal:** Expand ec-draw's pipeline from `Layout → Normalize → Theme` to a
5-layer chain that separates *what* a diagram says from *how* it looks.

**Branch:** main  
**Date:** 2026-07-05

---

## Target Pipeline

```
Content (说什么 — pure data, no coordinates)
    ↓
Structure (怎么组织 — archetype, narrative flow)
    ↓
Components (用什么元件 — Card, Section, Transition, Callout)
    ↓
Layout (按 archetype 选引擎 — grid / dagre / custom)
    ↓
Normalize + Theme (视觉统一 — semantic roles, not palette cycling)
    ↓
.excalidraw
```

Each layer is independently testable and reusable.

---

## Layer 1: Content — 内容与布局分离

Content files are pure JSON in `content/`. No coordinates, no colors, no x/y.

**Schema sketch:**

```json
{
  "title": "MAP vs TERRITORY",
  "sections": [
    {
      "role": "map",
      "heading": "MAP — Your mental model",
      "subtitle": "What you think the world is",
      "items": [
        { "title": "Prompt", "subtitle": "What you ask the model", "icon": "document" },
        { "title": "Context", "subtitle": "What the model remembers", "icon": "brain" }
      ]
    },
    {
      "role": "territory",
      "heading": "TERRITORY — The real world",
      "subtitle": "What actually exists",
      "items": [
        { "title": "Codebase", "subtitle": "Real files and logic", "icon": "code" },
        { "title": "Constraints", "subtitle": "Physical and business limits", "icon": "lock" }
      ]
    }
  ],
  "transitions": [
    { "from": "map", "to": "unknowns", "label": "cannot fully describe reality" },
    { "from": "unknowns", "to": "territory", "label": "must be discovered" }
  ],
  "callout": {
    "icon": "fire",
    "text": "Today's bottleneck is not model capability — it's your ability to clarify unknowns."
  }
}
```

**Design rules:**
- Content only describes *slots*, never positions
- Same content can render in `sketchy`, `professional`, any theme
- Same content can render in different languages (swap the JSON)
- Content files live at `content/*.json` (e.g. `content/map-territory.en.json`)

---

## Layer 2: Structure — Diagram Archetype

A new concept *above* the current `type` field. Archetype describes the **narrative
structure**, not the topology.

| Archetype   | Structure Pattern                     | Typical Use                          |
|-------------|---------------------------------------|--------------------------------------|
| `flow`      | DAG, LR/TB                            | Process, decision tree               |
| `topology`  | Mesh / layered grid                   | Architecture, service diagram        |
| `pipeline`  | Linear stages                         | Data flow, CI/CD                     |
| `narrative` | Vertical sections + internal grid + transition arrows | Concept, framework, mental model |
| `comparison`| 2 columns + bottom conclusion         | Pro/Con, A vs B, Before/After        |

**Key insight:** `map-territory` is a `narrative` archetype. Forcing it into
`flowchart` makes dagre do inappropriate auto-layout. Each archetype has its own
layout algorithm (or routing to the right engine).

**Current → Target mapping:**

| Current `type`       | Archetype   | Engine      |
|----------------------|-------------|-------------|
| `flowchart`          | `flow`      | dagre       |
| `sequence`           | `flow`      | sequence    |
| `architecture`/`arch`| `topology`  | grid        |
| `pipeline`/`workflow`| `pipeline`  | pipeline    |
| *(new)*              | `narrative` | narrative*  |
| *(new)*              | `comparison`| comparison* |

\* new layout engines to build

---

## Layer 3: Components — 一等公民 API

Upgrade `components.ts` from internal helpers to public, semantic building blocks.
Each component returns `{ elements, primary, bounds }` for layout and arrow routing.

| Component    | Map-Territory Element | API                                                      |
|--------------|-----------------------|----------------------------------------------------------|
| **Card**     | Prompt / Codebase box | `Card(x, y, w, h, { title, subtitle, icon, role })`      |
| **Section**  | MAP / Territory zone  | `Section(x, y, w, h, { heading, cards[], role })`        |
| **Transition**| Labeled arrow        | `Transition(fromSection, toSection, { label })`          |
| **Callout**  | Bottom insight        | `Callout(x, y, w, { icon, text, role })`                 |
| **BulletBlock**| Unknowns list       | `BulletBlock(x, y, w, { items[], role })`               |

**Evolutions from existing code:**
- `ProcessBox` → `Card` (add subtitle line, icon slot, role-based color)
- `Annotation` → `Callout` (full-width bar + emphasis styling)
- `addBox` → `Section` (add heading, internal child grid, role-based color)

**Public surface:** `import { Card, Section, Transition, Callout, BulletBlock } from "ec-draw"`

---

## Layer 4: Semantic Theme — 语义色，不是装饰色

Current approach: `shapes[]` is a palette, colors cycle via `_colorIdx++`.

Target: Components request color by **role**, not by index.

```ts
// New ThemeConfig field
interface ThemeConfig {
  // ...existing fields...
  roles?: {
    [roleName: string]: [string, string]; // [stroke, background]
  };
}

// Default role palette (used when tokens.yaml has no roles defined)
const DEFAULT_ROLES = {
  map:       ["#2563EB", "#DBEAFE"], // blue
  unknown:   ["#D97706", "#FEF3C7"], // amber
  territory: ["#059669", "#D1FAE5"], // green
  callout:   ["#D97706", "#FEF3C7"], // amber muted
  muted:     ["#9CA3AF", "#F3F4F6"], // neutral gray
};
```

**Design rules:**
- ≤ 5 semantic colors total
- Role colors live in `design-tokens/tokens.yaml` under a new `roles:` section
- `token_compiler.ts` compiles them into `ThemeConfig.roles`
- Components pick `stroke/bg` by `role`, not by `_colorIdx++`
- Reusable across any concept diagram: Map/Territory, Before/After, Problem/Solution

---

## Templates → Pattern Recipes (模板族)

Current `templates/*.md` files are copyable TS snippets. Upgrade each to a
**Recipe** — a structured pattern that tells AI *what information to collect*
before it writes code.

Templates cover a **family of diagrams within an archetype**, not just one
layout. The `narrative` archetype alone spawns 3 templates differentiated by
structure, not style:

| Template | Archetype | Relationship to map-territory |
|----------|-----------|-------------------------------|
| `narrative-framework.md` | `narrative` | Generalization: N vertical sections with transition arrows |
| `layered-explainer.md` | `narrative` | Single topic, depth-increasing layers (concept → detail) |
| `before-after-gap.md` | `narrative` (3-section) | Abstracted Map/Gap/Territory — Problem → Gap → Solution |
| `comparison.md` | `comparison` | Existing whiteboard prototype, needs recipe + golden reference |
| `architecture.md` | `topology` | Keep existing, but nodes upgrade to Card |
| `flowchart.md` | `flow` | Keep existing |

**Key principle:** Templates teach AI *which slots to fill* and *what hierarchy
rules to obey*, not just `addBox` syntax.

**Recipe structure:**

```markdown
# Narrative / Layered Concept Template

## When to use
- Framework explanation, mental model, Before/After, Problem→Gap→Solution

## Information slots (required)
- [ ] document.title
- [ ] 2–4 sections, each with heading + 1–6 items
- [ ] 1 transition label per section boundary
- [ ] optional footer callout

## Visual hierarchy
1. Document title (28px, standalone text)
2. Section heading (inside or above container)
3. Item title (16px) + subtitle (12–13px, muted)
4. Transition label (14px, on arrow)

## Layout rules
- Direction: TB (override AGENTS "LR preferred" for this archetype)
- Section internal: grid cols = min(itemCount, 3)
- Max 5 semantic colors by role

## Anti-patterns
- ❌ Flat addBox list, no sections
- ❌ Color cycling by add order
- ❌ Single-line label cramming title+subtitle
- ❌ Arrows without narrative labels

## Golden reference
→ tests/expected/narrative-concept.excalidraw
```

---

## Unifying Two Entry Points: Internal Scene Graph

Current problem: Diagram API and JSON descriptor are **parallel worlds**,
producing inconsistent quality.

```
Current (divergent):
  JSON descriptor ──→ renderDiagram() ──→ layout → shapes → .excalidraw
  Diagram API     ──→ addBox/addArrow  ──→ grid  → shapes → .excalidraw

Target (convergent):
  Content JSON ──→ parse
  Diagram API   ──→ addSection/addCard ──→ Internal Scene Graph
                                              │
                                              ├─→ Component renderer (shared)
                                              ├─→ Layout engine (per archetype)
                                              └─→ Normalize + Theme
                                                   │
                                                   └─→ .excalidraw
```

**Internal Scene Graph** is the single intermediate representation:

```ts
interface SceneGraph {
  title?: string;
  sections: SectionNode[];       // visual groupings
  transitions: TransitionEdge[]; // labeled connections
  callout?: CalloutNode;         // optional footer
}

interface SectionNode {
  id: string;
  role: string;                  // semantic role for color
  heading: string;
  subtitle?: string;
  cards: CardNode[];             // items inside this section
}

interface CardNode {
  title: string;
  subtitle?: string;
  icon?: string;
}
```

**Three entry points, same output quality:**

| User | Entry | Example |
|------|-------|---------|
| AI / Agent | Write JSON content + pick archetype | `renderFromRecipe("narrative", contentJson)` |
| Power user | Diagram API with semantic methods | `d.addSection("map", { heading, cards })` |
| Scripts | Thin wrapper over content file | `renderFromRecipe("narrative", JSON.parse(fs.readFileSync("content/map-territory.en.json")))` |

**Result:** `scripts/map_territory.ts` becomes a **thin wrapper** over a
content file — no more hand-coding layout per diagram.

---

## Quality Tiers: Definition of Done (验收清单)

Encoded in templates and golden tests. A "reference-quality" diagram must
satisfy all checklist items.

### Structure
- [ ] Has a `document.title` (standalone text, 24–28px)
- [ ] Has ≥ 2 visual sections (framed or clearly grouped)
- [ ] Key nodes have either an icon or a shape that conveys semantic meaning

### Text
- [ ] Each node has ≥ 2 layers of information (title + subtitle, or bullet list)
- [ ] Multi-line text does not overflow (depends on `measureText`, spec already exists)

### Narrative
- [ ] Every section boundary has a **labeled transition** (never a silent arrow)
- [ ] Optional footer callout for the key insight

### Visual
- [ ] ≤ 5 semantic colors; same color = same meaning across the diagram
- [ ] Uses sketchy theme + 120px margin
- [ ] No severe overlaps (verified by golden test or element bounds check)

### Golden Test — not byte comparison

Golden tests do NOT diff raw JSON bytes. Instead they verify **element roles**:
- How many sections? (≥ N)
- How many cards? (≥ M)
- How many labeled transitions? (≥ K)
- Does every section have a role color (not a palette index)?
- Are all boundElements resolved (no orphan text)?
- Is the viewport margin ≥ 120px?

---

## Implementation Sequence

按 **复用面 × 解锁能力** 排序。每步独立可交付，后一步建立在前一步之上。

### Phase 1: 接通 Components → Diagram API

**最大杠杆，已有代码基础。** 把 `components.ts` 的 ProcessBox/Annotation/DecisionBox
升级并暴露到 Diagram 公开 API。

- `Diagram.addCard(name, { title, subtitle, icon, role })` — ProcessBox 升级版
- `Diagram.addSection(name, { heading, subtitle, cards[], role })` — 新语义方法
- `Diagram.addCallout(name, { icon, text, role })` — Annotation 升级为全宽条
- `Diagram.addTransition(from, to, { label })` — 取代裸 arrow，自带叙事标签

**交付物:** `Card`、`Section`、`Callout`、`Transition` 四件套可通过 Diagram API 使用。

### Phase 2: Semantic Roles in Theme

**解锁所有概念图的配色档次。** 不改现有 `shapes[]` 循环逻辑，新增 `roles` 字段。

- `tokens.yaml` 加 `roles:` section（5 种语义色）
- `ThemeConfig` 加 `roles?: Record<string, [string, string]>`
- `token_compiler.ts` 编译 roles
- Components 按 `role` 取色，替代 `_colorIdx++`

**交付物:** 同一张图内 Map=蓝、Territory=绿、Unknowns=amber，不再按添加顺序轮询。

### Phase 3: measureText + Auto Box Sizing

**解锁 subtitle / bullet 多行文本。** Spec 已批准（`2026-07-05-auto-size-multiline-text.md`）。

- Card 根据 title + subtitle 自动计算宽高
- BulletBlock 根据 item 数量自动撑高
- 多行文本不溢出

**交付物:** 组件不再需要手动 `width`/`height`，内容驱动尺寸。

### Phase 4: Narrative Layout Engine

**垂直 section stack + 内部 grid。** 为 `narrative` archetype 写专用布局，不借用 dagre。

- Section 垂直堆叠（TB 方向）
- Section 内部 items 按 `min(itemCount, 3)` 列排布
- Transition 箭头在 section 之间自动路由
- Callout 固定在底部

**交付物:** `routeLayout("narrative", ...)` 返回正确的 positions。

### Phase 5: Content Schema + renderFromRecipe()

**AI 与脚本的统一入口。** 定义 Content JSON schema，实现 Scene Graph 中间表示。

- Content JSON schema（Layer 1）
- Scene Graph 类型定义（SectionNode, CardNode, TransitionEdge, CalloutNode）
- `renderFromRecipe(archetype, contentJson)` — 端到端入口
- `Diagram` API 内部走同一 Scene Graph（addSection/addCard 构建 Scene Graph）

**交付物:** `scripts/map_territory.ts` 变成 content JSON 的 thin wrapper。

### Phase 6: Template Recipes + Golden Examples

**把质量档位固化给 Agent。** 重写 templates 为 Recipe 格式，建立 golden test。

- 6 个模板 recipe（narrative-framework, layered-explainer, before-after-gap, comparison, architecture, flowchart）
- `tests/expected/narrative-concept.excalidraw` 作为 golden reference
- 角色级断言（section 数量、card 数量、labeled transition 数量、role 颜色是否使用）

**交付物:** AI 读 recipe → 填 slot → 生成参考图级输出，质量可验证。

---

## 优先级纪律

❌ **不要先做:** cloud shape、下划线、渐变、多字体、自定义图标等视觉细节。

参考图的「高级感」来自四个元件的组合，不是来自装饰：

```
Section (分区外框)
    └── Card × N (title + subtitle + icon + role 色)
              ↓
         Transition (带叙事 label 的箭头)
              ↓
         Callout (底部洞见条)
```

把这四件套做对，任何概念图都自然有档次。其他都是噪声。

---

## Constraints

- Existing `Diagram` API public signatures unchanged; new methods are additive (`addSection`, `addCard`, `addCallout`, `addTransition`)
- `renderDiagram` stays backward-compatible; new entry is `renderFromRecipe`
- All 4 existing layout engines preserved; router extended not replaced
- Theme system extended (`roles` field added), not rewritten
- Output format stays `.excalidraw` (Excalidraw element schema)
- Internal Scene Graph is the single intermediate representation for all entry points
- Phases 1–6 deliver in order; each is independently mergeable, no monolithic PR
