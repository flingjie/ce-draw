/**
 * Mermaid → Excalidraw converter.
 *
 * Pure Node.js — no browser or DOM needed. Parses Mermaid syntax,
 * routes to the best layout engine (dagre/sequence/grid/pipeline),
 * builds themed Excalidraw elements.
 *
 * Supported: flowchart, sequenceDiagram, erDiagram, classDiagram
 */

import type { ExcalidrawElement, ExcalidrawDocument, Direction } from "./types.js";
import { getTheme } from "./themes.js";
import {
  createElement,
  createTextElement,
  buildAppState,
  textWidth,
} from "./normalize.js";
import { resolveIcon, resolveIconName } from "./icon_resolver.js";
import { ICONS } from "./library.js";
import { getSpacing } from "./token_compiler.js";
import { routeLayout } from "./layout/router.js";
import { routeArrow } from "./layout/dagre.js";

// ── Types ──────────────────────────────────────────────────────

type Shape = "rectangle" | "diamond" | "ellipse" | "roundrect";

interface ParsedNode {
  id: string;
  label: string;
  shape: Shape;
}

interface ParsedEdge {
  from: string;
  to: string;
  label: string | null;
}

interface ParsedDiagram {
  type: "flowchart" | "sequence" | "er" | "class";
  direction?: Direction;
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  participants?: string[];
  messages?: Array<{ from: string; to: string; text: string }>;
  entities?: Record<string, { fields: string[] }>;
  classes?: Record<string, { attributes: string[]; methods: string[] }>;
}

// ── Mermaid Syntax Parser ──────────────────────────────────────

const NODE_PATTERNS: Array<[RegExp, Shape]> = [
  [/(\w+)\[([^\]]+)\]/g, "rectangle"],
  [/(\w+)\{([^}]+)\}/g, "diamond"],
  [/(\w+)\(\(([^)]+)\)\)/g, "ellipse"],
  [/(\w+)\[\(([^\]]+)\)\]/g, "roundrect"],
];

const EDGE_RE = /(\w+)\s*(--?>|-->>|-\.->|==>|-->)\s*(?:\|([^|]+)\|)?\s*(\w+)/g;

function parseFlowchart(text: string): ParsedDiagram {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const seen = new Set<string>();

  let direction: Direction = "TB";
  const dm = text.match(/flowchart\s+(TB|TD|LR|RL|BT)/i);
  if (dm) {
    const d = dm[1].toUpperCase();
    direction = (d === "TD" ? "TB" : d) as Direction;
  }

  for (const [p, shape] of NODE_PATTERNS) {
    for (const m of text.matchAll(p)) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        nodes.push({ id: m[1], label: m[2].trim(), shape });
      }
    }
  }

  for (const m of text.matchAll(EDGE_RE)) {
    const [from, to, label] = [m[1], m[4], m[3]?.trim() ?? null];
    for (const nid of [from, to]) {
      if (!seen.has(nid)) { seen.add(nid); nodes.push({ id: nid, label: nid, shape: "rectangle" }); }
    }
    edges.push({ from, to, label });
  }

  return { type: "flowchart", direction, nodes, edges };
}

function parseSequence(text: string): ParsedDiagram {
  const participants: string[] = [];
  const messages: Array<{ from: string; to: string; text: string }> = [];

  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("%%")) continue;

    if (s.toLowerCase().startsWith("participant ")) {
      const name = s.split(" ", 1)[1]?.trim().replace(/"/g, "") ?? "";
      if (name && !participants.includes(name)) participants.push(name);
      continue;
    }

    const am = s.match(/actor\s+(\w+)(?:\s+as\s+(\w+))?/i);
    if (am) { const alias = am[2] || am[1]; if (!participants.includes(alias)) participants.push(alias); continue; }

    const mm = s.match(/^(\w+)\s*(->>|-->>|->|-->)+\s*(\w+)\s*:\s*(.+)/);
    if (mm) {
      const [from, to, text] = [mm[1], mm[3], mm[4].trim()];
      if (!participants.includes(from)) participants.push(from);
      if (!participants.includes(to)) participants.push(to);
      messages.push({ from, to, text });
    }
  }

  const nodes: ParsedNode[] = participants.map((p) => ({ id: p, label: p, shape: "rectangle" }));
  const edges: ParsedEdge[] = messages.map((m) => ({ from: m.from, to: m.to, label: m.text }));

  return { type: "sequence", nodes, edges, participants, messages };
}

function parseErOrClass(text: string, type: "er" | "class"): ParsedDiagram {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const seen = new Set<string>();
  const entities: Record<string, { fields: string[] }> = {};
  const classes: Record<string, { attributes: string[]; methods: string[] }> = {};

  let current: string | null = null;
  const relRe = /(\w+)\s+(\|\||}o|o\{|\|o|o\||\}\||\|\{)\s*(--|\.\.)\s*(\|\||}o|o\{|\|o|o\||\}\||\|\{)\s+(\w+)\s*:\s*(.+)/;

  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("%%") || /^(erDiagram|classDiagram)$/i.test(s)) continue;

    // Relationship (check before block, cardinality like o{ contains "{")
    const rm = s.match(relRe);
    if (rm) {
      for (const nid of [rm[1], rm[5]]) {
        if (!seen.has(nid)) { seen.add(nid); nodes.push({ id: nid, label: nid, shape: "rectangle" }); }
      }
      edges.push({ from: rm[1], to: rm[5], label: rm[6].trim() });
      continue;
    }

    // Inheritance: Child <|-- Parent
    const im = s.match(/(\w+)\s*<\|--\s*(\w+)/);
    if (im) {
      for (const nid of [im[1], im[2]]) {
        if (!seen.has(nid)) { seen.add(nid); nodes.push({ id: nid, label: nid, shape: "rectangle" }); }
      }
      edges.push({ from: im[1], to: im[2], label: "extends" });
      continue;
    }

    // Block open
    if (s.includes("{")) {
      current = s.split("{")[0].trim();
      if (!seen.has(current)) { seen.add(current); nodes.push({ id: current, label: current, shape: "rectangle" }); }
      continue;
    }
    if (s.includes("}")) { current = null; continue; }

    // Field inside block
    if (current) {
      if (type === "er") {
        entities[current] ??= { fields: [] };
        entities[current].fields.push(s);
      } else {
        classes[current] ??= { attributes: [], methods: [] };
        if (s.includes("(")) classes[current].methods.push(s);
        else classes[current].attributes.push(s);
      }
      continue;
    }

    // Inline member: ClassName : +type field
    const cm = s.match(/(\w+)\s*:\s*(.+)/);
    if (cm) {
      if (!seen.has(cm[1])) { seen.add(cm[1]); nodes.push({ id: cm[1], label: cm[1], shape: "rectangle" }); }
      classes[cm[1]] ??= { attributes: [], methods: [] };
      if (cm[2].includes("(")) classes[cm[1]].methods.push(cm[2]);
      else classes[cm[1]].attributes.push(cm[2]);
    }
  }

  return type === "er"
    ? { type: "er", nodes, edges, entities }
    : { type: "class", nodes, edges, classes };
}

function parseMermaid(text: string): ParsedDiagram {
  const first = text.trim().split("\n")[0].toLowerCase();
  if (first.includes("flowchart") || first.startsWith("graph ")) return parseFlowchart(text);
  if (first.includes("sequencediagram")) return parseSequence(text);
  if (first.includes("erdiagram")) return parseErOrClass(text, "er");
  if (first.includes("classdiagram")) return parseErOrClass(text, "class");
  throw new Error(`Unknown diagram type: "${first}". Supported: flowchart, sequenceDiagram, erDiagram, classDiagram`);
}


// ── Renderers ──────────────────────────────────────────────────

function buildShape(
  node: ParsedNode,
  pos: { x: number; y: number; width: number; height: number },
  stroke: string,
  bg: string,
  theme: ReturnType<typeof getTheme>
): ExcalidrawElement[] {
  const shapeType = node.shape === "roundrect" ? "rectangle" : node.shape as "rectangle" | "diamond" | "ellipse";

  const el = createElement(shapeType, {
    x: pos.x, y: pos.y, width: pos.width, height: pos.height,
    strokeColor: stroke,
    backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: shapeType === "rectangle" ? theme.roundness : (shapeType === "ellipse" ? null : theme.roundness),
  });

  // Bound text label
  const label = createTextElement(
    node.label,
    pos.x + pos.width / 2 - textWidth(node.label, theme.fontSize) / 2,
    pos.y + pos.height / 2 - theme.fontSize * 0.6,
    theme.fontSize,
    theme.fontFamily,
    el.id
  );
  label.strokeColor = theme.text;

  el.boundElements = [{ id: label.id, type: "text" }];
  return [el, label];
}

function buildArrow(
  edge: ParsedEdge,
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
    const lbl = createTextElement(
      edge.label,
      fx + dx / 2 - textWidth(edge.label, 14) / 2,
      fy + dy / 2 - 20,
      14, theme.fontFamily, arrowEl.id
    );
    lbl.strokeColor = theme.text;
    arrowEl.boundElements = [{ id: lbl.id, type: "text" }];
    result.push(lbl);
  }

  return result;
}

// ── Main API ───────────────────────────────────────────────────

/**
 * Convert Mermaid syntax to a themed Excalidraw document.
 *
 * Uses dagre layout for automatic node positioning, then applies
 * ec-draw's theme for consistent styling. Pure Node.js.
 */
export function mermaidToExcalidraw(
  mermaidText: string,
  themeName: string = "sketchy"
): ExcalidrawDocument {
  const theme = getTheme(themeName);
  const parsed = parseMermaid(mermaidText.trim());

  if (parsed.nodes.length === 0) {
    throw new Error("No nodes found in Mermaid text. Check your syntax.");
  }

  const direction: Direction = parsed.direction ?? "TB";
  const layout = routeLayout(parsed.type, parsed.nodes, parsed.edges, { direction });
  const positions = layout.positions;

  const elements: ExcalidrawElement[] = [];
  let colorIdx = 0;

  // Build shapes
  for (const node of parsed.nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
    colorIdx++;
    elements.push(...buildShape(node, pos, stroke, bg, theme));

    // ER: render entity fields below the shape
    if (parsed.entities?.[node.id]) {
      let fy = pos.y + pos.height + 5;
      for (const f of parsed.entities[node.id].fields) {
        const t = createTextElement(f, pos.x + 8, fy, 12, theme.fontFamily) as any;
        t.strokeColor = theme.text;
        t.textAlign = "left";
        elements.push(t);
        fy += 16;
      }
    }

    // Class: render attributes and methods below the shape
    if (parsed.classes?.[node.id]) {
      const info = parsed.classes[node.id];
      let fy = pos.y + pos.height + 5;

      // Attributes
      for (const attr of info.attributes) {
        const t = createTextElement(attr, pos.x + 8, fy, 12, theme.fontFamily) as any;
        t.strokeColor = theme.text;
        t.textAlign = "left";
        elements.push(t);
        fy += 16;
      }

      // Separator before methods
      if (info.methods.length > 0) {
        const sep = createElement("line", {
          x: pos.x + 4, y: fy, width: pos.width - 8, height: 0,
          strokeColor: theme.arrow, strokeWidth: 1, roundness: null,
        });
        elements.push(sep);
        fy += 10;
      }

      // Methods
      for (const m of info.methods) {
        const t = createTextElement(m, pos.x + 8, fy, 12, theme.fontFamily) as any;
        t.strokeColor = theme.text;
        t.textAlign = "left";
        elements.push(t);
        fy += 16;
      }
    }
  }

  // Sequence state (used by lifelines + arrow routing below)
  let lifelineTop = 0;
  if (parsed.type === "sequence") {
    lifelineTop = (positions.values().next().value?.y ?? 50) + 70;
    const msgCount = parsed.messages?.length ?? 0;
    const lifelineBottom = lifelineTop + Math.max(msgCount * 60, 100) + 20;

    for (const node of parsed.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const cx = pos.x + pos.width / 2;
      const l = createElement("line", {
        x: cx, y: lifelineTop, width: 0, height: lifelineBottom - lifelineTop,
        strokeColor: theme.arrow, strokeWidth: 1, roundness: null, strokeStyle: "dashed",
      });
      elements.push(l);
    }
  }

  // Build arrows
  if (parsed.type === "sequence") {
    // Sequence: horizontal arrows along lifelines, chronological order
    const msgSpacing = 55;
    let msgY = lifelineTop + 15;
    for (const msg of parsed.messages ?? []) {
      const fp = positions.get(msg.from);
      const tp = positions.get(msg.to);
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

      if (msg.text) {
        const lbl = createTextElement(
          msg.text,
          fcx + dx / 2 - textWidth(msg.text, 12) / 2,
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
  } else {
    // Flowchart/ER/Class: dagre-routed arrows
    for (const edge of parsed.edges) {
      const fp = positions.get(edge.from);
      const tp = positions.get(edge.to);
      if (!fp || !tp) continue;
      elements.push(...buildArrow(edge, fp, tp, direction, theme));
    }
  }

  // 8. Icon resolution — replace shapes whose label matches an icon
  for (const node of parsed.nodes) {
    const iconName = resolveIconName(node.label);
    if (!iconName || !ICONS[iconName]) continue;

    const shapeIdx = elements.findIndex(
      e => ["rectangle","ellipse","diamond"].includes(e.type) &&
           e.boundElements?.some(b => {
             const t = elements.find(x => x.id === b.id) as any;
             return t?.text === node.label;
           })
    );
    if (shapeIdx === -1) continue;

    const shapeEl = elements[shapeIdx];
    const pos = positions.get(node.id);
    if (!pos) continue;

    const boundIds = new Set((shapeEl.boundElements || []).map((b: any) => b.id));
    elements.splice(shapeIdx, 1);
    for (let i = elements.length - 1; i >= 0; i--) {
      if (boundIds.has(elements[i].id)) elements.splice(i, 1);
    }

    const [stroke, bg] = theme.shapes[colorIdx % theme.shapes.length];
    colorIdx++;
    const iconEls = resolveIcon(iconName, pos.x, pos.y, themeName, colorIdx);
    if (iconEls) elements.push(...iconEls);
  }

  // 9. Ensure minimum viewport margins (120px per design tokens)
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
