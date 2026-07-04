/**
 * Dagre layout engine — wraps dagre for automatic graph positioning.
 * Pure function: input = nodes + edges, output = positions.
 */

import dagre from "dagre";
import type { Position } from "../types.js";
import type { LayoutNode, LayoutEdge, LayoutOptions, LayoutResult } from "./types.js";

export function dagreLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const direction = opts.direction ?? "TB";

  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 70,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    const w = n.shape === "diamond" ? 140 : 150;
    const h = n.shape === "diamond" ? 90 : 65;
    g.setNode(n.id, { label: n.label, width: w, height: h });
  }
  for (const e of edges) g.setEdge(e.from, e.to, {});

  dagre.layout(g);

  const positions = new Map<string, Position>();
  for (const nid of g.nodes()) {
    const n = g.node(nid);
    positions.set(nid, { x: n.x - n.width / 2, y: n.y - n.height / 2, width: n.width, height: n.height });
  }
  return { positions, type: "dagre", meta: { direction } };
}

/**
 * Compute arrow start/end points based on layout direction.
 */
export function routeArrow(
  fromPos: Position,
  toPos: Position,
  direction: string
): { fx: number; fy: number; tx: number; ty: number } {
  if (direction === "TB") {
    return { fx: fromPos.x + fromPos.width / 2, fy: fromPos.y + fromPos.height, tx: toPos.x + toPos.width / 2, ty: toPos.y };
  }
  if (direction === "BT") {
    return { fx: fromPos.x + fromPos.width / 2, fy: fromPos.y, tx: toPos.x + toPos.width / 2, ty: toPos.y + toPos.height };
  }
  if (direction === "RL") {
    return { fx: fromPos.x, fy: fromPos.y + fromPos.height / 2, tx: toPos.x + toPos.width, ty: toPos.y + toPos.height / 2 };
  }
  return { fx: fromPos.x + fromPos.width, fy: fromPos.y + fromPos.height / 2, tx: toPos.x, ty: toPos.y + toPos.height / 2 };
}
