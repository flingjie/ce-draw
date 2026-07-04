# Excalidraw JSON Schema Reference

## Top-Level Structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": {},
  "files": {}
}
```

## Element Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique UUID |
| `type` | string | Element type: rectangle, ellipse, diamond, arrow, line, text, frame |
| `x` | number | Position X |
| `y` | number | Position Y |
| `width` | number | Element width |
| `height` | number | Element height |
| `angle` | number | Rotation in radians (0 = none) |
| `strokeColor` | string | CSS color, e.g. "#1e1e1e" |
| `backgroundColor` | string | Fill color, e.g. "#a5d8ff" |
| `fillStyle` | string | "solid", "hachure", "cross-hatch", "zigzag" |
| `strokeWidth` | number | 1-4, line thickness |
| `strokeStyle` | string | "solid", "dashed", "dotted" |
| `roughness` | number | 0 (crisp) to 2 (sketchy) |
| `opacity` | number | 0-100 |
| `roundness` | null or {type: 1\|2\|3} | Corner roundness (shapes only) |
| `groupIds` | string[] | Group membership |
| `boundElements` | Array<{id, type}> | Bound text/arrow refs |
| `isDeleted` | boolean | Soft delete flag |

## Arrow/Lines

```json
{
  "type": "arrow",
  "points": [{"x": 0, "y": 0}, {"x": 150, "y": 0}],
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "startBinding": null,
  "endBinding": null
}
```

## Text

```json
{
  "type": "text",
  "text": "Hello World",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "containerId": null,
  "autoResize": true,
  "lineHeight": 1.25,
  "baseline": 14
}
```

fontFamily: 1=Virgil (hand-drawn), 2=Helvetica, 3=Cascadia, 4=Assistant, 5=Comic Shanns

## Theme Colors

| Theme | Background | Shapes | Arrow | Text |
|-------|-----------|--------|-------|------|
| sketchy | #F8F5F0 | warm tones | #5A5A5A | #2C2C2C |
| professional | #FFFFFF | blue/gray | #6B7280 | #1F2937 |
| dark | #111827 | neon accents | #9CA3AF | #F3F4F6 |
| colorful | #FFFBEB | primaries | #495057 | #212529 |
