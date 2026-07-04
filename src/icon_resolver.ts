/**
 * Icon resolver — matches node labels to icon renderings.
 *
 * Reads icon_mapping.yaml at init time. resolveIcon(name) checks
 * canonical names, aliases, and keywords to find the best match.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { ExcalidrawElement } from "./types.js";
import { ICONS } from "./library.js";
import { getTheme } from "./themes.js";

// ── Mapping ────────────────────────────────────────────────────

interface IconEntry {
  aliases: string[];
  keywords: string[];
}

let _mapping: Record<string, IconEntry> | null = null;
let _lookup: Map<string, string> | null = null; // alias/keyword → canonical name

function loadMapping(): Record<string, IconEntry> {
  if (_mapping) return _mapping;

  // Try library/icon_mapping.yaml relative to package root
  const candidates = [
    resolve(process.cwd(), "library/icon_mapping.yaml"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../library/icon_mapping.yaml"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../library/icon_mapping.yaml"),
  ];

  let raw = "";
  for (const p of candidates) {
    if (existsSync(p)) { raw = readFileSync(p, "utf-8"); break; }
  }

  if (!raw) {
    // Fallback: built-in mapping
    _mapping = _builtinMapping();
    _buildLookup();
    return _mapping!;
  }

  _mapping = _parseSimpleYaml(raw);
  _buildLookup();
  return _mapping!;
}

/** Minimal YAML parser for icon_mapping.yaml's simple structure. */
function _parseSimpleYaml(text: string): Record<string, IconEntry> {
  const result: Record<string, IconEntry> = {};
  let current: string | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Top-level key: "database:"
    if (/^[a-z_]/.test(trimmed) && trimmed.endsWith(":")) {
      current = trimmed.slice(0, -1).trim();
      result[current] = { aliases: [], keywords: [] };
      continue;
    }

    // Sub-key: "  aliases: [a, b, c]"
    if (current && trimmed.startsWith("aliases:")) {
      result[current].aliases = _parseYamlList(trimmed);
    } else if (current && trimmed.startsWith("keywords:")) {
      result[current].keywords = _parseYamlList(trimmed);
    }
  }

  return result;
}

function _parseYamlList(line: string): string[] {
  const bracket = line.match(/\[([^\]]*)\]/);
  if (bracket) return bracket[1].split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return [];
}

function _buildLookup() {
  _lookup = new Map();
  for (const [name, entry] of Object.entries(_mapping!)) {
    _lookup.set(name.toLowerCase(), name);
    for (const a of entry.aliases) _lookup.set(a.toLowerCase(), name);
    for (const k of entry.keywords) _lookup.set(k.toLowerCase(), name);
  }
}

function _builtinMapping(): Record<string, IconEntry> {
  return {
    database:      { aliases: ["db","datastore","storage","rds","mysql","postgresql","postgres","sql","redis","memcached","elasticache"], keywords: ["database","data","store","persist","cache"] },
    server:        { aliases: ["service","backend","api-server","instance","node"], keywords: ["server","compute","host"] },
    cloud:         { aliases: ["cdn","internet","external"], keywords: ["cloud","internet","external","network"] },
    user:          { aliases: ["users","customer","client","person","account"], keywords: ["user","person","human","customer"] },
    gear:          { aliases: ["settings","config","configuration","engine","processor"], keywords: ["gear","setting","config","process"] },
    document:      { aliases: ["file","files","doc","page","pages"], keywords: ["document","file","page"] },
    globe:         { aliases: ["web","world","internet","public"], keywords: ["globe","world","web","global"] },
    mobile:        { aliases: ["phone","app","client-app","ios","android"], keywords: ["mobile","phone","app","device"] },
    lock:          { aliases: ["auth","security","authentication","secure","ssl","tls"], keywords: ["lock","secure","auth","security"] },
    fire:          { aliases: ["hot","alert","critical","warning","urgent"], keywords: ["fire","hot","alert","critical"] },
    message_queue: { aliases: ["queue","mq","kafka","rabbitmq","sqs","pubsub","event-bus","broker"], keywords: ["queue","message","event","stream"] },
    firewall:      { aliases: ["waf","security-group","sg","guard"], keywords: ["firewall","filter","security","protect"] },
    scissors:      { aliases: ["cut","split","divide"], keywords: ["scissors","cut","split"] },
    brain:         { aliases: ["ai","ml","model","intelligence","inference","llm","gpt"], keywords: ["brain","ai","ml","intelligence","model"] },
    tag:           { aliases: ["label","category","badge","marker"], keywords: ["tag","label","badge","category"] },
    embed:         { aliases: ["iframe","widget","media","video","player"], keywords: ["embed","widget","media","frame"] },
    cluster:       { aliases: ["group","pool","fleet","replicaset","nodes","instances"], keywords: ["cluster","group","pool","fleet"] },
  };
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Resolve a name to its canonical icon name.
 * Checks: exact match → alias → keyword substring match.
 * Returns null if no match found.
 */
export function resolveIconName(name: string): string | null {
  const mapping = loadMapping();
  const lower = name.toLowerCase().trim();

  // Exact canonical match
  if (mapping[lower]) return lower;

  // Direct alias/keyword lookup
  if (_lookup!.has(lower)) return _lookup!.get(lower)!;

  // Substring match against keywords (longest match wins)
  let best: string | null = null;
  let bestLen = 0;
  for (const [keyword, canonical] of _lookup!.entries()) {
    if (lower.includes(keyword) && keyword.length > bestLen) {
      best = canonical;
      bestLen = keyword.length;
    }
  }

  return best;
}

/**
 * Render an icon at a position with theme colors.
 * Returns elements ready to insert into the document.
 */
export function resolveIcon(
  name: string,
  x: number,
  y: number,
  themeName: string = "sketchy",
  colorIndex: number = 0
): ExcalidrawElement[] | null {
  const iconName = resolveIconName(name);
  if (!iconName || !ICONS[iconName]) return null;

  const theme = getTheme(themeName);
  const [stroke, bg] = theme.shapes[colorIndex % theme.shapes.length];

  // Position icon centered in the node's bounding box
  const icon = ICONS[iconName];
  return icon.render(x, y, stroke, bg);
}
