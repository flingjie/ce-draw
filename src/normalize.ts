/**
 * Style normalizer — applies a ThemeConfig to Excalidraw elements.
 *
 * This is the key to "Style Normalize": no matter how elements are
 * created (Mermaid, manual, library), `normalize()` ensures they all
 * share the same visual identity.
 */

import type { ExcalidrawElement, ThemeConfig } from "./types.js";
import { v4 as uuid } from "uuid";

/**
 * Apply a theme to a single element, normalizing its visual properties.
 * Returns a new element (does not mutate the original).
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
    strokeSharpness: "round" as const,
    seed: Math.floor(Math.random() * 0x7fffffff),
  };

  // Shape-specific normalization
  switch (el.type) {
    case "rectangle":
    case "ellipse":
    case "diamond":
      return {
        ...base,
        strokeColor: stroke,
        backgroundColor: bg,
        roundness: theme.roundness,
      };

    case "arrow":
    case "line":
      return {
        ...base,
        strokeColor: theme.arrow,
        backgroundColor: "transparent",
        roundness: null,
      };

    case "text":
      return {
        ...base,
        strokeColor: theme.text,
        backgroundColor: "transparent",
        roundness: null,
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
        roundness: null,
      };

    default:
      return base;
  }
}

/**
 * Apply a theme to all elements in an array.
 * Color-cycles shapes while keeping arrows and text consistent.
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

/**
 * Create an element ID. Wraps uuid for consistency.
 */
export function makeId(): string {
  return uuid();
}
