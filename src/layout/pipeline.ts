/**
 * Pipeline layout engine — linear equidistant stages.
 * Perfect for CI/CD pipelines, deployment flows, and linear workflows.
 */

import type { Position } from "../types.js";
import type { LayoutNode, LayoutEdge, LayoutOptions, LayoutResult } from "./types.js";

export function pipelineLayout(
  nodes: LayoutNode[],
  _edges: LayoutEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const direction = opts.direction ?? "LR";
  const stageW = opts.stageW ?? 160;
  const stageH = opts.stageH ?? 60;
  const stageGap = opts.stageGap ?? 60;

  const positions = new Map<string, Position>();
  const isHorizontal = direction === "LR" || direction === "RL";

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const x = isHorizontal ? 50 + i * (stageW + stageGap) : 50;
    const y = isHorizontal ? 120 : 50 + i * (stageH + stageGap);
    positions.set(node.id, { x, y, width: stageW, height: stageH });
  }

  return { positions, type: "pipeline", meta: { direction, stageW, stageH, stageGap } };
}
