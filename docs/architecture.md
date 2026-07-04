# ec-draw 架构

## 数据流

```
用户自然语言: "画一个登录验证的流程图"
        │
        ▼
┌─────────────────────────────┐
│ SKILL.md 触发                │
│ 匹配: 画/流程图/diagram      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ AI 读 templates/ 后生成       │
│ Mermaid 语法                 │
│                             │
│ flowchart TD                │
│   A[Login] --> B{Valid?}    │
│   B -->|Yes| C[Dashboard]   │
│   B -->|No| D[Error]        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ mermaid.ts                  │
│                             │
│ parseMermaid(text)          │
│   ├── parseFlowchart()      │
│   ├── parseSequence()       │
│   ├── parseErOrClass()      │
│   └── → ParsedDiagram       │
│                             │
│ runDagreLayout(nodes,edges) │
│   └── dagre 布局 (x,y)       │
│                             │
│ buildShape / buildArrow     │
│   └── createElement() 工厂  │
│                             │
│ normalize(elements, theme)  │
│   └── 统一 roughness/颜色    │
└──────────────┬──────────────┘
               │
               ▼
       📄 .excalidraw 文件
```

## 模块职责

```
src/
├── index.ts      公共 API 入口
├── mermaid.ts    Mermaid 解析 + dagre 布局 + 渲染
│   ├── parseMermaid()       语法解析（流程图/序列/ER/类图）
│   ├── runDagreLayout()     自动布局计算
│   ├── buildShape()         形状构建（矩形/菱形/椭圆）
│   ├── buildArrow()         箭头构建 + 路由
│   └── mermaidToExcalidraw() 主入口
├── diagram.ts    Diagram Builder API
│   ├── addBox()             网格布局的形状
│   ├── addArrow()           命名节点连线
│   ├── addText()            自由文本
│   ├── addIcon()            图标库放置
│   └── save()               输出 .excalidraw
├── normalize.ts  风格统一 + 元素工厂
│   ├── createElement()      唯一元素构造函数
│   ├── createTextElement()  文本元素构造
│   ├── normalizeElement()   单元素风格应用
│   └── normalize()          批量风格统一
├── themes.ts     4 套视觉主题
│   ├── sketchy        手绘 / 暖色 / Virgil 字体
│   ├── professional   干净 / 蓝灰 / Helvetica 字体
│   ├── dark           暗色 / 霓虹 / Virgil 字体
│   └── colorful       明亮 / 原色 / Virgil 字体
├── library.ts    图标库
└── cli.ts        CLI 入口 (ec-draw mermaid <file>)
```

## 两条使用路径

### 路径 1：Skill 模式（Codex / Claude Code）

```
用户 → SKILL.md 触发 → AI 读 templates/ → 生成 Mermaid
→ npx tsx scripts/render.ts → .excalidraw
```

优势：自动布局、无需手写代码

### 路径 2：API 模式（直接调用）

```
开发者 → import { mermaidToExcalidraw } → .excalidraw
开发者 → new Diagram() + addBox/addArrow → .excalidraw
```

优势：完全编程控制、可嵌入工具链

## 设计原则

- `mermaid.ts` 是核心，布局逻辑不随意改动
- `normalize.ts` 在主题应用前运行，主题是纯颜色/风格映射
- `diagram.ts` 独立于 Mermaid，通过命名节点 (_named Map) 关联
- `library.ts` 只增加不修改现有图标 ID
- `themes.ts` 纯声明式，无逻辑，只有颜色映射
- `createElement()` 是所有元素的唯一构造入口

## 扩展指南

### 新增主题

1. 在 `themes.ts` 中添加新的 ThemeConfig
2. 确保 shapes 数组有 5 组颜色（用于循环配色）
3. 在 `normalize.ts` 的 `normalizeElement()` switch 中添加类型（如有新类型）

### 新增图标

1. 在 `library.ts` 的 `ICONS` 对象中添加新条目
2. 使用 `icon(w, h, renderFn)` 工厂函数
3. `renderFn` 接收 (x, y, stroke, bg) 返回元素数组

### 新增 Mermaid 类型

1. 在 `mermaid.ts` 中添加 `parseXxx()` 函数
2. 返回符合 `ParsedDiagram` 接口的数据结构
3. 在 `parseMermaid()` 的分发逻辑中添加识别
4. 在 `mermaidToExcalidraw()` 中添加对应的渲染分支
