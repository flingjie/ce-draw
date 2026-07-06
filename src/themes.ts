/**
 * Visual themes for ec-draw.
 *
 * Each theme defines a complete visual identity: colors, stroke width,
 * roughness, roundness, font, and background.
 *
 * Themes are compiled from design-tokens/tokens.yaml at runtime.
 * Hardcoded values serve as fallback when the YAML is unavailable.
 */

import type { ThemeConfig } from "./types.js";
import { loadThemesFromTokens } from "./token_compiler.js";

export type { ThemeConfig };

// ── Default semantic roles (fallback when tokens.yaml unavailable) ─

const DEFAULT_ROLES: Record<string, [string, string]> = {
  // Semantic roles (concept-level)
  map:       ["#2563EB", "#DBEAFE"], // blue — mental models, prompts
  territory: ["#059669", "#D1FAE5"], // green — codebase, constraints
  unknown:   ["#D97706", "#FEF3C7"], // amber — gaps, unknowns, risks
  // Template roles (used by recipe templates)
  primary:   ["#1E3A5F", "#B8D4F0"], // slate — main concept
  secondary: ["#2D5A27", "#C5E8C0"], // moss — counterpart
  gap:       ["#8B4513", "#F5D5B8"], // brown — unknowns, blind spots
  callout:   ["#D97706", "#FEF3C7"], // amber — emphasis, bottom-line
  muted:     ["#9CA3AF", "#F3F4F6"], // neutral — secondary, background
};

// ── Built-in fallback themes ──────────────────────────────────

const _professional: ThemeConfig = {
  name: "professional",
  shapes: [
    ["#2563EB", "#DBEAFE"], // blue
    ["#059669", "#D1FAE5"], // green
    ["#7C3AED", "#EDE9FE"], // purple
    ["#DC2626", "#FEE2E2"], // red
    ["#D97706", "#FEF3C7"], // amber
  ],
  arrow: "#6B7280",
  text: "#1F2937",
  accent: "#2563EB",
  background: "#FFFFFF",
  strokeWidth: 2,
  roughness: 0,
  roundness: null,
  fontFamily: 2, // Helvetica
  fontSize: 16,
  fillStyle: "solid",
  strokeStyle: "solid",
  roles: {
    primary:  ["#2563EB", "#DBEAFE"], // blue
    secondary: ["#059669", "#D1FAE5"], // green
    gap:       ["#D97706", "#FEF3C7"], // amber
    callout:   ["#DC2626", "#FEE2E2"], // red
    muted:     ["#9CA3AF", "#F3F4F6"], // gray
  },
};

const _sketchy: ThemeConfig = {
  name: "sketchy",
  shapes: [
    ["#1E3A5F", "#B8D4F0"], // slate blue
    ["#2D5A27", "#C5E8C0"], // moss green
    ["#6B3A5B", "#F0D5E5"], // mauve
    ["#8B4513", "#F5D5B8"], // warm brown
    ["#4A3728", "#E8D5C0"], // taupe
  ],
  arrow: "#5A5A5A",
  text: "#2C2C2C",
  accent: "#1E3A5F",
  background: "#F8F5F0",
  strokeWidth: 3,
  roughness: 2,
  roundness: { type: 3 },
  fontFamily: 1, // Virgil (hand-drawn)
  fontSize: 16,
  fillStyle: "solid",
  strokeStyle: "solid",
  roles: {
    primary:  ["#1E3A5F", "#B8D4F0"], // slate
    secondary: ["#2D5A27", "#C5E8C0"], // moss
    gap:       ["#8B4513", "#F5D5B8"], // brown
    callout:   ["#D97706", "#FEF3C7"], // amber
    muted:     ["#4A3728", "#E8D5C0"], // taupe
  },
};

const _dark: ThemeConfig = {
  name: "dark",
  shapes: [
    ["#60A5FA", "#1E3A5F"], // blue
    ["#34D399", "#064E3B"], // green
    ["#A78BFA", "#4C1D95"], // purple
    ["#F87171", "#7F1D1D"], // red
    ["#FBBF24", "#78350F"], // amber
  ],
  arrow: "#9CA3AF",
  text: "#F3F4F6",
  accent: "#60A5FA",
  background: "#111827",
  strokeWidth: 2,
  roughness: 1,
  roundness: { type: 2 },
  fontFamily: 1,
  fontSize: 16,
  fillStyle: "solid",
  strokeStyle: "solid",
  roles: {
    primary:  ["#60A5FA", "#1E3A5F"], // neon blue
    secondary: ["#34D399", "#064E3B"], // neon green
    gap:       ["#FBBF24", "#78350F"], // neon amber
    callout:   ["#F87171", "#7F1D1D"], // neon red
    muted:     ["#9CA3AF", "#374151"], // gray
  },
};

const _colorful: ThemeConfig = {
  name: "colorful",
  shapes: [
    ["#E03131", "#FFC9C9"], // red
    ["#E8590C", "#FFD8A8"], // orange
    ["#FCC419", "#FFF3BF"], // yellow
    ["#2F9E44", "#B2F2BB"], // green
    ["#1C7ED6", "#A5D8FF"], // blue
  ],
  arrow: "#495057",
  text: "#212529",
  accent: "#E03131",
  background: "#FFFBEB",
  strokeWidth: 3,
  roughness: 1,
  roundness: { type: 3 },
  fontFamily: 1,
  fontSize: 16,
  fillStyle: "solid",
  strokeStyle: "solid",
  roles: {
    primary:  ["#1C7ED6", "#A5D8FF"], // bright blue
    secondary: ["#2F9E44", "#B2F2BB"], // bright green
    gap:       ["#E8590C", "#FFD8A8"], // bright orange
    callout:   ["#E03131", "#FFC9C9"], // bright red
    muted:     ["#ADB5BD", "#F8F9FA"], // gray
  },
};

// ── Theme registry (token-compiled with built-in fallback) ──

let _themes: Record<string, ThemeConfig> | null = null;

function _loadThemes(): Record<string, ThemeConfig> {
  if (_themes) return _themes;
  try {
    _themes = loadThemesFromTokens();
    // Ensure every theme has roles (merge defaults, theme-compiled takes precedence)
    for (const key of Object.keys(_themes)) {
      if (!_themes[key].roles || Object.keys(_themes[key].roles!).length === 0) {
        _themes[key].roles = { ...DEFAULT_ROLES };
      }
    }
  } catch {
    // Fall back to built-in when design-tokens/ not available
    _themes = {
      professional: { ..._professional, roles: { ...DEFAULT_ROLES } },
      sketchy: { ..._sketchy, roles: { ...DEFAULT_ROLES } },
      dark: { ..._dark, roles: { ...DEFAULT_ROLES } },
      colorful: { ..._colorful, roles: { ...DEFAULT_ROLES } },
    };
  }
  return _themes;
}

export const THEMES: Record<string, ThemeConfig> = _loadThemes();

export function getTheme(name: string): ThemeConfig {
  const theme = THEMES[name.toLowerCase().trim()];
  if (!theme) {
    throw new Error(
      `Unknown theme "${name}". Available: ${Object.keys(THEMES).join(", ")}`
    );
  }
  return { ...theme }; // return a copy so callers can mutate safely
}

export function listThemes(): string[] {
  return Object.keys(THEMES);
}
