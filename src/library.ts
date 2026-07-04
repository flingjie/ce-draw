/**
 * Icon library — reusable Excalidraw element presets for common
 * diagram symbols. Each icon is a function that takes position
 * and color, returning one or more elements.
 */

import type { ExcalidrawElement } from "./types.js";
import { makeId } from "./normalize.js";

export interface IconDef {
  /** Build icon elements at the given position with given colors. */
  render: (x: number, y: number, stroke: string, bg: string) => ExcalidrawElement[];
  /** Default width of the icon. */
  width: number;
  /** Default height of the icon. */
  height: number;
}

function icon(
  w: number,
  h: number,
  fn: (x: number, y: number, s: string, b: string) => ExcalidrawElement[]
): IconDef {
  return { render: fn, width: w, height: h };
}

const base = (type: string, overrides: Record<string, any> = {}): ExcalidrawElement =>
  ({
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
    seed: 12345,
    version: 2,
    versionNonce: 0,
    frameId: null,
    ...overrides,
  }) as unknown as ExcalidrawElement;

export const ICONS: Record<string, IconDef> = {
  database: icon(80, 70, (x, y, s, b) => {
    const w = 80;
    return [
      base("ellipse", { x, y: y + 40, width: w, height: 30, strokeColor: s, backgroundColor: b }),
      base("line", {
        x,
        y: y + 5,
        width: w,
        height: 0,
        points: [{ x: 0, y: 0 }, { x: w, y: 0 }],
        strokeColor: s,
      }),
      base("line", {
        x,
        y: y + 55,
        width: w,
        height: 0,
        points: [{ x: 0, y: 0 }, { x: w, y: 0 }],
        strokeColor: s,
      }),
      base("ellipse", { x, y, width: w, height: 30, strokeColor: s, backgroundColor: b }),
    ];
  }),

  server: icon(60, 80, (x, y, s, b) => {
    return [
      base("rectangle", { x, y, width: 60, height: 80, strokeColor: s, backgroundColor: b, roundness: { type: 2 } }),
      base("rectangle", { x: x + 5, y: y + 15, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
      base("rectangle", { x: x + 5, y: y + 33, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
      base("rectangle", { x: x + 5, y: y + 51, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
    ];
  }),

  cloud: icon(100, 60, (x, y, s, b) => {
    return [
      base("ellipse", { x, y: y + 10, width: 80, height: 50, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x: x + 20, y, width: 60, height: 40, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x: x + 40, y: y + 5, width: 55, height: 45, strokeColor: s, backgroundColor: b }),
    ];
  }),

  user: icon(60, 70, (x, y, s, b) => {
    return [
      base("ellipse", { x: x + 10, y, width: 40, height: 40, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x, y: y + 45, width: 60, height: 25, strokeColor: s, backgroundColor: b }),
    ];
  }),

  gear: icon(60, 60, (x, y, s, b) => {
    return [
      base("ellipse", { x, y, width: 60, height: 60, strokeColor: s, backgroundColor: b, strokeWidth: 3 }),
      base("ellipse", { x: x + 20, y: y + 20, width: 20, height: 20, strokeColor: s, fillStyle: "solid" }),
    ];
  }),

  document: icon(60, 80, (x, y, s, b) => {
    const w = 60;
    return [
      base("rectangle", { x, y, width: w, height: 80, strokeColor: s, backgroundColor: b, roundness: { type: 1 } }),
      base("line", { x: x + 10, y: y + 20, width: 40, height: 0, points: [{ x: 0, y: 0 }, { x: 40, y: 0 }], strokeColor: s, strokeWidth: 1 }),
      base("line", { x: x + 10, y: y + 35, width: 35, height: 0, points: [{ x: 0, y: 0 }, { x: 35, y: 0 }], strokeColor: s, strokeWidth: 1 }),
      base("line", { x: x + 10, y: y + 50, width: 30, height: 0, points: [{ x: 0, y: 0 }, { x: 30, y: 0 }], strokeColor: s, strokeWidth: 1 }),
    ];
  }),

  globe: icon(70, 70, (x, y, s, b) => {
    return [
      base("ellipse", { x, y, width: 70, height: 70, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x: x + 30, y, width: 10, height: 70, strokeColor: s, fillStyle: "hachure", strokeWidth: 1 }),
      base("line", { x, y: y + 35, width: 70, height: 0, points: [{ x: 0, y: 0 }, { x: 70, y: 0 }], strokeColor: s, strokeWidth: 1 }),
    ];
  }),

  mobile: icon(50, 90, (x, y, s, b) => {
    return [
      base("rectangle", { x, y, width: 50, height: 90, strokeColor: s, backgroundColor: b, roundness: { type: 3 } }),
      base("rectangle", { x: x + 5, y: y + 15, width: 40, height: 60, strokeColor: s, fillStyle: "solid", strokeWidth: 1, roundness: { type: 1 } }),
    ];
  }),

  lock: icon(50, 60, (x, y, s, b) => {
    return [
      base("rectangle", { x: x + 5, y: y + 25, width: 40, height: 35, strokeColor: s, backgroundColor: b, roundness: { type: 1 } }),
      base("line", {
        x: x + 12,
        y: y + 10,
        width: 26,
        height: 0,
        points: [
          { x: 0, y: 15 },
          { x: 26, y: 15 },
        ],
        strokeColor: s,
        strokeWidth: 3,
      }),
    ];
  }),

  fire: icon(50, 60, (x, y, s, b) => {
    return [
      base("ellipse", { x: x + 5, y: y + 20, width: 40, height: 40, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x: x + 15, y, width: 20, height: 30, strokeColor: s, backgroundColor: b }),
      base("ellipse", { x: x + 20, y: y + 5, width: 10, height: 15, strokeColor: s, backgroundColor: b }),
    ];
  }),
};

export function listIcons(): string[] {
  return Object.keys(ICONS);
}
