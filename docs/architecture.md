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
│ Diagram API 或 JSON 描述      │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│ diagram.ts   │ │ render.ts    │
│ Diagram API  │ │ JSON → 元素  │
│ addBox/Arrow │ │ renderDiagram│
└──────┬───────┘ └──────┬───────┘
       │                │
       └───────┬────────┘
               ▼
┌─────────────────────────────┐
│ layout/router.ts            │
│ routeLayout(type, nodes,    │
│   edges, opts)              │
│   ├── dagreLayout()         │
│   ├── gridLayout()          │
│   └── pipelineLayout()      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ normalize.ts                │
│   ├── createElement() 工厂  │
│   └── normalize() 风格统一   │
└──────────────┬──────────────┘
               │
               ▼
       📄 .excalidraw 文件
```

## 模块职责

```
src/
├── index.ts      公共 API 入口
├── diagram.ts    Diagram Builder API
│   ├── addBox()             网格/手动定位的形状
│   ├── addArrow()           命名节点连线
│   ├── addText()            自由文本
│   ├── addIcon()            图标库放置
│   └── save()               输出 .excalidraw
├── render.ts     JSON → Excalidraw 渲染器
│   ├── renderDiagram()      主入口
│   ├── buildShape()         形状构建
│   ├── buildArrow()         箭头构建
│   └── buildSequence()      序列图渲染
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
└── cli.ts        CLI 入口 (ec-draw run/render)
```

## 两条使用路径

### 路径 1：Diagram API（编程控制）

```
开发者 → new Diagram() → addBox/addArrow → .excalidraw
```

优势：完全编程控制、可嵌入工具链

### 路径 2：JSON 描述（声明式）

```
开发者 → renderDiagram({type, nodes, edges}) → layout → .excalidraw
```

优势：声明式、自动布局、适合 AI 生成

## 设计原则

- `render.ts` 使用 layout router 自动布局，不手写坐标
- `normalize.ts` 在主题应用前运行，主题是纯颜色/风格映射
- `diagram.ts` 独立于 render，通过命名节点 (_named Map) 关联
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

### 新增图表类型（JSON 描述）

1. 在 `render.ts` 中添加对应的 build 函数（如 `buildMindMap()`）
2. 在 `layout/router.ts` 的 ROUTES/ENGINE 表中添加路由
3. 在 `renderDiagram()` 的分发逻辑中添加识别
