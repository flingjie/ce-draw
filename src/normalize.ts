/**
 * Style normalizer + element factory.
 *
 * `normalize()` ensures all elements share the same visual identity.
 * `createElement()` is the single source of truth for element construction.
 */

import type { ExcalidrawElement, ExcalidrawDocument, ThemeConfig } from "./types.js";

// ── ID & Text Helpers ──────────────────────────────────────────

/** Create an element ID using Node.js built-in crypto. */
export function makeId(): string {
  return crypto.randomUUID();
}

/**
 * Compute a deterministic seed from an element ID via djb2 hash.
 * Replaces Math.random() — same ID → same seed → same roughness
 * jitter in Excalidraw. This makes golden tests reproducible.
 */
function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0; // 32-bit integer
  }
  return Math.abs(hash) % 0x7fffffff;
}

/** Estimate text display width. 0.6× for ASCII, 1.0× for CJK/emoji. */
export function textWidth(content: string, fontSize: number): number {
  let width = 0;
  for (const ch of content) {
    if (/[一-鿿　-〿＀-￯\u{1f300}-\u{1f9ff}]/u.test(ch)) {
      width += fontSize;
    } else {
      width += fontSize * 0.6;
    }
  }
  return width || fontSize;
}

// ── Element Factory ────────────────────────────────────────────

/**
 * Shared element factory — the single source of truth for building
 * Excalidraw element dicts. Every element originates here.
 */
export function createElement(
  type: string,
  overrides: Record<string, any> = {}
): ExcalidrawElement {
  const id = overrides.id ?? makeId();
  return {
    id,
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
    isDeleted: false,
    link: null,
    updated: 0,
    seed: hashSeed(id),
    version: 2,
    versionNonce: 0,
    frameId: null,
    ...overrides,
  } as unknown as ExcalidrawElement;
}

/** Create a text element with text-specific defaults. */
export function createTextElement(
  content: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: number,
  containerId: string | null = null
): ExcalidrawElement {
  return createElement("text", {
    x, y,
    width: textWidth(content, fontSize),
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
    boundElements: [],
    roundness: { type: 2 },
  });
}

/** Build the appState section of an .excalidraw document. */
export function buildAppState(theme: ThemeConfig): ExcalidrawDocument["appState"] {
  return {
    gridSize: null,
    viewBackgroundColor: theme.background,
    currentItemFontFamily: theme.fontFamily,
    currentItemFontSize: theme.fontSize,
    theme: theme.name === "dark" ? "dark" : "light",
  };
}

// ── Style Normalization ────────────────────────────────────────

/**
 * Apply a theme to a single element. Returns a new element.
 */
export function normalizeElement(
  el: ExcalidrawElement,
  theme: ThemeConfig,
  colorIndex: number
): ExcalidrawElement {
  const [stroke, bg] = theme.shapes[colorIndex % theme.shapes.length];

  const base = {
    ...el,
    strokeColor: theme.arrow,
    backgroundColor: "transparent",
    fillStyle: theme.fillStyle,
    strokeWidth: theme.strokeWidth,
    strokeStyle: theme.strokeStyle,
    roughness: theme.roughness,
    opacity: 100,
    seed: hashSeed(el.id),
  };

  switch (el.type) {
    case "rectangle":
    case "ellipse":
    case "diamond":
      return { ...base, strokeColor: stroke, backgroundColor: bg, roundness: theme.roundness };

    case "arrow":
    case "line":
      return { ...base, strokeColor: theme.arrow, backgroundColor: "transparent", roundness: { type: 2 } };

    case "text":
      return {
        ...base,
        strokeColor: theme.text,
        backgroundColor: "transparent",
        roundness: { type: 2 },
        strokeWidth: 1,
        ...("fontFamily" in el ? { fontFamily: theme.fontFamily } : {}),
        ...("fontSize" in el ? { fontSize: theme.fontSize } : {}),
      };

    case "frame":
      return {
        ...base,
        strokeColor: theme.accent,
        backgroundColor: "transparent",
        strokeStyle: "dashed",
        roundness: { type: 2 },
      };

    default:
      return base;
  }
}

/**
 * Apply a theme to all elements. Color-cycles shapes.
 */
export function normalize(
  elements: ExcalidrawElement[],
  theme: ThemeConfig
): ExcalidrawElement[] {
  let colorIndex = 0;
  return elements.map((el) => {
    const isShape = ["rectangle", "ellipse", "diamond"].includes(el.type);
    const normalized = normalizeElement(el, theme, isShape ? colorIndex : 0);
    if (isShape) colorIndex++;
    return normalized;
  });
}
