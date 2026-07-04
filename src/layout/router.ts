/**
 * Layout router — auto-selects the best layout engine per diagram type.
 * Dispatches to dagre, grid, or pipeline based on type + options.
 *
 * Sequence diagrams: the router returns dagre positions (for participant boxes);
 * the caller in mermaid.ts layers on sequenceLayout() with message positions.
 */

import type { LayoutNode, LayoutEdge, LayoutOptions, LayoutResult } from "./types.js";
import { dagreLayout } from "./dagre.js";
import { gridLayout } from "./grid.js";
import { pipelineLayout } from "./pipeline.js";

/** Routing table: diagram type → engine + default opts */
const ROUTES: Record<string, LayoutOptions> = {
  flowchart:    { direction: "TB" },
  er:           { direction: "TB" },
  class:        { direction: "TB" },
  sequence:     { direction: "TB" },
  pipeline:     { direction: "LR" },
  workflow:     { direction: "LR" },
  architecture: { cols: 4, cellW: 160, cellH: 80 },
  arch:         { cols: 4, cellW: 160, cellH: 80 },
};

/** Map diagram type to engine name */
const ENGINE: Record<string, "dagre" | "grid" | "pipeline"> = {
  flowchart: "dagre",
  er: "dagre",
  class: "dagre",
  sequence: "dagre",     // dagre for actants, caller adds sequence overlay
  pipeline: "pipeline",
  workflow: "pipeline",
  architecture: "grid",
  arch: "grid",
};

/**
 * Route a diagram to the best layout engine.
 *
 * @param diagramType — "flowchart", "sequence", "er", "class", "pipeline", etc.
 * @param nodes — diagram nodes
 * @param edges — diagram edges
 * @param opts — overrides (direction, grid dimensions, etc.)
 */
export function routeLayout(
  diagramType: string,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const defaults = ROUTES[diagramType] ?? { direction: "TB" };
  const merged: LayoutOptions = { ...defaults, ...opts };
  const engine = ENGINE[diagramType] ?? "dagre";

  switch (engine) {
    case "dagre":
      return dagreLayout(nodes, edges, merged);
    case "grid":
      return gridLayout(nodes, edges, merged);
    case "pipeline":
      return pipelineLayout(nodes, edges, merged);
  }
}
