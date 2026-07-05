# API 参考

## JSON Descriptor API

### renderDiagram()

```ts
import { renderDiagram } from "ec-draw";

function renderDiagram(
  diagram: JSONDiagram,
  themeName?: string  // "sketchy" | "professional" | "dark" | "colorful" 默认 "sketchy"
): ExcalidrawDocument
```

将 JSON 描述转换为主题化的 Excalidraw 文档。内部使用 layout router 自动选择最佳布局引擎。

**示例：**

```ts
const doc = renderDiagram({
  type: "flowchart",
  direction: "TB",
  nodes: [
    { id: "A", label: "Login", shape: "rectangle" },
    { id: "B", label: "Valid?", shape: "diamond" },
    { id: "C", label: "Dashboard", shape: "rectangle" },
    { id: "D", label: "Error", shape: "rectangle" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C", label: "Yes" },
    { from: "B", to: "D", label: "No" },
  ],
}, "sketchy");

writeFileSync("flow.excalidraw", JSON.stringify(doc, null, 2));
```

### JSONDiagram 结构

```ts
interface JSONDiagram {
  type: string;         // "flowchart" | "sequence" | "er" | "class" | "pipeline" | "workflow" | "architecture" | "arch"
  direction?: "TB" | "LR" | "RL" | "BT";
  theme?: string;
  nodes: JSONNode[];
  edges: JSONEdge[];
}

interface JSONNode {
  id: string;
  label: string;
  shape?: "rectangle" | "diamond" | "ellipse" | "roundrect";
}

interface JSONEdge {
  from: string;
  to: string;
  label?: string;
}
```

**支持的 type → 布局引擎：**

| type | 引擎 | 说明 |
|------|------|------|
| `flowchart` | dagre | 流程图、决策树 |
| `sequence` | dagre + 序列叠加 | 序列图 |
| `er` | dagre | 实体关系图 |
| `class` | dagre | UML 类图 |
| `pipeline` / `workflow` | pipeline | 管线/工作流 |
| `architecture` / `arch` | grid | 架构网格图 |

---

## Diagram Builder API

### 构造函数

```ts
import { Diagram } from "ec-draw";

const d = new Diagram(theme, { cols, cellW, cellH, gapX, gapY });
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `string \| ThemeConfig` | `"sketchy"` | 主题名称或配置对象 |
| `opts.cols` | `number` | `3` | 网格列数 |
| `opts.cellW` | `number` | `160` | 单元格宽度 |
| `opts.cellH` | `number` | `80` | 单元格高度 |
| `opts.gapX` | `number` | `40` | 水平间距 |
| `opts.gapY` | `number` | `50` | 垂直间距 |

### addBox()

```ts
d.addBox(name: string, opts?: BoxOptions): ExcalidrawElement
```

添加带标签的形状。name 既是标签文字也是后续 addArrow 的引用 key。

**BoxOptions：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `row` | `number` | 自动 | 网格行 |
| `col` | `number` | 自动 | 网格列 |
| `span` | `number` | `1` | 跨列数 |
| `width` | `number` | cellW | 自定义宽度 |
| `height` | `number` | cellH | 自定义高度 |
| `shape` | `"rectangle" \| "diamond" \| "ellipse"` | `"rectangle"` | 形状 |

**示例：**

```ts
d.addBox("开始");                                          // 自动定位
d.addBox("判断?", { row: 1, col: 0, shape: "diamond" });   // 菱形
d.addBox("API 网关", { row: 0, col: 0, span: 3 });         // 跨 3 列
d.addBox("数据库", { row: 2, col: 1, height: 45 });        // 矮盒子
```

### addArrow()

```ts
d.addArrow(fromName: string, toName: string, opts?: { label?: string }): ExcalidrawElement
```

连接两个命名盒子。fromName 和 toName 必须与之前 addBox 的 name 匹配。

**示例：**

```ts
d.addArrow("API 网关", "认证服务");
d.addArrow("判断?", "处理", { label: "是" });
```

### addText()

```ts
d.addText(content: string, x: number, y: number, fontSize?: number): ExcalidrawElement
```

在指定坐标添加独立文本。

### addIcon()

```ts
d.addIcon(iconName: string, x: number, y: number, colorIndex?: number): void
```

从图标库放置一个图标。

**可用图标：** `database`, `server`, `cloud`, `user`, `gear`, `document`, `globe`, `mobile`, `lock`, `fire`, `message_queue`, `firewall`

```ts
d.addIcon("database", 200, 100, 0);  // (x, y, 颜色索引)
```

### addLibraryIcon()

```ts
d.addLibraryIcon(libraryName: string, iconName: string, x: number, y: number, colorIndex?: number): void
```

从外部 .excalidrawlib 库放置图标。

```ts
d.addLibraryIcon("google-icons", "Compute Engine", 200, 100);
d.addLibraryIcon("stick-figures", "Stick man", 300, 200);
```

### save()

```ts
d.save(filepath: string): string
```

输出 `.excalidraw` 文件。返回绝对路径。

### toDocument() / toJSON()

```ts
d.toDocument(): ExcalidrawDocument   // 返回文档对象
d.toJSON(): string                   // 返回 JSON 字符串
```

---

## 主题

```ts
import { getTheme, listThemes, THEMES } from "ec-draw";

listThemes();  // ["professional", "sketchy", "dark", "colorful"]
getTheme("sketchy");  // ThemeConfig
```

### ThemeConfig 结构

```ts
interface ThemeConfig {
  name: string;
  shapes: Array<[string, string]>;  // [描边色, 填充色] × 5
  arrow: string;                    // 箭头颜色
  text: string;                     // 文本颜色
  accent: string;                   // 强调色（frame 用）
  background: string;               // 画布背景色
  strokeWidth: number;              // 描边宽度
  roughness: number;                // 粗糙度 (0=crisp, 2=sketchy)
  roundness: { type: 1|2|3 } | null;
  fontFamily: 1 | 2 | 3 | 4 | 5;   // 1=Virgil, 2=Helvetica
  fontSize: number;
  fillStyle: "solid" | "hachure" | "cross-hatch" | "zigzag";
  strokeStyle: "solid" | "dashed" | "dotted";
}
```

---

## 图标库

```ts
import { ICONS, listIcons } from "ec-draw";

listIcons();  // ["database", "server", "cloud", "user", "gear", ...]
```

### IconDef 结构

```ts
interface IconDef {
  render: (x: number, y: number, stroke: string, bg: string) => ExcalidrawElement[];
  width: number;
  height: number;
}
```

---

## 工具函数

```ts
import { normalize, createElement, createTextElement, makeId, textWidth } from "ec-draw";

normalize(elements, theme)           // 对元素数组应用主题
createElement(type, overrides)       // 创建基础元素
createTextElement(text, x, y, fs, ff, containerId)  // 创建文本元素
makeId()                             // 生成元素 ID
textWidth(content, fontSize)         // 估算文本宽度 (CJK=1.0×, ASCII=0.6×)
```

---

## 布局引擎

```ts
import { routeLayout, dagreLayout, gridLayout, pipelineLayout, sequenceLayout } from "ec-draw";

// 自动路由
routeLayout("flowchart", nodes, edges, { direction: "TB" });

// 直接调用
dagreLayout(nodes, edges, { direction: "TB" });
gridLayout(nodes, edges, { cols: 4 });
pipelineLayout(nodes, edges, { direction: "LR" });
```
