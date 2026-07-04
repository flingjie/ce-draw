/**
 * Grid layout engine — manual row/column positioning.
 * Pure function: input = nodes, output = positions by grid index.
 */

import type { Position } from "../types.js";
import type { LayoutNode, LayoutEdge, LayoutOptions, LayoutResult } from "./types.js";

export function gridLayout(
  nodes: LayoutNode[],
  _edges: LayoutEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const cols = opts.cols ?? 3;
  const cellW = opts.cellW ?? 160;
  const cellH = opts.cellH ?? 80;
  const gapX = opts.gapX ?? 40;
  const gapY = opts.gapY ?? 50;

  const positions = new Map<string, Position>();

  for (let i = 0; i < nodes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 50 + col * (cellW + gapX);
    const y = 50 + row * (cellH + gapY);
    positions.set(nodes[i].id, { x, y, width: cellW, height: cellH });
  }

  return { positions, type: "grid", meta: { cols, cellW, cellH } };
}

/** Standalone grid position helper — used by Diagram class. */
export function gridPosition(
  index: number,
  cols: number,
  cellW: number,
  cellH: number,
  gapX: number,
  gapY: number,
  originX: number = 50,
  originY: number = 50
): { x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: originX + col * (cellW + gapX),
    y: originY + row * (cellH + gapY),
  };
}
