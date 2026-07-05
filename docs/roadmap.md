# ec-draw Roadmap

## Current Capabilities

| Capability | Status | Priority |
|---|---|---|
| Prompt (diagram reasoning) | ✅ 5 templates | — |
| Library (icons, presets) | ✅ 12+ icons | — |
| Renderer (JSON → Excalidraw) | ✅ dagre/grid/pipeline layout | — |
| Diagram API (programmatic) | ✅ Builder pattern | — |
| Style (normalize + themes) | ✅ 4 themes | — |
| Examples (golden tests) | ⚠️ outputs only | HIGH |
| Docs (project memory) | ⚠️ minimal | MEDIUM |

## Upcoming Goals

1. **Golden Tests** — input/expected pairs for regression safety
2. **More Icon Presets** — expand library/icons.json to 20+ items
3. **Auto-layout Improvements** — reduce overlap, better spacing
4. **New Diagram Types** — mindmap, gantt, class diagram
5. **Style Normalize v2** — smarter palette assignment

## Done

- [x] Diagram Builder API
- [x] JSON → Excalidraw renderer (dagre/pipeline/grid)
- [x] 4 visual themes (sketchy, professional, dark, colorful)
- [x] Style normalization layer
- [x] SKILL.md + Claude Code skill integration
- [x] Library icons (12+ built-in)
- [x] External library loader (.excalidrawlib)
