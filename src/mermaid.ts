/**
 * Mermaid → Excalidraw converter.
 *
 * Parse Mermaid syntax, run dagre layout (same engine Mermaid uses),
 * then build themed Excalidraw elements. Pure Node.js — no browser needed.
 */

import dagre from "dagre";
import type { ExcalidrawElement, ExcalidrawDocument } from "./types.js";
import { normalize } from "./normalize.js";
import { getTheme } from "./themes.js";
import { makeId } from "./normalize.js";

// ── Mermaid Syntax Parser ──────────────────────────────────────

interface ParsedNode {
  id: string;
  label: string;
  shape: "rectangle" | "diamond" | "ellipse" | "roundrect";
}

interface ParsedEdge {
  from: string;
  to: string;
  label: string | null;
}

interface ParsedFlowchart {
  type: "flowchart";
  direction: "TB" | "LR" | "RL" | "BT";
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

function parseMermaid(text: string): ParsedFlowchart {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const seen = new Set<string>();

  // Detect direction
  let direction: "TB" | "LR" | "RL" | "BT" = "TB";
  const dirMatch = text.match(/flowchart\s+(TB|TD|LR|RL|BT)/i);
  if (dirMatch) {
    const d = dirMatch[1].toUpperCase();
    direction = (d === "TD" ? "TB" : d) as "TB" | "LR" | "RL" | "BT";
  }

  // Parse node definitions: A[Label], B{Label}, C((Label)), D[(Label)]
  const nodePatterns: Array<[RegExp, ParsedNode["shape"]]> = [
    [/(\w+)\[([^\]]+)\]/g, "rectangle"],
    [/(\w+)\{([^}]+)\}/g, "diamond"],
    [/(\w+)\(\(([^)]+)\)\)/g, "ellipse"],
    [/(\w+)\[\(([^\]]+)\)\]/g, "roundrect"],
  ];

  for (const [pattern, shape] of nodePatterns) {
    for (const m of text.matchAll(pattern)) {
      const id = m[1];
      const label = m[2].trim();
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({ id, label, shape });
      }
    }
  }

  // Parse edges: A -->|label| B, A --> B, A -.-> B, A ==> B
  const edgeRe = /(\w+)\s*(--?>|-->>|-\.->|==>|-->)\s*(?:\|([^|]+)\|)?\s*(\w+)/g;
  for (const m of text.matchAll(edgeRe)) {
    const fromId = m[1];
    const toId = m[4];
    const label = m[3]?.trim() ?? null;

    // Auto-create nodes referenced in edges but not defined
    for (const nid of [fromId, toId]) {
      if (!seen.has(nid)) {
        seen.add(nid);
        nodes.push({ id: nid, label: nid, shape: "rectangle" });
      }
    }

    edges.push({ from: fromId, to: toId, label });
  }

  return { type: "flowchart", direction, nodes, edges };
}

// ── Dagre Layout ───────────────────────────────────────────────

function runDagreLayout(
  parsed: ParsedFlowchart
): Map<string, { x: number; y: number; width: number; height: number }> {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: parsed.direction,
    nodesep: 60,
    ranksep: 70,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  for (const node of parsed.nodes) {
    const w = node.shape === "diamond" ? 140 : 150;
    const h = node.shape === "diamond" ? 90 : 65;
    g.setNode(node.id, { label: node.label, width: w, height: h });
  }

  // Add edges
  for (const edge of parsed.edges) {
    g.setEdge(edge.from, edge.to, {});
  }

  dagre.layout(g);

  // Collect positions
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const nodeId of g.nodes()) {
    const n = g.node(nodeId);
    positions.set(nodeId, {
      x: n.x - n.width / 2,
      y: n.y - n.height / 2,
      width: n.width,
      height: n.height,
    });
  }

  return positions;
}

// ── Excalidraw Element Builders ────────────────────────────────

function baseElement(type: string, overrides: Record<string, any> = {}): ExcalidrawElement {
  return {
    id: makeId(),
    type,
    x: 0, y: 0, width: 0, height: 0,
    angle: 0,
    strokeColor: "#000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    boundElements: null,
    locked: false,
    strokeSharpness: "round",
    isDeleted: false,
    link: null,
    updated: 0,
    seed: Math.floor(Math.random() * 0x7fffffff),
    version: 2,
    versionNonce: 0,
    frameId: null,
    ...overrides,
  } as unknown as ExcalidrawElement;
}

function textElement(
  content: string,
  x: number, y: number,
  fontSize: number,
  fontFamily: number,
  containerId: string | null = null
): ExcalidrawElement {
  return baseElement("text", {
    x, y,
    width: content.length * fontSize * 0.6,
    height: fontSize * 1.5,
    text: content,
    fontSize,
    fontFamily,
    textAlign: "center",
    verticalAlign: "middle",
    containerId,
    autoResize: true,
    lineHeight: 1.25,
    baseline: fontSize * 0.8,
    originalText: content,
    strokeColor: "#1F2937",
    strokeWidth: 1,
  });
}

// ── Main API ───────────────────────────────────────────────────

/**
 * Convert Mermaid syntax to a fully themed Excalidraw document.
 *
 * Uses dagre (the same layout engine Mermaid uses) for professional
 * node positioning, then applies ec-draw's theme for consistent styling.
 * Pure Node.js — no browser or DOM needed.
 *
 * @param mermaidText - Mermaid diagram definition
 * @param themeName - ec-draw theme ("sketchy" | "professional" | "dark" | "colorful")
 * @returns Complete Excalidraw document ready to save
 */
export async function mermaidToExcalidraw(
  mermaidText: string,
  themeName: string = "sketchy"
): Promise<ExcalidrawDocument> {
  const theme = getTheme(themeName);

  // 1. Parse Mermaid syntax
  const parsed = parseMermaid(mermaidText.trim());
  if (parsed.nodes.length === 0) {
    throw new Error("No nodes found in Mermaid text. Check your syntax.");
  }

  // 2. Run dagre layout
  const positions = runDagreLayout(parsed);

  // 3. Build Excalidraw elements
  const elements: ExcalidrawElement[] = [];
  const nodeMap = new Map(parsed.nodes.map(n => [n.id, n]));

  for (const node of parsed.nodes) {
    const pos = positions.get(node.id)!;
    const [stroke, bg] = theme.shapes[elements.filter(e =>
      ["rectangle", "ellipse", "diamond"].includes(e.type)
    ).length % theme.shapes.length];

    const shapeType = node.shape === "roundrect" ? "rectangle"
      : node.shape as "rectangle" | "diamond" | "ellipse";

    const el = baseElement(shapeType, {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      strokeColor: stroke,
      backgroundColor: bg,
      fillStyle: theme.fillStyle,
      strokeWidth: theme.strokeWidth,
      roughness: theme.roughness,
      roundness: shapeType === "rectangle" ? theme.roundness : (shapeType === "ellipse" ? null : theme.roundness),
    });

    // Text label bound to shape
    const label = textElement(
      node.label,
      pos.x + pos.width / 2 - node.label.length * theme.fontSize * 0.3,
      pos.y + pos.height / 2 - theme.fontSize * 0.6,
      theme.fontSize,
      theme.fontFamily,
      el.id
    );
    label.strokeColor = theme.text;

    el.boundElements = [{ id: label.id, type: "text" }];
    elements.push(el);
    elements.push(label);
  }

  // 4. Build arrows for edges
  for (const edge of parsed.edges) {
    const fromPos = positions.get(edge.from);
    const toPos = positions.get(edge.to);
    if (!fromPos || !toPos) continue;

    // Edge routing: find best connection points
    const fromNode = nodeMap.get(edge.from)!;
    const toNode = nodeMap.get(edge.to)!;

    let fx: number, fy: number, tx: number, ty: number;

    if (parsed.direction === "TB" || parsed.direction === "BT") {
      // Vertical flow: top→bottom or bottom→top
      if (parsed.direction === "BT") {
        fx = fromPos.x + fromPos.width / 2;
        fy = fromPos.y;
        tx = toPos.x + toPos.width / 2;
        ty = toPos.y + toPos.height;
      } else {
        fx = fromPos.x + fromPos.width / 2;
        fy = fromPos.y + fromPos.height;
        tx = toPos.x + toPos.width / 2;
        ty = toPos.y;
      }
    } else {
      // Horizontal flow: left→right or right→left
      if (parsed.direction === "RL") {
        fx = fromPos.x;
        fy = fromPos.y + fromPos.height / 2;
        tx = toPos.x + toPos.width;
        ty = toPos.y + toPos.height / 2;
      } else {
        fx = fromPos.x + fromPos.width;
        fy = fromPos.y + fromPos.height / 2;
        tx = toPos.x;
        ty = toPos.y + toPos.height / 2;
      }
    }

    const dx = tx - fx;
    const dy = ty - fy;

    const arrow = baseElement("arrow", {
      x: fx, y: fy,
      width: dx, height: dy,
      strokeColor: theme.arrow,
      roundness: null,
    }) as any;
    arrow.points = [{ x: 0, y: 0 }, { x: dx, y: dy }];
    arrow.startArrowhead = null;
    arrow.endArrowhead = "arrow";
    arrow.startBinding = null;
    arrow.endBinding = null;

    if (edge.label) {
      const lbl = textElement(
        edge.label,
        fx + dx / 2 - edge.label.length * 6,
        fy + dy / 2 - 20,
        14,
        theme.fontFamily,
        arrow.id
      );
      lbl.strokeColor = theme.text;
      arrow.boundElements = [{ id: lbl.id, type: "text" }];
      elements.push(lbl);
    }

    elements.push(arrow);
  }

  // 5. Apply theme normalization
  const normalized = normalize(elements, theme);

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: normalized,
    appState: {
      gridSize: null,
      viewBackgroundColor: theme.background,
      currentItemFontFamily: theme.fontFamily,
      currentItemFontSize: theme.fontSize,
      theme: theme.name === "dark" ? "dark" : "light",
    },
    files: {},
  };
}
