/**
 * Sequence diagram layout — computes lifeline and message positions.
 * Takes dagre positions for participant boxes, adds lifeline + message slots.
 */

import type { Position } from "../types.js";
import type { LayoutNode, LayoutResult } from "./types.js";

export interface SequenceMeta {
  lifelineTop: number;
  lifelineBottom: number;
  lifelines: Array<{ nodeId: string; cx: number }>;
  messageSlots: Array<{
    from: string;
    to: string;
    fromX: number;
    toX: number;
    y: number;
    text: string | null;
  }>;
}

export function sequenceLayout(
  nodes: LayoutNode[],
  positions: Map<string, Position>,
  messages: Array<{ from: string; to: string; text: string }> | undefined
): LayoutResult {
  const firstPos = positions.values().next().value;
  const lifelineTop = (firstPos?.y ?? 50) + 70;
  const msgCount = messages?.length ?? 0;
  const lifelineBottom = lifelineTop + Math.max(msgCount * 60, 100) + 20;

  const lifelines = nodes.map(node => {
    const pos = positions.get(node.id)!;
    return { nodeId: node.id, cx: pos.x + pos.width / 2 };
  });

  const msgSpacing = 55;
  let msgY = lifelineTop + 15;
  const messageSlots = (messages ?? []).map(msg => {
    const fp = positions.get(msg.from);
    const tp = positions.get(msg.to);
    const fromX = fp ? fp.x + fp.width / 2 : 0;
    const toX = tp ? tp.x + tp.width / 2 : 0;
    const slot = { from: msg.from, to: msg.to, fromX, toX, y: msgY, text: msg.text };
    msgY += msgSpacing;
    return slot;
  });

  const meta: SequenceMeta = { lifelineTop, lifelineBottom, lifelines, messageSlots };
  return { positions, type: "sequence", meta };
}
