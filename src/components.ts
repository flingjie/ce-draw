/**
 * Semantic components — higher-level diagram elements that wrap raw
 * Excalidraw elements with semantic meaning.
 *
 * Components are semantic building blocks for diagram elements.
 * Instead of creating raw rectangles for every node, components provide
 * typed, styled, and positioned element groups.
 */

import type { ExcalidrawElement } from "./types.js";
import { createElement, createTextElement, textWidth } from "./normalize.js";
import type { ThemeConfig } from "./types.js";

// ── Component Interface ───────────────────────────────────────

export interface Component {
  /** All elements that make up this component. */
  elements: ExcalidrawElement[];
  /** The primary shape element (for arrow routing). */
  primary: ExcalidrawElement;
  /** Center X of the main shape. */
  cx: number;
  /** Center Y of the main shape. */
  cy: number;
}

// ── ProcessBox ────────────────────────────────────────────────

/**
 * A process step — rectangle with optional type badge.
 * Use for: service boxes, process steps, function calls.
 */
export function ProcessBox(
  x: number, y: number,
  width: number, height: number,
  label: string,
  stroke: string, bg: string,
  theme: ThemeConfig,
  opts?: { subLabel?: string }
): Component {
  const box = createElement("rectangle", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: theme.roundness,
  });

  // Main label centered in the box
  const mainLabel = createTextElement(
    label,
    x + width / 2 - textWidth(label, theme.fontSize) / 2,
    y + height / 2 - theme.fontSize * (opts?.subLabel ? 1.1 : 0.6),
    theme.fontSize,
    theme.fontFamily,
    box.id
  );
  mainLabel.strokeColor = theme.text;

  box.boundElements = [{ id: mainLabel.id, type: "text" }];
  const elements = [box, mainLabel];

  // Optional sub-label below the main label
  if (opts?.subLabel) {
    const sub = createTextElement(
      opts.subLabel,
      x + width / 2 - textWidth(opts.subLabel, 11) / 2,
      y + height / 2 + 2,
      11, theme.fontFamily,
      box.id
    );
    sub.strokeColor = theme.arrow;
    (sub as any).textAlign = "center";
    box.boundElements!.push({ id: sub.id, type: "text" });
    elements.push(sub);
  }

  return { elements, primary: box, cx: x + width / 2, cy: y + height / 2 };
}

// ── Annotation ────────────────────────────────────────────────

/**
 * A sticky-note annotation — smaller, colored, offset from main flow.
 * Use for: comments, notes, side remarks.
 */
export function Annotation(
  x: number, y: number,
  text: string,
  stroke: string, bg: string,
  theme: ThemeConfig
): Component {
  const width = Math.max(textWidth(text, 13) + 20, 100);
  const height = 45;

  const note = createElement("rectangle", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: 1,
    roughness: theme.roughness,
    roundness: { type: 1 },
    strokeStyle: "dashed",
    opacity: 80,
  });

  const label = createTextElement(
    text,
    x + width / 2 - textWidth(text, 13) / 2,
    y + height / 2 - 9,
    13, theme.fontFamily,
    note.id
  );
  label.strokeColor = theme.text;
  (label as any).fontStyle = "italic";

  note.boundElements = [{ id: label.id, type: "text" }];
  return { elements: [note, label], primary: note, cx: x + width / 2, cy: y + height / 2 };
}

// ── DecisionBox ────────────────────────────────────────────────

/**
 * A decision diamond — for conditional branches.
 * Use for: if/else, switch, validation gates.
 */
export function DecisionBox(
  x: number, y: number,
  width: number, height: number,
  label: string,
  stroke: string, bg: string,
  theme: ThemeConfig
): Component {
  const diamond = createElement("diamond", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: theme.roundness,
  });

  const text = createTextElement(
    label,
    x + width / 2 - textWidth(label, theme.fontSize) / 2,
    y + height / 2 - theme.fontSize * 0.6,
    theme.fontSize,
    theme.fontFamily,
    diamond.id
  );
  text.strokeColor = theme.text;

  diamond.boundElements = [{ id: text.id, type: "text" }];
  return { elements: [diamond, text], primary: diamond, cx: x + width / 2, cy: y + height / 2 };
}

// ── DataStore ─────────────────────────────────────────────────

/**
 * A database/data store — cylinder shape.
 * Use for: databases, caches, message queues, any persistent store.
 */
export function DataStore(
  x: number, y: number,
  width: number, height: number,
  label: string,
  stroke: string, bg: string,
  theme: ThemeConfig
): Component {
  const h = height || 70;
  const w = width || 100;
  const elH = 20;

  const top = createElement("ellipse", {
    x, y, width: w, height: elH,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: null,
  });

  const body = createElement("line", {
    x, y: y + elH / 2, width: 0, height: h - elH,
    strokeColor: stroke, strokeWidth: theme.strokeWidth,
    roughness: theme.roughness, roundness: null,
  }) as any;
  // Body should be two vertical lines (left and right edges)
  body.points = [[0, 0], [0, h - elH]];

  // Use a rectangle for the body instead — simpler
  const bodyRect = createElement("rectangle", {
    x, y: y + elH / 2, width: w, height: h - elH,
    strokeColor: "transparent", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 0, roughness: 0, roundness: null,
  });

  // Side lines for cylinder
  const leftLine = createElement("line", {
    x, y: y + elH / 2, width: 0, height: h - elH,
    strokeColor: stroke, strokeWidth: theme.strokeWidth,
    roughness: theme.roughness, roundness: null,
  });
  (leftLine as any).points = [[0, 0], [0, h - elH]];

  const rightLine = createElement("line", {
    x: x + w, y: y + elH / 2, width: 0, height: h - elH,
    strokeColor: stroke, strokeWidth: theme.strokeWidth,
    roughness: theme.roughness, roundness: null,
  });
  (rightLine as any).points = [[0, 0], [0, h - elH]];

  const bottom = createElement("ellipse", {
    x, y: y + h - elH, width: w, height: elH,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: null,
  });

  // Label below the cylinder
  const text = createTextElement(
    label,
    x + w / 2 - textWidth(label, 13) / 2,
    y + h + 5,
    13, theme.fontFamily
  );
  text.strokeColor = theme.text;

  return {
    elements: [top, leftLine, rightLine, bottom, text],
    primary: top,
    cx: x + w / 2,
    cy: y + h / 2,
  };
}
