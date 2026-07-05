# ec-draw

通过 AI 生成高质量 Excalidraw 手绘风格图表。支持 Diagram API（编程式）和 JSON 描述（声明式）两种模式。

## 对话方式使用

**Codex / Claude Code 中直接说：**

> "画一个用户登录的流程图，包含验证和错误处理"

AI 会自动生成 Diagram API 脚本并调用 `node dist/cli.js run` 渲染。

**架构图：**

> "画一个三层架构：CDN → Load Balancer → 3 个 Web Server → API Server → PostgreSQL + Redis"

## 安装

```bash
npm install ec-draw
```

## CLI

```bash
# JS 脚本模式（使用 Diagram API）
node dist/cli.js run diagram.js -o output.excalidraw -t sketchy

# JSON 描述模式（声明式）
node dist/cli.js render diagram.json -o output.excalidraw

# 查询工具
node dist/cli.js --list-themes
node dist/cli.js --list-icons
node dist/cli.js --list-libraries
```

## 主题

| 主题 | 风格 | 适用场景 |
|------|------|----------|
| `sketchy` | 手绘、暖色调 | 头脑风暴 |
| `professional` | 干净线条、蓝灰色系 | 架构文档 |
| `dark` | 暗色背景、霓虹色 | 终端展示 |
| `colorful` | 明亮原色 | 教学演示 |

## 支持的图表类型

| 类型 | 引擎 | 说明 |
|------|------|------|
| 流程图 | dagre | 决策树、流程（JSON 声明式） |
| 序列图 | sequence | API 交互 |
| 架构图 | grid | 服务拓扑（Diagram API） |
| 管线图 | pipeline | CI/CD 阶段 |

## 项目结构

```
ec-draw/
├── SKILL.md              Skill 定义
├── src/                  TypeScript 库
│   ├── diagram.ts        Diagram Builder API
│   ├── render.ts         JSON → Excalidraw 渲染器
│   ├── normalize.ts      元素工厂 + 风格归一化
│   ├── themes.ts         4 套主题
│   ├── library.ts        图标库
│   ├── components.ts     语义组件
│   ├── token_compiler.ts 设计 Token 编译
│   ├── types.ts          类型定义
│   └── cli.ts            CLI 入口
├── src/layout/           布局引擎
│   ├── dagre.ts          dagre 自动布局
│   ├── grid.ts           网格布局
│   ├── sequence.ts       序列图布局
│   ├── pipeline.ts       管线布局
│   └── router.ts         智能路由
├── templates/            模板
├── examples/             示例 .excalidraw 文件
└── library/              图标预设
```

## 文档

- [架构说明](docs/architecture.md) — 数据流、模块设计
- [API 参考](docs/api.md) — Diagram API / renderDiagram / 主题 / 图标

## License

MIT
