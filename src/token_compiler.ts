/**
 * Design token compiler — reads design-tokens/tokens.yaml and compiles
 * to ThemeConfig at import time. Single source of truth for visual values.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { ThemeConfig } from "./types.js";

// ── Token Loading ─────────────────────────────────────────────

interface FlatTokens {
  colors: Record<string, string | [string, string]>;
  shapes: Record<string, string[]>;
  roles: Record<string, [string, string]>;
  spacing: Record<string, number>;
  typography: Record<string, number>;
  stroke_width: Record<string, number>;
  stroke_roughness: Record<string, number>;
  stroke_roundness: Record<string, number | null>;
  stroke_style: Record<string, string>;
  shadow: Record<string, any>;
  roles: Record<string, string>;
}

let _tokens: FlatTokens | null = null;

function loadTokens(): FlatTokens {
  if (_tokens) return _tokens;

  const candidates = [
    resolve(process.cwd(), "design-tokens/tokens.yaml"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../design-tokens/tokens.yaml"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../design-tokens/tokens.yaml"),
  ];

  let raw = "";
  for (const p of candidates) {
    if (existsSync(p)) { raw = readFileSync(p, "utf-8"); break; }
  }

  if (!raw) throw new Error("design-tokens/tokens.yaml not found");
  _tokens = parseTokens(raw);
  return _tokens!;
}

function parseTokens(yaml: string): FlatTokens {
  const result: any = {
    colors: {}, shapes: {}, roles: {}, spacing: {}, typography: {},
    stroke_width: {}, stroke_roughness: {}, stroke_roundness: {},
    stroke_style: {}, shadow: {}, roles: {},
  };
  let section = "";

  for (const line of yaml.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;

    // Strip inline comment
    const ci = t.indexOf("  #");
    const content = ci >= 0 ? t.slice(0, ci).trim() : t;

    // Top-level section: "colors:", "spacing:", etc.
    if (/^[a-z_]+:$/.test(content) && !content.startsWith(" ")) {
      section = content.slice(0, -1);
      continue;
    }

    // Flat key-value: "  key: value" or "  key: [a, b]"
    const kv = content.match(/^([a-z_0-9]+):\s*(.+)/);
    if (!kv || !section) continue;

    const key = kv[1];
    const rawVal = kv[2].trim();
    const val = _parseValue(rawVal);

    if (section === "colors" && Array.isArray(val)) {
      result.colors[key] = val as [string, string];
    } else if (section === "roles") {
      result.roles[key] = val as string;
    } else if (section === "shapes") {
      const items = rawVal.slice(1, -1).split(",").map((s: string) => s.trim());
      result.shapes[key] = items;
    } else if (section === "roles" && Array.isArray(val)) {
      result.roles[key] = val as [string, string];
    } else if (section === "stroke_roundness") {
      result.stroke_roundness[key] = val === null ? null : typeof val === "number" ? val : null;
    } else {
      result[section][key] = val;
    }
  }

  return result as FlatTokens;
}

function _parseValue(s: string): any {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  // Array: [a, b]
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1);
    const items = inner.split(",").map((x: string) => {
      const v = x.trim().replace(/"/g, "");
      return /^\d+$/.test(v) ? parseInt(v) : v;
    });
    return items;
  }
  return s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

// ── Theme Compilation ─────────────────────────────────────────

function resolveColor(name: string, tokens: FlatTokens): [string, string] {
  const c = tokens.colors[name];
  return Array.isArray(c) ? c as [string, string] : ["#000", "#fff"];
}

function compileTheme(name: string, tokens: FlatTokens): ThemeConfig {
  const shapeNames = tokens.shapes[name] || tokens.shapes.sketchy;
  const shapes = shapeNames.map((c: string) => resolveColor(c, tokens)) as Array<[string, string]>;

  const isSketchy = name === "sketchy" || name === "colorful";
  const roughness = isSketchy ? tokens.stroke_roughness.sketchy
    : name === "professional" ? tokens.stroke_roughness.crisp
    : tokens.stroke_roughness.slight;

  const rKey = name === "professional" ? "none" : name === "dark" ? "medium" : "full";
  const rVal = tokens.stroke_roundness[rKey];
  const roundness = rVal === null || rVal === undefined ? null : { type: rVal as 1|2|3 };

  const fontFamily = name === "professional"
    ? tokens.typography.font_family_helvetica
    : tokens.typography.font_family_virgil;

  // Compile role colors: role_name → color_key → [stroke, bg]
  const roles: Record<string, [string, string]> = {};
  for (const [roleName, colorKey] of Object.entries(tokens.roles)) {
    roles[roleName] = resolveColor(colorKey as string, tokens);
  }

  return {
    name,
    shapes,
    roles: { ...tokens.roles },  // semantic role colors
    arrow: String(tokens.colors[`arrow_${name}`] || "#6B7280"),
    text: String(tokens.colors[`text_${name}`] || "#1F2937"),
    accent: String(tokens.colors[`accent_${name}`] || "#2563EB"),
    background: String(tokens.colors[`bg_${name}`] || "#FFFFFF"),
    strokeWidth: tokens.stroke_width.default ?? 2,
    roughness: roughness ?? 1,
    roundness,
    fontFamily: fontFamily ?? 1,
    fontSize: tokens.typography.font_size_default ?? 16,
    fillStyle: "solid",
    strokeStyle: "solid",
    roles: Object.keys(roles).length > 0 ? roles : undefined,
  } as ThemeConfig;
}

// ── Public API ─────────────────────────────────────────────────

export function loadThemesFromTokens(): Record<string, ThemeConfig> {
  const tokens = loadTokens();
  const themes: Record<string, ThemeConfig> = {};
  for (const name of Object.keys(tokens.shapes)) {
    themes[name] = compileTheme(name, tokens);
  }
  return themes;
}

export function getSpacing(): Record<string, number> {
  const t = loadTokens().spacing;
  return {
    margin: t.margin ?? 120,
    nodePadX: t.node_pad_x ?? 32,
    nodePadY: t.node_pad_y ?? 24,
    nodeSep: t.nodesep ?? 60,
    rankSep: t.ranksep ?? 70,
    edgeSep: t.edgesep ?? 30,
    marginX: t.marginx ?? 40,
    marginY: t.marginy ?? 40,
  };
}

export function getShadowTokens() {
  return loadTokens().shadow;
}
