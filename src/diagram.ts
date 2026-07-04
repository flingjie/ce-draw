/**
 * Diagram builder — programmatic API for creating Excalidraw diagrams.
 *
 * Use this for freeform layouts (architecture diagrams, whiteboard sketches)
 * where you need full control over element placement.
 *
 * For structured diagrams (flowcharts, sequences, ER), prefer mermaidToExcalidraw().
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import type { ExcalidrawElement, ExcalidrawDocument, ShapeType } from "./types.js";
import { getTheme, type ThemeConfig } from "./themes.js";
import { normalizeElement, createElement, createTextElement, buildAppState, textWidth } from "./normalize.js";
import { ICONS } from "./library.js";

export interface BoxOptions {
  row?: number;
  col?: number;
  span?: number;
  width?: number;
  height?: number;
  shape?: ShapeType;
}

export class Diagram {
  theme: ThemeConfig;
  elements: ExcalidrawElement[];
  private _named: Map<string, ExcalidrawElement>;
  private _colorIdx: number;
  private _cols: number;
  private _cellW: number;
  private _cellH: number;
  private _gapX: number;
  private _gapY: number;

  constructor(
    theme: string | ThemeConfig = "sketchy",
    opts: {
      cols?: number;
      cellW?: number;
      cellH?: number;
      gapX?: number;
      gapY?: number;
    } = {}
  ) {
    this.theme = typeof theme === "string" ? getTheme(theme) : theme;
    this.elements = [];
    this._named = new Map();
    this._colorIdx = 0;
    this._cols = opts.cols ?? 3;
    this._cellW = opts.cellW ?? 160;
    this._cellH = opts.cellH ?? 80;
    this._gapX = opts.gapX ?? 40;
    this._gapY = opts.gapY ?? 50;
  }

  private _gridPos(index: number): { x: number; y: number } {
    const col = index % this._cols;
    const row = Math.floor(index / this._cols);
    return {
      x: 50 + col * (this._cellW + this._gapX),
      y: 50 + row * (this._cellH + this._gapY),
    };
  }

  /** Add a labeled box to the diagram. */
  addBox(
    name: string,
    opts: BoxOptions = {}
  ): ExcalidrawElement {
    let idx: number;
    if (opts.row !== undefined && opts.col !== undefined) {
      idx = opts.row * this._cols + opts.col;
    } else {
      idx = this._named.size;
    }

    const { x, y } = this._gridPos(idx);
    const span = opts.span ?? 1;
    const w = opts.width ?? (this._cellW + (span - 1) * (this._cellW + this._gapX));
    const h = opts.height ?? this._cellH;
    const shape = opts.shape ?? "rectangle";

    const [stroke, bg] = this.theme.shapes[this._colorIdx % this.theme.shapes.length];
    this._colorIdx++;

    const el = normalizeElement(
      createElement(shape, {
        x, y, width: w, height: h,
        strokeColor: stroke, backgroundColor: bg,
        fillStyle: this.theme.fillStyle,
        strokeWidth: this.theme.strokeWidth,
        strokeStyle: this.theme.strokeStyle,
        roughness: this.theme.roughness,
        roundness: this.theme.roundness,
      }),
      this.theme,
      this._colorIdx - 1
    );

    this.elements.push(el);
    this._named.set(name, el);

    // Bound text label
    if (name) {
      const textEl = normalizeElement(
        createTextElement(
          name,
          x + w / 2 - textWidth(name, this.theme.fontSize) / 2,
          y + h / 2 - this.theme.fontSize * 0.6,
          this.theme.fontSize,
          this.theme.fontFamily,
          el.id
        ),
        this.theme,
        0
      ) as any;
      textEl.strokeColor = this.theme.text;
      textEl.containerId = el.id;
      textEl.originalText = name;

      el.boundElements = [{ id: textEl.id, type: "text" }];
      this.elements.push(textEl);
    }

    return el;
  }

  /** Connect two named boxes with an arrow. */
  addArrow(
    fromName: string,
    toName: string,
    opts: { label?: string } = {}
  ): ExcalidrawElement {
    const from = this._named.get(fromName);
    const to = this._named.get(toName);
    if (!from) throw new Error(`No element named "${fromName}"`);
    if (!to) throw new Error(`No element named "${toName}"`);

    const fx = from.x + from.width;
    const fy = from.y + from.height / 2;
    const tx = to.x;
    const ty = to.y + to.height / 2;
    const dx = tx - fx;
    const dy = ty - fy;

    const el = normalizeElement(
      createElement("arrow", {
        x: fx, y: fy, width: dx, height: dy,
        strokeColor: this.theme.arrow,
        roundness: null,
      }),
      this.theme,
      0
    ) as any;
    el.points = [{ x: 0, y: 0 }, { x: dx, y: dy }];
    el.startArrowhead = null;
    el.endArrowhead = "arrow";
    el.startBinding = null;
    el.endBinding = null;

    if (opts.label) {
      const textEl = normalizeElement(
        createTextElement(
          opts.label,
          fx + dx / 2 - textWidth(opts.label, 14) / 2,
          fy + dy / 2 - this.theme.fontSize * 1.2,
          14,
          this.theme.fontFamily,
          el.id
        ),
        this.theme,
        0
      ) as any;
      textEl.strokeColor = this.theme.text;
      textEl.containerId = el.id;
      textEl.originalText = opts.label;

      el.boundElements = [{ id: textEl.id, type: "text" }];
      this.elements.push(textEl);
    }

    this.elements.push(el);
    return el;
  }

  /** Add a standalone text element. */
  addText(content: string, x: number, y: number, fontSize?: number): ExcalidrawElement {
    const fs = fontSize ?? this.theme.fontSize;
    const el = normalizeElement(
      createTextElement(content, x, y, fs, this.theme.fontFamily),
      this.theme,
      0
    ) as any;
    el.strokeColor = this.theme.text;
    el.originalText = content;
    this.elements.push(el);
    return el;
  }

  /** Place an icon from the library at a position. */
  addIcon(
    iconName: string,
    x: number,
    y: number,
    colorIndex: number = 0
  ): void {
    const icon = ICONS[iconName];
    if (!icon) {
      throw new Error(`Unknown icon "${iconName}". Available: ${Object.keys(ICONS).join(", ")}`);
    }
    const [stroke, bg] = this.theme.shapes[colorIndex % this.theme.shapes.length];
    const elements = icon.render(x, y, stroke, bg);
    for (const el of elements) {
      this.elements.push(normalizeElement(el, this.theme, colorIndex));
    }
  }

  /** Convert to a plain object (for JSON serialization). */
  toDocument(): ExcalidrawDocument {
    return {
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: this.elements,
      appState: buildAppState(this.theme),
      files: {},
    };
  }

  /** Serialize to JSON string. */
  toJSON(): string {
    return JSON.stringify(this.toDocument(), null, 2);
  }

  /** Save to a .excalidraw file. */
  save(filepath: string): string {
    const path = filepath.endsWith(".excalidraw") ? filepath : filepath + ".excalidraw";
    writeFileSync(path, this.toJSON(), "utf-8");
    return resolve(path);
  }
}
