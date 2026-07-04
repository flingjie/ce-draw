/**
 * Icon library — reusable Excalidraw element presets for common
 * diagram symbols. Each icon is a function that takes position
 * and color, returning one or more elements.
 */

import type { ExcalidrawElement } from "./types.js";
import { createElement } from "./normalize.js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

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

export const ICONS: Record<string, IconDef> = {
  database: icon(80, 70, (x, y, s, b) => {
    const w = 80;
    return [
      createElement("ellipse", { x, y: y + 40, width: w, height: 30, strokeColor: s, backgroundColor: b }),
      createElement("line", {
        x,
        y: y + 5,
        width: w,
        height: 0,
        points: [[0, 0], [w, 0]],
        strokeColor: s,
      }),
      createElement("line", {
        x,
        y: y + 55,
        width: w,
        height: 0,
        points: [[0, 0], [w, 0]],
        strokeColor: s,
      }),
      createElement("ellipse", { x, y, width: w, height: 30, strokeColor: s, backgroundColor: b }),
    ];
  }),

  server: icon(60, 80, (x, y, s, b) => {
    return [
      createElement("rectangle", { x, y, width: 60, height: 80, strokeColor: s, backgroundColor: b, roundness: { type: 2 } }),
      createElement("rectangle", { x: x + 5, y: y + 15, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
      createElement("rectangle", { x: x + 5, y: y + 33, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
      createElement("rectangle", { x: x + 5, y: y + 51, width: 50, height: 8, strokeColor: s, fillStyle: "solid" }),
    ];
  }),

  cloud: icon(100, 60, (x, y, s, b) => {
    return [
      createElement("ellipse", { x, y: y + 10, width: 80, height: 50, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x: x + 20, y, width: 60, height: 40, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x: x + 40, y: y + 5, width: 55, height: 45, strokeColor: s, backgroundColor: b }),
    ];
  }),

  user: icon(60, 70, (x, y, s, b) => {
    return [
      createElement("ellipse", { x: x + 10, y, width: 40, height: 40, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x, y: y + 45, width: 60, height: 25, strokeColor: s, backgroundColor: b }),
    ];
  }),

  gear: icon(60, 60, (x, y, s, b) => {
    return [
      createElement("ellipse", { x, y, width: 60, height: 60, strokeColor: s, backgroundColor: b, strokeWidth: 3 }),
      createElement("ellipse", { x: x + 20, y: y + 20, width: 20, height: 20, strokeColor: s, fillStyle: "solid" }),
    ];
  }),

  document: icon(60, 80, (x, y, s, b) => {
    const w = 60;
    return [
      createElement("rectangle", { x, y, width: w, height: 80, strokeColor: s, backgroundColor: b, roundness: { type: 1 } }),
      createElement("line", { x: x + 10, y: y + 20, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: s, strokeWidth: 1 }),
      createElement("line", { x: x + 10, y: y + 35, width: 35, height: 0, points: [[0, 0], [35, 0]], strokeColor: s, strokeWidth: 1 }),
      createElement("line", { x: x + 10, y: y + 50, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: s, strokeWidth: 1 }),
    ];
  }),

  globe: icon(70, 70, (x, y, s, b) => {
    return [
      createElement("ellipse", { x, y, width: 70, height: 70, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x: x + 30, y, width: 10, height: 70, strokeColor: s, fillStyle: "hachure", strokeWidth: 1 }),
      createElement("line", { x, y: y + 35, width: 70, height: 0, points: [[0, 0], [70, 0]], strokeColor: s, strokeWidth: 1 }),
    ];
  }),

  mobile: icon(50, 90, (x, y, s, b) => {
    return [
      createElement("rectangle", { x, y, width: 50, height: 90, strokeColor: s, backgroundColor: b, roundness: { type: 3 } }),
      createElement("rectangle", { x: x + 5, y: y + 15, width: 40, height: 60, strokeColor: s, fillStyle: "solid", strokeWidth: 1, roundness: { type: 1 } }),
    ];
  }),

  lock: icon(50, 60, (x, y, s, b) => {
    return [
      createElement("rectangle", { x: x + 5, y: y + 25, width: 40, height: 35, strokeColor: s, backgroundColor: b, roundness: { type: 1 } }),
      createElement("line", {
        x: x + 12,
        y: y + 10,
        width: 26,
        height: 0,
        points: [
          [0, 15],
          [26, 15],
        ],
        strokeColor: s,
        strokeWidth: 3,
      }),
    ];
  }),

  fire: icon(50, 60, (x, y, s, b) => {
    return [
      createElement("ellipse", { x: x + 5, y: y + 20, width: 40, height: 40, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x: x + 15, y, width: 20, height: 30, strokeColor: s, backgroundColor: b }),
      createElement("ellipse", { x: x + 20, y: y + 5, width: 10, height: 15, strokeColor: s, backgroundColor: b }),
    ];
  }),

  message_queue: icon(100, 50, (x, y, s, b) => {
    const w = 100;
    return [
      createElement("rectangle", { x, y, width: w, height: 50, strokeColor: s, backgroundColor: b, roundness: { type: 2 } }),
      createElement("line", { x: x + 10, y: y + 15, width: w - 20, height: 0, points: [[0,0],[w-20,0]], strokeColor: s, strokeWidth: 1, strokeStyle: "dashed" }),
      createElement("line", { x: x + 10, y: y + 27, width: w - 20, height: 0, points: [[0,0],[w-20,0]], strokeColor: s, strokeWidth: 1, strokeStyle: "dashed" }),
      createElement("line", { x: x + 10, y: y + 39, width: w - 20, height: 0, points: [[0,0],[w-20,0]], strokeColor: s, strokeWidth: 1, strokeStyle: "dashed" }),
    ];
  }),

  firewall: icon(40, 80, (x, y, s, b) => {
    return [
      createElement("rectangle", { x, y, width: 13, height: 80, strokeColor: s, backgroundColor: b, strokeWidth: 3, roughness: 0 }),
      createElement("rectangle", { x: x + 27, y, width: 13, height: 80, strokeColor: s, backgroundColor: b, strokeWidth: 3, roughness: 0 }),
      createElement("line", { x: x + 20, y: y + 10, width: 0, height: 60, points: [[0,0],[0,60]], strokeColor: s, strokeWidth: 1, strokeStyle: "dashed" }),
    ];
  }),
};

export function listIcons(): string[] {
  return Object.keys(ICONS);
}

// ── External Library Loader (.excalidrawlib) ──────────────────

interface LibItem {
  id: string;
  status: string;
  name?: string;
  elements: ExcalidrawElement[];
}

interface LibFile {
  type: "excalidrawlib";
  version: 2;
  source: string;
  libraryItems: LibItem[];
}

let _libraries: Map<string, LibFile> | null = null;

function _findLibDir(): string {
  for (const p of [
    resolve(process.cwd(), "library"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../library"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../library"),
  ]) { if (existsSync(p)) return p; }
  throw new Error("library/ directory not found");
}

function _loadAllLibraries(): Map<string, LibFile> {
  if (_libraries) return _libraries;
  _libraries = new Map();
  const dir = _findLibDir();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".excalidrawlib")) continue;
    _libraries.set(basename(f, ".excalidrawlib"),
      JSON.parse(readFileSync(resolve(dir, f), "utf-8")) as LibFile);
  }
  // Normalize: some files use "library" (array of element arrays)
  // instead of "libraryItems" (array of {id, elements})
  for (const [name, lib] of _libraries) {
    if (!lib.libraryItems && (lib as any).library) {
      lib.libraryItems = (lib as any).library.map((elements: any[], i: number) => ({
        id: elements[0]?.id || crypto.randomUUID(),
        status: "published",
        name: `${name}:${i}`,
        elements: Array.isArray(elements) ? elements : [elements],
      }));
    }
  }
  return _libraries;
}

export function listLibraries(): string[] {
  return [..._loadAllLibraries().keys()];
}

export function listLibrary(name: string): string[] {
  const lib = _loadAllLibraries().get(name);
  if (!lib) throw new Error(`Library "${name}" not found. Available: ${listLibraries().join(", ")}`);
  return lib.libraryItems.map((item, i) => item.name || `${name}:${i}`);
}

export function loadLibraryIcon(
  libraryName: string, iconName: string,
  x: number, y: number,
  opts?: { stroke?: string; bg?: string; scale?: number }
): ExcalidrawElement[] {
  const lib = _loadAllLibraries().get(libraryName);
  if (!lib) throw new Error(`Library "${libraryName}" not found`);

  let item: LibItem | undefined;
  if (iconName.startsWith(`${libraryName}:`)) {
    item = lib.libraryItems[parseInt(iconName.split(":")[1], 10)];
  } else {
    item = lib.libraryItems.find(i => i.name === iconName);
  }
  if (!item) throw new Error(`Icon "${iconName}" not found in "${libraryName}"`);

  let minX = Infinity, minY = Infinity;
  for (const el of item.elements) { minX = Math.min(minX, el.x); minY = Math.min(minY, el.y); }

  const s = opts?.scale ?? 1;
  return item.elements.map(el => ({
    ...el, id: crypto.randomUUID(),
    x: x + (el.x - minX) * s, y: y + (el.y - minY) * s,
    width: el.width * s, height: el.height * s,
    strokeColor: opts?.stroke || el.strokeColor,
    backgroundColor: opts?.bg || el.backgroundColor,
    seed: Math.floor(Math.random() * 0x7fffffff),
  })) as ExcalidrawElement[];
}
