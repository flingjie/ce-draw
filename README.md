# ec-draw

通过 AI 生成高质量 Excalidraw 手绘风格图表。将 Mermaid 语法转换为主题化的 `.excalidraw` 文件。

## 对话方式使用

**Codex / Claude Code 中直接说：**

> "画一个用户登录的流程图，包含验证和错误处理"

AI 会自动：
1. 生成 Mermaid 语法
2. 调用 `npx tsx scripts/render.ts` 渲染
3. 返回 `.excalidraw` 文件

**或者用 Mermaid 语法：**

> "用 flowchart TD 画：Login → Valid? → {Yes} Dashboard / {No} Error → Login"

**架构图：**

> "画一个三层架构：CDN → Load Balancer → 3 个 Web Server → API Server → PostgreSQL + Redis"

## 安装

```bash
npm install ec-draw
```

## CLI

```bash
npx tsx scripts/render.ts -i diagram.mmd -o output.excalidraw -t sketchy
echo "flowchart TD\n  A[开始] --> B[结束]" | npx tsx scripts/render.ts -o flow.excalidraw
```

## 主题

| 主题 | 风格 | 适用场景 |
|------|------|----------|
| `sketchy` | 手绘、暖色调 | 头脑风暴 |
| `professional` | 干净线条、蓝灰色系 | 架构文档 |
| `dark` | 暗色背景、霓虹色 | 终端展示 |
| `colorful` | 明亮原色 | 教学演示 |

## 支持的图表类型

| 类型 | Mermaid 语法 | 示例 |
|------|-------------|------|
| 流程图 | `flowchart TD/LR` | 决策树、流程 |
| 序列图 | `sequenceDiagram` | API 交互 |
| ER 图 | `erDiagram` | 数据模型 |
| 类图 | `classDiagram` | UML |

## 项目结构

```
ec-draw/
├── SKILL.md              Skill 定义
├── scripts/render.ts     渲染入口
├── src/                  TypeScript 库
│   ├── mermaid.ts        Mermaid 解析 + dagre 布局
│   ├── diagram.ts        Diagram Builder API
│   ├── normalize.ts      风格统一
│   ├── themes.ts         4 套主题
│   └── library.ts        图标库
├── templates/            Prompt 模板
├── references/           Mermaid/excalidraw 格式参考
├── examples/             示例 .excalidraw 文件
└── library/              图标预设
```

## 文档

- [架构说明](docs/architecture.md) — 数据流、模块设计、扩展指南
- [API 参考](docs/api.md) — 完整 API 文档（mermaidToExcalidraw / Diagram / 主题 / 图标）

## License

MIT
