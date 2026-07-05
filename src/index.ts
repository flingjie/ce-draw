/**
 * ec-draw: AI-powered Excalidraw diagram generator.
 *
 * Main entry point. Two primary workflows:
 *
 * 1. Programmatic API (for custom layouts):
 *    ```ts
 *    import { Diagram } from "ec-draw";
 *    const d = new Diagram("sketchy");
 *    d.addBox("API Gateway", { row: 0, col: 0, span: 3 });
 *    d.addArrow("API Gateway", "Auth Service");
 *    d.save("arch.excalidraw");
 *    ```
 *
 * 2. JSON descriptor (for declarative structured diagrams):
 *    ```ts
 *    import { renderDiagram } from "ec-draw";
 *    const doc = renderDiagram({
 *      type: "flowchart",
 *      nodes: [{ id: "A", label: "Start" }, { id: "B", label: "End" }],
 *      edges: [{ from: "A", to: "B" }]
 *    }, "sketchy");
 *    ```
 */

export { Diagram } from "./diagram.js";
export { renderDiagram } from "./render.js";
export type { JSONNode, JSONEdge, JSONDiagram } from "./render.js";
export { getTheme, listThemes, THEMES } from "./themes.js";
export { normalize, normalizeElement, makeId } from "./normalize.js";
export { ICONS, listIcons, loadLibraryIcon, listLibrary, listLibraries } from "./library.js";
export type { IconDef } from "./library.js";

// Layout engines + router
export { routeLayout } from "./layout/router.js";
export { dagreLayout, routeArrow } from "./layout/dagre.js";
export { gridLayout, gridPosition } from "./layout/grid.js";
export { sequenceLayout } from "./layout/sequence.js";
export type { SequenceMeta } from "./layout/sequence.js";
export { pipelineLayout } from "./layout/pipeline.js";
export type { LayoutNode, LayoutEdge, LayoutOptions, LayoutResult } from "./layout/types.js";

export type {
  ExcalidrawElement,
  ExcalidrawDocument,
  ThemeConfig,
  TextElement,
  ArrowElement,
  FrameElement,
  Point,
} from "./types.js";
