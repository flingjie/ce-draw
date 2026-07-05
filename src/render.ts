/**
 * JSON → Excalidraw renderer.
 *
 * Takes a declarative diagram descriptor (nodes + edges + type),
 * routes to the best layout engine, and produces themed Excalidraw elements.
 * Pure Node.js — no browser or DOM needed.
 */

import type { ExcalidrawElement, ExcalidrawDocument, Direction } from "./types.js";
import { getTheme } from "./themes.js";
import {
  createElement,
  createTextElement,
  buildAppState,
  textWidth,
  measureText,
  normalizeLabel,
} from "./normalize.js";
import { getSpacing } from "./token_compiler.js";
import { routeLayout } from "./layout/router.js";
import { routeArrow } from "./layout/dagre.js";

// ── JSON Input Types ────────────────────────────────────────────

export interface JSONNode {
  id: string;
  label: string | string[];
  shape?: "rectangle" | "diamond" | "ellipse" | "roundrect";
}

export interface JSONEdge {
  from: string;
  to: string;
  label?: string;
}

export interface JSONDiagram {
  type: string;
  direction?: Direction;
  theme?: string;
  nodes: JSONNode[];
  edges: JSONEdge[];
}

// ── Shape Builder ───────────────────────────────────────────────

function buildShape(
  node: JSONNode,
  pos: { x: number; y: number; width: number; height: number },
  stroke: string,
  bg: string,
  theme: ReturnType<typeof getTheme>
): ExcalidrawElement[] {
  const label = normalizeLabel(node.label);
  const shapeType = node.shape === "roundrect" ? "rectangle" : (node.shape ?? "rectangle");

  const el = createElement(shapeType, {
    x: pos.x, y: pos.y, width: pos.width, height: pos.height,
    strokeColor: stroke,
    backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: shapeType === "ellipse" ? null : theme.roundness,
  });

  const m = measureText(label, theme.fontSize);
  const labelEl = createTextElement(
    label,
    pos.x + pos.width / 2 - m.width / 2,
    pos.y + pos.height / 2 - m.height / 2,
    theme.fontSize,
    theme.fontFamily,
    el.id,
    m
  );
  labelEl.strokeColor = theme.text;

  el.boundElements = [{ id: labelEl.id, type: "text" }];
  return [el, labelEl];
}

function buildArrow(
  edge: JSONEdge,
  fromPos: { x: number; y: number; width: number; height: number },
  toPos: { x: number; y: number; width: number; height: number },
  direction: Direction,
  theme: ReturnType<typeof getTheme>
): ExcalidrawElement[] {
  const { fx, fy, tx, ty } = routeArrow(fromPos, toPos, direction);
  const dx = tx - fx, dy = ty - fy;

  const arrowEl = createElement("arrow", {
    x: fx, y: fy, width: dx, height: dy,
    strokeColor: theme.arrow,
    roundness: { type: 2 },
  }) as any;
  arrowEl.points = [[0, 0], [dx, dy]];
  arrowEl.startArrowhead = null;
  arrowEl.endArrowhead = "arrow";
  arrowEl.startBinding = null;
  arrowEl.endBinding = null;

  const result: ExcalidrawElement[] = [arrowEl];

  if (edge.label) {
    const m = measureText(edge.label, 14);
    const lbl = createTextElement(
      edge.label,
      fx + dx / 2 - m.width / 2,
      fy + dy / 2 - 20,
      14, theme.fontFamily, arrowEl.id,
      m
    );
    lbl.strokeColor = theme.text;
    arrowEl.boundElements = [{ id: lbl.id, type: "text" }];
    result.push(lbl);
  }

  return result;
}

// ── Sequence Renderer ───────────────────────────────────────────

function buildSequence(
  nodes: JSONNode[],
  edges: JSONEdge[],
  positions: Map<string, { x: number; y: number; width: number; height: number }>,
  theme: ReturnType<typeof getTheme>
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  let colorIdx = 0;

  // Participant boxes
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
    colorIdx++;
    elements.push(...buildShape(node, pos, stroke, bg, theme));
  }

  // Lifelines + message arrows
  const lifelineTop = (positions.values().next().value?.y ?? 50) + 70;
  const msgCount = edges.length;
  const lifelineBottom = lifelineTop + Math.max(msgCount * 60, 100) + 20;

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const cx = pos.x + pos.width / 2;
    const l = createElement("line", {
      x: cx, y: lifelineTop, width: 0, height: lifelineBottom - lifelineTop,
      strokeColor: theme.arrow, strokeWidth: 1, roundness: null, strokeStyle: "dashed",
    });
    elements.push(l);
  }

  const msgSpacing = 55;
  let msgY = lifelineTop + 15;
  for (const edge of edges) {
    const fp = positions.get(edge.from);
    const tp = positions.get(edge.to);
    if (!fp || !tp) continue;

    const fcx = fp.x + fp.width / 2;
    const tcx = tp.x + tp.width / 2;
    const dx = tcx - fcx;

    const arr = createElement("arrow", {
      x: fcx, y: msgY, width: dx, height: 0,
      strokeColor: theme.arrow, roundness: null,
    }) as any;
    arr.points = [[0, 0], [dx, 0]];
    arr.startArrowhead = null;
    arr.endArrowhead = "arrow";

    if (edge.label) {
      const lbl = createTextElement(
        edge.label,
        fcx + dx / 2 - textWidth(edge.label, 12) / 2,
        msgY - 18,
        12, theme.fontFamily, arr.id
      ) as any;
      lbl.strokeColor = theme.text;
      arr.boundElements = [{ id: lbl.id, type: "text" }];
      elements.push(lbl);
    }

    elements.push(arr);
    msgY += msgSpacing;
  }

  return elements;
}

// ── Main API ────────────────────────────────────────────────────

/**
 * Render a JSON diagram descriptor to a themed Excalidraw document.
 */
export function renderDiagram(
  diagram: JSONDiagram,
  themeName: string = "sketchy"
): ExcalidrawDocument {
  const theme = getTheme(themeName);
  const direction: Direction = diagram.direction ?? "TB";

  if (diagram.nodes.length === 0) {
    throw new Error("No nodes found in diagram. Must have at least one node.");
  }

  // Normalize labels (string[] → string with \n)
  const nodes = diagram.nodes.map(n => ({ ...n, label: normalizeLabel(n.label) }));
  const edges = diagram.edges.map(e => ({ ...e, label: e.label ? normalizeLabel(e.label) : undefined }));

  const layout = routeLayout(diagram.type, nodes, edges, { direction });
  const positions = layout.positions;

  const elements: ExcalidrawElement[] = [];
  let colorIdx = 0;

  if (diagram.type === "sequence") {
    elements.push(...buildSequence(nodes, edges, positions, theme));
  } else {
    // Build shapes
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
      colorIdx++;
      elements.push(...buildShape(node, pos, stroke, bg, theme));
    }

    // Build arrows
    for (const edge of edges) {
      const fp = positions.get(edge.from);
      const tp = positions.get(edge.to);
      if (!fp || !tp) continue;
      elements.push(...buildArrow(edge, fp, tp, direction, theme));
    }
  }

  // Ensure minimum viewport margins
  const spacing = getSpacing();
  if (elements.length > 0) {
    let minX = Infinity, minY = Infinity;
    for (const el of elements) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
    }
    const dx = spacing.margin - minX;
    const dy = spacing.margin - minY;
    if (dx > 0 || dy > 0) {
      for (const el of elements) {
        if (dx > 0) el.x += dx;
        if (dy > 0) el.y += dy;
      }
    }
  }

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: buildAppState(theme),
    files: {},
  };
}
