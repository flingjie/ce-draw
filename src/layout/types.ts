/**
 * Shared types for layout engines.
 * Each engine accepts LayoutNode[] + LayoutEdge[] and returns a LayoutResult.
 */

import type { Position, Direction } from "../types.js";

export type { Position, Direction };

export interface LayoutNode {
  id: string;
  label: string;
  shape?: string; // "rectangle" | "diamond" | "ellipse" | "roundrect"
}

export interface LayoutEdge {
  from: string;
  to: string;
  label?: string | null;
}

export interface LayoutOptions {
  direction?: Direction;
  fontSize?: number;
  // grid-specific
  cols?: number;
  cellW?: number;
  cellH?: number;
  gapX?: number;
  gapY?: number;
  // pipeline-specific
  stageW?: number;
  stageH?: number;
  stageGap?: number;
}

export interface LayoutResult {
  positions: Map<string, Position>;
  type: string;
  meta?: Record<string, any>;
}
