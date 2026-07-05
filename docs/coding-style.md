# ec-draw Coding Style

## TypeScript

- `strict: true` — no implicit any
- ES modules (`type: "module"`)
- No default exports (prefer named)
- Interfaces over type aliases for public APIs

## Naming

| Kind | Convention | Example |
|---|---|---|
| Files | kebab-case | `render.ts`, `normalize.ts` |
| Types | PascalCase | `ExcalidrawElement` |
| Functions | camelCase | `renderDiagram` |
| Constants | UPPER_SNAKE | `DEFAULT_MARGIN` |

## Patterns

- **Pure functions** for transforms — no side effects
- **Builder pattern** for Diagram class
- **Theme as data** — themes.ts is a color map, no logic
- **Library as data** — icons.json is the source of truth
- **No class inheritance** — prefer composition

## Anti-patterns

- ❌ Hardcoded colors outside themes.ts
- ❌ Render-specific logic in normalize.ts
- ❌ Changing icon IDs after release
- ❌ Skipping normalize step in render pipeline
