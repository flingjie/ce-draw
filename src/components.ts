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
import type { IconDef } from "./library.js";

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
  /** Inner content area for child placement (Section returns this). */
  bounds?: { x: number; y: number; width: number; height: number };
  /** Semantic role for color resolution. */
  role?: string;
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

// ── Card ────────────────────────────────────────────────────

/**
 * A semantic card — rectangle with title, subtitle, icon, and optional role.
 * Evolved from ProcessBox. Use for: service boxes, concept items, process steps.
 */
export function Card(
  x: number, y: number,
  width: number, height: number,
  title: string,
  stroke: string, bg: string,
  theme: ThemeConfig,
  opts?: {
    subtitle?: string;
    icon?: IconDef;
    role?: string;
  }
): Component {
  const box = createElement("rectangle", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: theme.roundness,
  });

  const hasSubtitle = !!opts?.subtitle;
  const hasIcon = !!opts?.icon;

  let textOffsetX = 0;
  const elements: ExcalidrawElement[] = [box];

  // Icon on the left, vertically centered
  if (hasIcon) {
    const iconDef = opts!.icon!;
    const iconY = y + (height - iconDef.height) / 2;
    const iconEls = iconDef.render(x + 12, iconY, stroke, bg);
    elements.push(...iconEls);
    textOffsetX = iconDef.width + 8;
  }

  // Title — centered vertically in the remaining text area
  const textAreaX = x + textOffsetX;
  const textAreaW = width - textOffsetX;
  const titleOffsetY = hasSubtitle ? 1.1 : 0.6;

  const titleEl = createTextElement(
    title,
    textAreaX + textAreaW / 2 - textWidth(title, theme.fontSize) / 2,
    y + height / 2 - theme.fontSize * titleOffsetY,
    theme.fontSize,
    theme.fontFamily,
    box.id
  );
  titleEl.strokeColor = theme.text;
  box.boundElements = [{ id: titleEl.id, type: "text" }];
  elements.push(titleEl);

  // Subtitle below title
  if (hasSubtitle) {
    const sub = createTextElement(
      opts!.subtitle!,
      textAreaX + textAreaW / 2 - textWidth(opts!.subtitle!, 12) / 2,
      y + height / 2 + 2,
      12, theme.fontFamily,
      box.id
    );
    sub.strokeColor = theme.arrow;
    box.boundElements!.push({ id: sub.id, type: "text" });
    elements.push(sub);
  }

  return {
    elements,
    primary: box,
    cx: x + width / 2,
    cy: y + height / 2,
    role: opts?.role,
  };
}

// ── Section ──────────────────────────────────────────────────

/**
 * A visual section — container frame with heading and optional subtitle.
 * Returns `bounds` for child card placement.
 * Use for: grouping related cards, narrative zones, framework partitions.
 */
export function Section(
  x: number, y: number,
  width: number, height: number,
  heading: string,
  stroke: string, bg: string,
  theme: ThemeConfig,
  opts?: {
    subtitle?: string;
    role?: string;
  }
): Component {
  if (height < 60) {
    throw new Error(
      `Section height must be ≥ 60px (got ${height}). Heading + padding require minimum space.`
    );
  }

  // Frame — dashed border, distinct from Card
  const frame = createElement("rectangle", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: "solid",
    strokeWidth: theme.strokeWidth,
    roughness: theme.roughness,
    roundness: { type: 2 },
    strokeStyle: "dashed",
    opacity: 90,
  });

  const elements: ExcalidrawElement[] = [frame];

  // Heading — bold, left-aligned inside frame
  const headingEl = createTextElement(
    heading,
    x + 16,
    y + 16,
    theme.fontSize,
    theme.fontFamily,
    frame.id
  );
  headingEl.strokeColor = theme.text;
  (headingEl as any).textAlign = "left";
  frame.boundElements = [{ id: headingEl.id, type: "text" }];
  elements.push(headingEl);

  const hasSubtitle = !!opts?.subtitle;
  const subtitleHeight = hasSubtitle ? 16 : 0;

  // Subtitle below heading
  if (hasSubtitle) {
    const subEl = createTextElement(
      opts!.subtitle!,
      x + 16,
      y + 38,
      12, theme.fontFamily,
      frame.id
    );
    subEl.strokeColor = theme.arrow;
    (subEl as any).textAlign = "left";
    frame.boundElements!.push({ id: subEl.id, type: "text" });
    elements.push(subEl);
  }

  // Bounds: inner content area for child cards
  const padX = 16;
  const padY = 16;
  const headingHeight = 24;
  const topReserved = padY + headingHeight + subtitleHeight + 8;

  return {
    elements,
    primary: frame,
    cx: x + width / 2,
    cy: y + height / 2,
    bounds: {
      x: x + padX,
      y: y + topReserved,
      width: width - 2 * padX,
      height: height - topReserved - padY,
    },
    role: opts?.role,
  };
}

// ── Callout ──────────────────────────────────────────────────

/**
 * A full-width emphasis bar — icon + bold text.
 * Evolved from Annotation. Use for: key insights, warnings, bottom-line messages.
 */
export function Callout(
  x: number, y: number,
  width: number,
  text: string,
  stroke: string, bg: string,
  theme: ThemeConfig,
  opts?: {
    icon?: IconDef;
    role?: string;
  }
): Component {
  const height = 48;

  const rect = createElement("rectangle", {
    x, y, width, height,
    strokeColor: stroke, backgroundColor: bg,
    fillStyle: "solid",
    strokeWidth: theme.strokeWidth + 1,
    roughness: theme.roughness,
    roundness: { type: 2 },
  });

  const elements: ExcalidrawElement[] = [rect];

  let textOffsetX = 0;
  if (opts?.icon) {
    const iconDef = opts.icon;
    const iconY = y + (height - iconDef.height) / 2;
    const iconEls = iconDef.render(x + 16, iconY, stroke, bg);
    elements.push(...iconEls);
    textOffsetX = iconDef.width + 8;
  }

  // Bold text, left-aligned
  const textEl = createTextElement(
    text,
    x + 16 + textOffsetX,
    y + 14,
    theme.fontSize,
    theme.fontFamily,
    rect.id
  );
  textEl.strokeColor = theme.text;
  (textEl as any).textAlign = "left";

  rect.boundElements = [{ id: textEl.id, type: "text" }];
  elements.push(textEl);

  return {
    elements,
    primary: rect,
    cx: x + width / 2,
    cy: y + height / 2,
    role: opts?.role,
  };
}
