/**
 * ec-draw type definitions. Mirrors the Excalidraw element schema.
 * Reference: @excalidraw/excalidraw/element/types.ts
 */

/** Excalidraw uses [number, number] tuples for points, not {x,y} objects. */
export type Point = [number, number];

export type Direction = "TB" | "LR" | "RL" | "BT";

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundElement {
  id: string;
  type: "arrow" | "text";
}

export interface Roundness {
  type: 1 | 2 | 3;
}

export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FontFamily = 1 | 2 | 3 | 4 | 5;
export type TextAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";
export type Arrowhead = "arrow" | "bar" | "dot" | "triangle";
export type ShapeType = "rectangle" | "ellipse" | "diamond";

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  groupIds: string[];
  roundness: Roundness | null;
  boundElements: BoundElement[] | null;
  locked: boolean;
  isDeleted: boolean;
  link: string | null;
  updated: number;
  seed: number;
  version: number;
  versionNonce: number;
  frameId: string | null;
}

export interface TextElement extends ExcalidrawElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  containerId: string | null;
  autoResize: boolean;
  lineHeight: number;
  baseline: number;
  originalText: string;
}

export interface ArrowElement extends ExcalidrawElement {
  type: "arrow";
  points: Point[];
  startArrowhead: Arrowhead | null;
  endArrowhead: Arrowhead | null;
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
}

export interface FrameElement extends ExcalidrawElement {
  type: "frame";
  name: string;
}

export interface ExcalidrawDocument {
  type: "excalidraw";
  version: 2;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    gridSize: null;
    viewBackgroundColor: string;
    currentItemFontFamily: FontFamily;
    currentItemFontSize: number;
    theme: "light" | "dark";
  };
  files: Record<string, unknown>;
}

/** Visual theme configuration. */
export interface ThemeConfig {
  name: string;
  shapes: Array<[string, string]>; // [strokeColor, backgroundColor] pairs
  arrow: string;
  text: string;
  accent: string;
  background: string;
  strokeWidth: number;
  roughness: number;
  roundness: Roundness | null;
  fontFamily: FontFamily;
  fontSize: number;
  fillStyle: FillStyle;
  strokeStyle: StrokeStyle;
  /** Semantic role → [strokeColor, backgroundColor]. Compiled from tokens.yaml roles section. */
  roles?: Record<string, [string, string]>;
}
