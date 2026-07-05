import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { ExcalidrawDocument } from "./types.js";
import type { TemplateConfig, RecipeSlots, NarrativeSlots } from "./recipe_types.js";
import { validateNarrativeSlots } from "./recipe_validate.js";
import { getTheme } from "./themes.js";
import { Diagram } from "./diagram.js";
import { createElement, normalizeElement, makeId, textWidth } from "./normalize.js";

// ── Template Loading ──────────────────────────────────────────

/** Parse YAML frontmatter between --- markers. Returns { config, body }. */
function parseFrontmatter(raw: string): { config: Record<string, unknown>; body: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    throw new Error(`Template must start with YAML frontmatter (---)`);
  }
  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    throw new Error(`Template frontmatter not closed (missing second ---)`);
  }
  const fm = trimmed.slice(3, endIdx).trim();
  const body = trimmed.slice(endIdx + 3).trim();

  // Simple YAML parser for flat + one-level-nested values
  const config: Record<string, unknown> = {};
  const lines = fm.split("\n");
  let currentKey = "";
  let currentObj: Record<string, unknown> = {};

  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    // Strip inline comment
    const ci = t.indexOf("  #");
    const content = ci >= 0 ? t.slice(0, ci).trim() : t;

    if (/^[a-z_]+:$/.test(content) && !content.startsWith(" ")) {
      // Top-level key
      if (currentKey && Object.keys(currentObj).length > 0) {
        config[currentKey] = currentObj;
        currentObj = {};
      }
      currentKey = content.slice(0, -1);
    } else if (currentKey && content.startsWith("  ")) {
      // Nested key: "  key: value"
      const kv = content.trim().match(/^([a-z_]+):\s*(.+)/);
      if (kv) {
        const val = _parseYamlValue(kv[2].trim());
        currentObj[kv[1]] = val;
      }
    } else if (currentKey && !content.startsWith(" ")) {
      // Simple top-level key: "key: value"
      const kv = content.match(/^([a-z_]+):\s*(.+)/);
      if (kv) {
        const val = _parseYamlValue(kv[1] === currentKey ? kv[2].trim() : kv[2].trim());
        config[kv[1]] = val;
      }
    }
  }
  if (currentKey && Object.keys(currentObj).length > 0) {
    config[currentKey] = currentObj;
  }

  return { config, body };
}

function _parseYamlValue(s: string): any {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function resolveTemplatePath(templateId: string): string {
  // Try multiple locations relative to cwd and package
  const candidates = [
    resolve(process.cwd(), "templates", `${templateId}.md`),
    resolve(dirname(fileURLToPath(import.meta.url)), "../templates", `${templateId}.md`),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../templates", `${templateId}.md`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Template "${templateId}" not found in templates/. Looked in: ${candidates.join(", ")}`
  );
}

/** Load a template by ID (e.g. "narrative-framework" → templates/narrative-framework.md). */
export function loadTemplate(templateId: string): { config: TemplateConfig; body: string } {
  const path = resolveTemplatePath(templateId);
  const raw = readFileSync(path, "utf-8");
  const { config, body } = parseFrontmatter(raw);

  // Coerce to TemplateConfig
  const tc: TemplateConfig = {
    id: config.id as string,
    schema_version: config.schema_version as number,
    archetype: config.archetype as TemplateConfig["archetype"],
    description: config.description as string,
    grid: config.grid as TemplateConfig["grid"],
    direction: config.direction as TemplateConfig["direction"],
    roles: config.roles as Record<string, string>,
  };

  if (!tc.id || !tc.archetype || !tc.grid) {
    throw new Error(`Template "${templateId}" is missing required frontmatter fields (id, archetype, grid).`);
  }

  return { config: tc, body };
}

// ── Narrative Renderer ─────────────────────────────────────────

function _renderNarrative(
  config: TemplateConfig,
  slots: NarrativeSlots,
  themeName: string
): ExcalidrawDocument {
  const theme = getTheme(themeName);
  const { cols, cellW, cellH, gapX, gapY } = config.grid;
  const fullW = cols * cellW + (cols - 1) * gapX;

  const d = new Diagram(theme, { cols, cellW, cellH, gapX, gapY });

  // Headroom offsets — sections stack vertically
  let sectionY = 0;
  const sectionNames: string[] = [];
  const sectionBottoms: number[] = [];

  // ── Title ──
  if (slots.title) {
    d.addText(slots.title, fullW / 2 - textWidth(slots.title, 24) / 2, sectionY, 24);
    sectionY += 48;
  }

  // ── Sections + Cards ──
  for (let si = 0; si < slots.sections.length; si++) {
    const sec = slots.sections[si];
    const cardRows = Math.ceil(sec.items.length / cols);
    const headingH = 56; // heading + subtitle area
    const secH = headingH + cardRows * (cellH + gapY) + gapY;

    const roleColors = theme.roles?.[sec.role];
    const [stroke, bg] = roleColors ?? theme.shapes[si % theme.shapes.length];

    // Register a phantom anchor for arrow connections
    const anchorId = `sec_${si}`;
    const anchorEl = createElement("rectangle", {
      x: 0, y: sectionY, width: fullW, height: secH,
      strokeColor: "transparent", backgroundColor: "transparent",
      fillStyle: "solid", strokeWidth: 0, roughness: 0, roundness: null,
      id: anchorId,
    });
    (d as any)._named.set(anchorId, normalizeElement(anchorEl, theme, 0));

    sectionNames.push(anchorId);
    sectionBottoms.push(sectionY + secH);

    // Section frame + heading
    d.addSection(`sec_frame_${si}`, {
      heading: sec.heading,
      subtitle: sec.subtitle,
      role: sec.role,
      row: 0, col: 0, span: cols, width: fullW, height: secH,
    });

    // Cards within section: grid of min(itemCount, 3) columns
    const cardAreaY = sectionY + headingH + gapY / 2;
    for (let ci = 0; ci < sec.items.length; ci++) {
      const item = sec.items[ci];
      const cardCol = ci % cols;
      const cardRow = Math.floor(ci / cols);
      const cx = cardCol * (cellW + gapX);
      const cy = cardAreaY + cardRow * (cellH + gapY);

      d.addCard(`sec_${si}_card_${ci}`, {
        title: item.title,
        subtitle: item.subtitle,
        icon: item.icon,
        role: sec.role,
        width: cellW, height: cellH,
      });
    }

    sectionY += secH + gapY;
  }

  // ── Transitions ──
  for (const t of slots.transitions) {
    const fromBot = sectionBottoms[t.from];
    const toSection = slots.sections[t.to];
    const toCardRows = Math.ceil(toSection.items.length / cols);
    const toH = 56 + toCardRows * (cellH + gapY) + gapY;
    const toTop = sectionBottoms[t.to] - toH;

    const fromX = fullW / 2;
    const arrowY = fromBot + gapY / 4;
    const arrowH = toTop - fromBot - gapY / 2;

    const arrowEl = createElement("arrow", {
      x: fromX, y: arrowY, width: 0, height: Math.max(arrowH, 1),
      strokeColor: theme.arrow,
      roundness: { type: 2 },
    }) as any;
    arrowEl.points = [[0, 0], [0, Math.max(arrowH, 1)]];
    arrowEl.startArrowhead = null;
    arrowEl.endArrowhead = "arrow";
    arrowEl.startBinding = null;
    arrowEl.endBinding = null;

    d.addText(
      t.label,
      fromX - textWidth(t.label, 14) / 2,
      arrowY + Math.max(arrowH, 1) / 2 - 10,
      14
    );

    d.elements.push(normalizeElement(arrowEl, theme, 0));
  }

  // ── Callout ──
  if (slots.callout) {
    d.addCallout("callout", {
      text: slots.callout.text,
      icon: slots.callout.icon,
      role: "callout",
      span: cols,
    });
  }

  return d.toDocument();
}

// ── Public API ─────────────────────────────────────────────────

/** Render a diagram from a template + slot data. */
export function renderFromRecipe(
  templateId: string,
  slots: RecipeSlots,
  themeName: string = "sketchy"
): ExcalidrawDocument {
  const { config } = loadTemplate(templateId);

  // Validate
  const errors = validateNarrativeSlots(slots as NarrativeSlots, config);
  if (errors.length > 0) {
    throw new Error(`Slot validation failed for template "${templateId}":\n  - ${errors.join("\n  - ")}`);
  }

  // Dispatch to archetype renderer
  switch (config.archetype) {
    case "narrative":
      return _renderNarrative(config, slots as NarrativeSlots, themeName);
    default:
      throw new Error(`Archetype "${config.archetype}" not yet supported in renderFromRecipe.`);
  }
}
