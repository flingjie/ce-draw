# 去 Mermaid 瘦身重构

日期：2026-07-05

## 目标

移除所有 Mermaid 相关代码，重构 CLI 支持 JS 脚本和 JSON 描述两种输入模式，跑通完整流程。

## 删除

| 文件/目录 | 理由 |
|-----------|------|
| `src/mermaid.ts` (485行) | Mermaid 解析器+渲染器 |
| `src/icon_resolver.ts` (167行) | 仅被 mermaid.ts 调用 |
| `tests/input/*.mmd` (5个) | Mermaid 输入 |
| `tests/expected/*.excalidraw` (5个) | Mermaid 期望输出 |
| `references/mermaid_syntax.md` | Mermaid 语法参考 |
| `prompts/` (6个) | Mermaid 示例 prompt |

## 修改

| 文件 | 改动 |
|------|------|
| `src/cli.ts` | 重写：`run <file.js>` + `render <file.json>` |
| `src/index.ts` | 移除 `mermaidToExcalidraw` 导出 |
| `src/layout/router.ts` | 移除 Mermaid 注释引用 |
| `SKILL.md` | 重写为 Diagram API + CLI 工作流 |
| `README.md` | 移除 Mermaid 引用 |
| `package.json` | 清理关键词和描述 |
| `docs/architecture.md` | 更新架构文档 |
| `docs/api.md` | 更新 API 文档 |
| `docs/design.md` | 更新设计文档 |
| `templates/*.md` (5个) | 改用 Diagram API 示例 |
| `tests/run_golden.sh` | 适配新模式 |
| `tests/README.md` | 更新测试文档 |

## 保持不变

`diagram.ts`, `normalize.ts`, `themes.ts`, `library.ts`, `components.ts`, `token_compiler.ts`, `types.ts`, 全部 layout 引擎。

## 新 CLI

```
ec-draw run <file.js>        # JS 脚本 → Diagram → .excalidraw
ec-draw render <file.json>   # JSON 描述 → layout → .excalidraw
ec-draw --list-themes
ec-draw --list-icons
ec-draw --list-libraries
```

### JS 脚本模式

脚本 export default 一个 Diagram 实例，CLI 调用 `toDocument()` 后写入文件。

### JSON 描述模式

格式：
```json
{
  "type": "flowchart",
  "direction": "TB",
  "theme": "sketchy",
  "nodes": [
    { "id": "A", "label": "开始", "shape": "rectangle" },
    { "id": "B", "label": "结束", "shape": "diamond" }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "下一步" }
  ]
}
```

type 路由到 layout 引擎：flowchart → dagre, pipeline → pipeline, sequence → sequence, arch → grid。

## 新测试

用 Diagram API 的 JS 脚本替代 .mmd 文件：
- `tests/input/flowchart.js`
- `tests/input/architecture.js`
- `tests/input/er.js`

## 验收标准

- [ ] `npm run build` 无错误
- [ ] `npm run test` 全部通过
- [ ] `node dist/cli.js run tests/input/flowchart.js -o /tmp/test.excalidraw` 生成有效文件
- [ ] `node dist/cli.js render <JSON> -o /tmp/test.excalidraw` 生成有效文件
- [ ] `node dist/cli.js --list-themes` 列出主题
- [ ] `node dist/cli.js --list-icons` 列出图标
