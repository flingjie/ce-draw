# Skill + Template Schema + Library — 三层解耦设计

**Date:** 2026-07-05
**Status:** draft
**Branch:** main

## 问题

ec-draw 当前是"skill + npm 库"二合一形态，但 skill 和库之间的耦合点选错了——模板文件包含具体的 Diagram API 代码示例，导致 API 签名任何微调都会让所有模板示例作废。同时随着 pipeline expansion spec 的 5 层架构落地，项目复杂度在增长，需要一个"复杂度跟变化频率对齐"的架构拆分。

## 三元架构

```
┌─ Skill (SKILL.md) ────────────────────────────────────┐
│ 职责：告诉 AI 工作流——选模板 → 填 slot JSON → 调库渲染    │
│ 厚度：极薄（< 20 行核心指令）                              │
│ 变化频率：几乎不变                                         │
│ 耦合：只耦合到"模板目录路径"和"renderFromRecipe 函数名"     │
└───────────────────────────────────────────────────────┘
                         │
                         ▼
┌─ Templates (templates/*.md) ──────────────────────────┐
│ 职责：定义每个图表类型的——                                  │
│   - 网格坐标系（cols, cellW, gapX...）                      │
│   - 角色色映射（role → semantic meaning → color key）       │
│   - Slots（AI 需要填什么信息）                              │
│   - 结构规则（Section > Card, Transition 必带 label）       │
│   - 反模式清单                                             │
│ 厚度：中等（每个模板 50-100 行 markdown + frontmatter）      │
│ 变化频率：加新图表类型时新增，现有模板偶尔微调                  │
│ 耦合：只耦合到 TemplateSchema（frontmatter 字段格式）         │
└───────────────────────────────────────────────────────┘
                         │
                         ▼
┌─ npm 库 (src/) ───────────────────────────────────────┐
│ 职责：所有重逻辑                                           │
│   - renderFromRecipe() — 读模板+slot → 调 Diagram API    │
│   - Diagram API — addBox/addCard/addSection/...          │
│   - Components — Card, Section, Callout, Transition      │
│   - Layout engines — dagre, grid, pipeline, narrative    │
│   - Themes, normalize, token_compiler                    │
│   - Scene Graph（未来）                                   │
│ 厚度：厚                                                  │
│ 变化频率：最高（功能开发的主战场）                            │
│ 耦合：库内部耦合，对外暴露稳定的函数签名                       │
└───────────────────────────────────────────────────────┘
```

## 核心解耦：Template ↔ 库之间插入 Schema 层

### 当前耦合（紧）

```
Template ─── 内含 Diagram API 代码示例 ───→ addCard 签名
                                            addSection 签名
                                            addTransition 签名
                                            constructor opts
```

每个 API 签名变化 → 所有模板代码示例作废 → AI 读到过期示例 → 生成错误代码。

### 目标耦合（松）

```
Template ─── 定义 slots + 约束（frontmatter）───→ TemplateSchema（stable）
                                                      │
                                                      ▼
                                               renderFromRecipe()
                                               （库内部调 Diagram API，
                                                API 怎么变在这里吸收，
                                                模板看不见）
```

**耦合点从"库的 HOW"变成"模板的 WHAT"。** Section/Card/Transition/role 的概念不会因为 addCard 参数变化而变。

### Role 色解析链

模板 frontmatter 的 `roles` 字段写的是**色键**（color key），不是 hex 值：

```
roles:
  primary: slate       ← 色键，引用 tokens.yaml 的 colors 段落
  secondary: moss
  gap: brown
  callout: amber
```

解析链：

```
Template frontmatter roles.primary = "slate"
    │
    ▼
tokens.yaml colors.slate = ["#1E3A5F", "#B8D4F0"]
    │
    ▼
token_compiler 编译为 ThemeConfig.roles["primary"] = [stroke, bg]
    │
    ▼
Component 按 roleName 取色 → 替代 _colorIdx++ 循环
```

**为什么多这一层？** 同一 role 在不同主题下需要不同配色——`slate` 在 sketchy 主题下是暖灰，在 dark 主题下应该用亮色。色键不变，tokens.yaml 按主题换色值。模板不感知主题差异。

## Template 文件格式

### Frontmatter（machine-readable，库可校验）

```yaml
---
id: narrative-framework
archetype: narrative
description: N visual sections with labeled transition arrows
grid:
  cols: 3
  cellW: 160
  cellH: 80
  gapX: 50
  gapY: 60
direction: TB
roles:
  primary: slate      # hex resolved from tokens.yaml
  secondary: moss
  gap: brown
  callout: amber
---
```

### Body（human/AI-readable，指导 AI 填 slot）

```markdown
# Narrative / Framework

## Slots

### title (required)
Diagram title — standalone text, 24–28px.

### sections (2–4 required)
Each section:
- `heading: string` (required)
- `subtitle: string` (optional)
- `role: "primary" | "secondary" | "gap"` (required)
- `items: Item[]` (1–6 required, each: title, subtitle?, icon?)

### transitions (required)
One per section boundary:
- `from: sectionIndex, to: sectionIndex`
- `label: string` (required — narrative arrows need labels)

### callout (optional)
- `text: string`
- `icon: string` (optional, from built-in icon library)

## Layout Rules
- Sections stack vertically, each full width (span: grid.cols)
- Cards within a section: grid of min(itemCount, 3) columns
- Card width: 1 column (cellW), height: cellH
- Transitions: **AI 指定 from/to section index + label**，库负责计算箭头端点坐标和路由
- Callout: full-width bar below last section

## Anti-patterns
- ❌ Flat card list without sections
- ❌ Color defined by add-order instead of role
- ❌ Silent arrows (transition without label)
- ❌ More than 4 role colors in one diagram
```

## 库的新入口

```ts
// 读模板 → 校验 slot → 调 Diagram API → 返回 ExcalidrawDocument
function renderFromRecipe(
  templateId: string,
  slots: RecipeSlots,
  theme?: string
): ExcalidrawDocument

// RecipeSlots 按 archetype 有不同的 slot 结构：
//
// narrative:
//   { title?, sections: [{ heading, subtitle?, role, items: [{ title, subtitle?, icon? }] }],
//     transitions: [{ from, to, label }], callout?: { text, icon? } }
//
// flow (flowchart/sequence/er/class):
//   { nodes: [{ id, label, shape? }], edges: [{ from, to, label? }], direction? }
//
// topology (architecture):
//   { title?, groups: [{ heading, role, nodes: [{ title, subtitle?, icon? }] }],
//     edges: [{ from, to, label? }] }
//
// comparison:
//   { title?, left: { heading, items[] }, right: { heading, items[] },
//     conclusion?: { text } }
//
// pipeline:
//   { stages: [{ title, subtitle?, icon? }], transitions: [{ from, to, label? }] }

type RecipeSlots = NarrativeSlots | FlowSlots | TopologySlots | ComparisonSlots | PipelineSlots;
```

### 内部实现流程

```
renderFromRecipe(templateId, slots, theme)
  │
  ├─ 1. loadTemplate(templateId) → { grid, roles, archetype, direction }
  │
  ├─ 2. validateSlots(slots, template) → ok / error with path
  │
  ├─ 3. 构建 Scene Graph（SectionNode[], TransitionEdge[], CalloutNode?）
  │
  ├─ 4. 按 archetype 选 layout engine:
  │      narrative → narrativeLayout(sections, transitions, callout, grid)
  │
  ├─ 5. Map layout positions → Component 调用:
  │      Section(x, y, w, h, heading, stroke, bg, theme)
  │      Card(x, y, w, h, title, stroke, bg, theme, { subtitle, icon })
  │      Transition(from, to, label)
  │      Callout(x, y, w, text, stroke, bg, theme, { icon })
  │
  └─ 6. ExcalidrawDocument (normalized + themed)
```

## AI 工作流

### AI 管什么、库管什么

| 关注点 | AI 负责 | 库负责 |
|--------|---------|--------|
| 图表内容（title, heading, subtitle, label） | ✅ 根据用户需求填写 | — |
| 图标选择（icon: "cloud" vs "lock"） | ✅ 根据语义选择 | — |
| 结构组织（几个 section，哪个 card 属于哪个 section） | ✅ 根据叙事逻辑 | — |
| 网格参数（cols, cellW, gapX） | — | ✅ 模板 frontmatter 提供默认值 |
| 元素坐标（x, y, w, h） | — | ✅ 库根据 grid + archetype layout engine 计算 |
| 箭头端点计算和路由 | — | ✅ 库根据 from/to section index 计算 |
| 颜色映射（role → hex） | — | ✅ 库根据 tokens.yaml + 主题解析 |
| 主题风格（roughness, fontFamily, roundness） | — | ✅ 库根据 theme 参数统一套用 |

**AI 控制"说什么"，库控制"怎么画"。** AI 的输入是 slot JSON（纯数据，无坐标），库的输出是完整的 ExcalidrawDocument。AI 不需要知道 Diagram API 的存在。

### 示例

```
用户: "画一个 Map vs Territory 的概念图"

AI:
  1. 读 templates/narrative.md → 理解 slots 和约束
  2. 根据用户需求，填 slot JSON
  3. 调 renderFromRecipe("narrative-framework", filledSlots, "sketchy")
  4. 写入 .excalidraw 文件

用户: "画一个微服务架构图"

AI:
  1. 读 templates/architecture.md → 理解 grid 和 role 色
  2. 填 slot JSON
  3. 调 renderFromRecipe("architecture", filledSlots, "professional")
```

## 复杂度分布（与变化频率对齐）

| 层 | 厚度 | 变化频率 | 为什么 |
|----|------|---------|--------|
| Skill | 极薄 | 几乎不变 | 只做路由——"选模板，填 slot，调函数" |
| Templates | 中等 | 低频 | 加新图表类型时新增；改约束时微调 frontmatter |
| npm 库 | 厚 | 高频 | 功能开发主战场：新 component、新 layout engine、theme 扩展 |

**原则：复杂的东西让它稳定，常变的东西让它简单。** 库复杂但可以独立测试和版本管理；模板简单但经常需要新类型；skill 极简所以几乎不需要维护。

## 和 pipeline expansion spec 的关系

本设计是 pipeline expansion spec 的补充而非替代：

| Spec Phase | 本设计的对应 |
|-----------|------------|
| Phase 1: Components API | 库内部，模板和 AI 不感知 |
| Phase 2: Role colors | 模板 frontmatter `roles` 字段 → 库解析 |
| Phase 3: Auto-size | 库内部，slot 不需要 width/height |
| Phase 4: Narrative layout | `archetype: narrative` → 库选引擎 |
| Phase 5: Scene Graph + renderFromRecipe | **本设计的核心** — renderFromRecipe 内部走 Scene Graph |
| Phase 6: Template Recipes | **本设计的模板格式** — frontmatter + slots + rules |

## Diagram API 的定位

Diagram API (`new Diagram().addCard(...)`) **不消失**——它有两个角色：

1. **库内部实现细节**：renderFromRecipe 内部用它组装 elements
2. **Power user 路径**：需要完全自由布局时，直接写 Diagram API 代码（不走模板）

但 skill 不再教 AI 用 Diagram API。Skill 教 AI 走模板路径。

## Template 迁移路径

现有 5 个模板升级为 Recipe 格式：

| 当前 | 目标 | archetype |
|------|------|-----------|
| `templates/flowchart.md` | 代码示例 → Recipe | `flow` |
| `templates/architecture.md` | 代码示例 → Recipe | `topology` |
| `templates/sequence.md` | 代码示例 → Recipe | `flow` (sequence layout) |
| `templates/er.md` | 代码示例 → Recipe | `flow` (dagre) |
| `templates/whiteboard.md` | 代码示例 → Recipe | `comparison` |
| *(new)* | `templates/narrative-framework.md` | `narrative` |
| *(new)* | `templates/layered-explainer.md` | `narrative` |
| *(new)* | `templates/before-after-gap.md` | `narrative` |

## 约束

- `renderFromRecipe` 是新增入口，不替代 `renderDiagram` 或 `Diagram` API
- Template frontmatter 格式需要自己的版本号（`schema_version: 1`），独立于库版本
- Template body 是 markdown，AI 直接读；frontmatter 是结构化数据，库解析
- Skill 只指向模板路径和 `renderFromRecipe` 函数名——这两个不应该频繁变
