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
import { normalizeElement, makeId } from "./normalize.js";
import { ICONS, type IconDef } from "./library.js";

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
      {
        id: makeId(),
        type: shape,
        x, y,
        width: w, height: h,
        angle: 0,
        strokeColor: stroke,
        backgroundColor: bg,
        fillStyle: this.theme.fillStyle,
        strokeWidth: this.theme.strokeWidth,
        strokeStyle: this.theme.strokeStyle,
        roughness: this.theme.roughness,
        opacity: 100,
        groupIds: [],
        roundness: this.theme.roundness,
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
      } as ExcalidrawElement,
      this.theme,
      this._colorIdx - 1
    );

    this.elements.push(el);
    this._named.set(name, el);

    // Add text label bound to this shape
    if (name) {
      const textEl = normalizeElement(
        {
          id: makeId(),
          type: "text",
          x: x + w / 2 - name.length * this.theme.fontSize * 0.3,
          y: y + h / 2 - this.theme.fontSize * 0.6,
          width: name.length * this.theme.fontSize * 0.6,
          height: this.theme.fontSize * 1.5,
          angle: 0,
          strokeColor: this.theme.text,
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
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
        } as ExcalidrawElement,
        this.theme,
        0
      ) as any;
      textEl.text = name;
      textEl.fontSize = this.theme.fontSize;
      textEl.fontFamily = this.theme.fontFamily;
      textEl.textAlign = "center";
      textEl.verticalAlign = "middle";
      textEl.containerId = el.id;
      textEl.autoResize = true;
      textEl.lineHeight = 1.25;
      textEl.baseline = this.theme.fontSize * 0.8;
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
      {
        id: makeId(),
        type: "arrow",
        x: fx, y: fy,
        width: dx, height: dy,
        angle: 0,
        strokeColor: this.theme.arrow,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: this.theme.strokeWidth,
        strokeStyle: this.theme.strokeStyle,
        roughness: this.theme.roughness,
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
      } as ExcalidrawElement,
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
        {
          id: makeId(),
          type: "text",
          x: fx + dx / 2 - opts.label.length * this.theme.fontSize * 0.3,
          y: fy + dy / 2 - this.theme.fontSize * 1.2,
          width: opts.label.length * this.theme.fontSize * 0.6,
          height: this.theme.fontSize * 1.5,
          angle: 0,
          strokeColor: this.theme.text,
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
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
        } as ExcalidrawElement,
        this.theme,
        0
      ) as any;
      textEl.text = opts.label;
      textEl.fontSize = 14;
      textEl.fontFamily = this.theme.fontFamily;
      textEl.textAlign = "center";
      textEl.verticalAlign = "middle";
      textEl.containerId = el.id;
      textEl.autoResize = true;
      textEl.lineHeight = 1.25;
      textEl.baseline = 12;
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
      {
        id: makeId(),
        type: "text",
        x, y,
        width: content.length * fs * 0.6,
        height: fs * 1.5,
        angle: 0,
        strokeColor: this.theme.text,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
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
      } as ExcalidrawElement,
      this.theme,
      0
    ) as any;
    el.text = content;
    el.fontSize = fs;
    el.fontFamily = this.theme.fontFamily;
    el.textAlign = "center";
    el.verticalAlign = "middle";
    el.autoResize = true;
    el.lineHeight = 1.25;
    el.baseline = fs * 0.8;
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
      appState: {
        gridSize: null,
        viewBackgroundColor: this.theme.background,
        currentItemFontFamily: this.theme.fontFamily,
        currentItemFontSize: this.theme.fontSize,
        theme: this.theme.name === "dark" ? "dark" : "light",
      },
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
