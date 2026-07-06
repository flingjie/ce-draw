---
title: "用 AI 写一个 Excalidraw 图表生成器：ec-draw 的 Vibe Coding 实践"
date: 2026-07-06
tags: [vibe-coding, ai, excalidraw, typescript, claude-code]
---

# 用 AI 写一个 Excalidraw 图表生成器：ec-draw 的 Vibe Coding 实践

## 背景

画图是工程师的日常，但手绘风格的图表总是让人头疼。Excalidraw 提供了很棒的手绘风格，但手动拖拽效率低。我想：**能不能用代码生成 Excalidraw 图表？**

于是有了 `ec-draw` — 一个 AI 驱动的 Excalidraw 图表生成器。整个项目从 7 月 4 日到 5 日，两天时间，通过 Vibe Coding 完成。

## 什么是 Vibe Coding？

Vibe Coding 是一种与 AI 协作的编程方式：

- **你负责方向和决策**：告诉 AI 要做什么、为什么做
- **AI 负责实现**：写代码、重构、调试
- **快速迭代**：几分钟内看到结果，立即反馈调整

不是让 AI 替你思考，而是让 AI 帮你快速把想法变成现实。

## 项目目标

我想要一个工具，能够：

1. **对话式生成**：在 Codex/Claude Code 里说"画一个登录流程图"，就能生成图表
2. **多种图表类型**：流程图、架构图、序列图、ER 图
3. **主题切换**：手绘风、专业风、暗色风、彩色风
4. **编程可控**：提供 API，可以嵌入到其他工具链

## 技术栈

- **TypeScript**：类型安全，AI 生成代码更可靠
- **Excalidraw JSON Schema**：直接操作底层格式
- **dagre**：自动布局算法，不用手写坐标
- **Claude Code / Codex**：AI 协作开发环境

---

## 开发流程

### Day 1：从 0 到 1（7 月 4 日）

**第一步：明确需求**

> "我想要一个 CLI 工具，输入 JSON 描述，输出 .excalidraw 文件"

AI 立即理解了需求，开始搭建项目结构。从第一版 JS 脚本快速起步：

```
ec-draw/
├── src/
│   ├── render.ts      # JSON → Excalidraw
│   ├── themes.ts      # 4 套主题
│   ├── library.ts     # 图标库
│   └── cli.ts         # CLI 入口
```

**第二步：快速迭代**

每个功能都是这样的循环：

1. **描述需求**："添加 dagre 自动布局"
2. **AI 实现**：写出布局代码
3. **测试验证**：`node dist/cli.js render flow.json -o flow.excalidraw`
4. **反馈调整**："箭头连接点不对，应该从边缘出发"

> 第一天就产生了 5 个可运行的 golden test 输出，包括 flowchart、sequence、ER、architecture 等图表类型。

**踩坑 1：Excalidraw Schema 的细节**

第一版生成的 Excalidraw 文件打不开。原因是：

- `points` 必须是 `[number, number][]` 元组，不能是 `{x, y}` 对象
- `strokeSharpness` 已废弃，应该用 `roundness: {type: 2}`
- 文本元素的 `boundElements` 不能是 `null`，必须是空数组 `[]`

```
commit ef7276c fix: match Excalidraw element schema
  — points as tuples, remove strokeSharpness, fix roundness
```

这些细节，AI 第一次没注意到，但看到报错后立即修正了。

**踩坑 2：手写布局 vs 成熟库**

最初想手写布局算法，但效果很差 — 节点重叠、箭头混乱。改用 `dagre` 后效果立即好了很多。教训：**不要重复造轮子**，成熟的库经过大量验证。

**第三步：添加主题系统**

> "我想要 4 套主题：sketchy、professional、dark、colorful"

AI 生成了纯数据结构的 `themes.ts`，没有逻辑，只有颜色映射：

```ts
export const THEMES: Record<string, ThemeConfig> = {
  sketchy: {
    name: "sketchy",
    shapes: [
      ["#1e1e1e", "#fff3bf"],  // [描边色, 填充色] × 5 组
      ["#1e1e1e", "#d0bfff"],
      // ...
    ],
    roughness: 2,    // 手绘风格
    fontFamily: 1,   // Virgil 手绘字体
  },
  professional: { /* 干净线条、蓝灰色系、Helvetica */ },
  dark: { /* 暗色背景、霓虹色 */ },
  colorful: { /* 明亮原色 */ },
};
```

### Day 2：架构重构（7 月 5 日）

**问题暴露**

Day 1 的快速开发留下了技术债：

- `render.ts` 职责混杂，布局逻辑散落各处
- 没有统一的元素构造入口
- 多个分支并行开发，合并冲突开始出现

**重构决策**

> "把布局引擎抽离成独立模块，添加 layout router"

AI 理解了意图，一口气完成了重构：

```
src/layout/
├── dagre.ts       # dagre 自动布局（流程图、决策树）
├── grid.ts        # 网格布局（架构图）
├── sequence.ts    # 序列图布局
├── pipeline.ts    # 管线布局（CI/CD）
├── router.ts      # 布局路由器（自动分发）
├── narrative.ts   # 叙事框架布局
└── types.ts       # 统一类型定义
```

**重构三步走**

| 步骤 | Commit | 做了什么 |
|------|--------|---------|
| 提取布局引擎 | `2f184a5` | 4 个布局引擎 + router，统一 LayoutNode/LayoutEdge 类型 |
| 统一元素构造 | `ef7276c` | 所有元素通过 `createElement()` 创建，统一 normalize |
| 清理技术债 | `c487bf2` | 删除死代码、修复 import、清理 .gitignore |

**踩坑 3：多分支合并冲突**

重构时在多个 worktree 分支上并行开发，合并时出现了重复声明。AI 帮助逐个解决了冲突，最终用一个 merge commit 收拢了所有变更：

```
commit 3795a73 chore: merge all branches — consolidate Phase 1 changes
```

**踩坑 4：测试脚本的硬编码路径**

```ts
// ❌ 错误：硬编码绝对路径，换机器就挂
const ROOT = "/Users/lingjiefan/workspace/ec-draw";

// ✅ 正确：相对于脚本位置
const ROOT = path.dirname(fileURLToPath(import.meta.url));
```

**踩坑 5：Mermaid 依赖的弯路**

最初尝试通过 Mermaid 中转生成图表，但 Mermaid → Excalidraw 的转换丢失了很多手绘风格的细节。最终决定直接操作 Excalidraw JSON Schema，完全掌控输出：

```
commit 245ca96 refactor: remove mermaid pipeline, add JS/JSON render system
```

---

## 最终架构

```
用户自然语言: "画一个登录验证的流程图"
        │
        ▼
┌──────────────────────────────┐
│ SKILL.md 触发                │
│ 匹配: 画/流程图/diagram       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ AI 生成 JSON 描述或 API 脚本  │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼              ▼
  renderDiagram()  Diagram API
  (JSON 声明式)    (编程式)
        │              │
        └──────┬───────┘
               ▼
  routeLayout() 自动分发
  ├── flowchart → dagreLayout()
  ├── arch → gridLayout()
  ├── pipeline → pipelineLayout()
  └── sequence → sequenceLayout()
               │
               ▼
  normalize() → theme 着色
               │
               ▼
       .excalidraw 文件
```

### 两条使用路径

**路径 1：JSON 描述（声明式，适合 AI 生成）**

```json
{
  "type": "flowchart",
  "nodes": [
    {"id": "A", "label": "Login", "shape": "rectangle"},
    {"id": "B", "label": "Valid?", "shape": "diamond"},
    {"id": "C", "label": "Dashboard", "shape": "rectangle"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "B", "to": "C", "label": "Yes"}
  ]
}
```

**路径 2：Diagram API（编程式，适合嵌入工具链）**

```ts
const d = new Diagram("sketchy", { cols: 3 });
d.addBox("API 网关", { row: 0, col: 0, span: 3 });
d.addBox("认证服务", { row: 1, col: 0 });
d.addBox("用户服务", { row: 1, col: 1 });
d.addArrow("API 网关", "认证服务");
d.addArrow("API 网关", "用户服务");
d.save("arch.excalidraw");
```

---

## Vibe Coding 心得

### 1. 明确需求，快速迭代

**好的 prompt**：
> "添加 dagre 自动布局，节点间距 50px，箭头从节点边缘出发"

**不好的 prompt**：
> "帮我写一个布局算法"

越具体的需求，AI 生成的代码越准确。

### 2. 小步快跑，及时验证

每个功能完成后立即测试。不要等到全部写完再验证，那时问题已经堆积。项目里每个关键节点都有 golden test 保护：

```bash
npm test  # 5 golden tests pass
```

### 3. 你负责架构，AI 负责实现

**你负责**：模块划分、数据流设计、技术选型

**AI 负责**：具体实现、类型定义、调试修复

### 4. 技术债要及时还

Day 1 快速出活，Day 2 立即重构。如果拖着不还，后面的开发会越来越慢。从 commit 历史可以看到清晰的节奏：

```
Day 1: feat → feat → feat → fix → fix   （快速出活 + 修 bug）
Day 2: refactor → feat → feat → merge    （重构 + 新功能 + 收拢）
```

### 5. 不要跳过中间步骤直接让 AI 生成最终产物

中间尝试了 Mermaid 中转的方案，虽然最终被废弃，但这个过程帮助理解了 Excalidraw schema 的结构。弯路不是浪费。

---

## 踩坑总结

| 坑 | 原因 | 解决 |
|----|------|------|
| Excalidraw 文件打不开 | Schema 字段类型不对（points、roundness） | 逐个字段对照修复 |
| 节点重叠 | 手写布局算法太简单 | 改用 dagre |
| 合并冲突 | 多分支并行开发 | 及时合并，不拖太久 |
| 测试换机器就挂 | 硬编码绝对路径 | 改用 `import.meta.url` |
| Mermaid 中转丢风格 | 格式转换有损 | 直接操作 Excalidraw JSON |

---

## 项目成果

**两天时间，27 个 commit**：

| 能力 | 状态 |
|------|------|
| JSON → Excalidraw 渲染器 | done |
| Diagram Builder API | done |
| 4 套视觉主题 | done |
| 4 个布局引擎 | done |
| 12+ 内置图标 | done |
| CLI 工具 | done |
| Claude Code / Codex Skill 集成 | done |
| Golden Test 覆盖 | done |
| Recipe 模板系统 | done |

---

## 实践建议

### 什么时候用 Vibe Coding？

**适合**：快速原型验证、重复性工作、探索新技术

**不适合**：核心算法（你需要理解每一行）、性能关键路径、安全敏感代码

### 如何与 AI 高效协作？

1. **提供上下文**：告诉 AI 项目的背景、约束、目标
2. **明确需求**：越具体越好，避免模糊描述
3. **及时验证**：每个功能完成后立即测试
4. **反馈调整**：发现问题立即说，不要积累
5. **保持主导**：你负责架构和决策，AI 负责实现

---

*这篇文章的素材收集本身也是用 AI 完成的：读取项目结构、git 历史、文档，然后组织成文。*
