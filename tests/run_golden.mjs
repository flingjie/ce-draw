import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const TMP = "/tmp/golden_test";
try { mkdirSync(TMP, { recursive: true }); } catch {}

// Set REGEN=true to regenerate all golden files
const REGEN = false;

let pass = 0, fail = 0;

function strip(obj) {
  const s = JSON.stringify(obj);
  return JSON.parse(s, (k, v) =>
    ["id", "seed", "versionNonce", "containerId"].includes(k) ? undefined : v
  );
}

function deepSort(obj) {
  if (Array.isArray(obj)) return obj.map(deepSort).sort((a, b) => {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = deepSort(obj[k]);
    return out;
  }
  return obj;
}

// ── JS tests (Diagram API) ────────────────────────────────────

for (const name of ["flowchart", "architecture", "semantic"]) {
  const input = join(ROOT, "tests/input", name + ".js");
  const expected = join(ROOT, "tests/expected", name + ".excalidraw");

  try {
    const mod = await import(input);
    const doc = mod.default.toDocument();
    writeFileSync(join(TMP, name + ".excalidraw"), JSON.stringify(doc, null, 2));

    if (!existsSync(expected) || REGEN) {
      writeFileSync(expected, JSON.stringify(doc, null, 2));
      console.log(`[${REGEN ? 'REGEN' : 'GEN'}] ${name}.js — ${REGEN ? 'regenerated' : 'created'} golden file`);
      pass++;
      continue;
    }

    const expectedDoc = JSON.parse(readFileSync(expected, "utf-8"));
    const a = deepSort(strip(doc));
    const b = deepSort(strip(expectedDoc));

    if (JSON.stringify(a) === JSON.stringify(b)) {
      console.log(`[PASS] ${name}.js`);
      pass++;
    } else {
      console.log(`[FAIL] ${name}.js`);
      fail++;
    }
  } catch (e) {
    console.error(`[ERROR] ${name}.js:`, e.message);
    fail++;
  }
}

// ── JSON tests (renderDiagram) ─────────────────────────────────

for (const name of ["flowchart_json"]) {
  const input = join(ROOT, "tests/input", name + ".json");
  const expected = join(ROOT, "tests/expected", name + ".excalidraw");

  try {
    const { renderDiagram } = await import(join(ROOT, "dist/index.js"));
    const raw = readFileSync(input, "utf-8").trim();
    const diagram = JSON.parse(raw);
    const doc = renderDiagram(diagram, diagram.theme || "sketchy");
    writeFileSync(join(TMP, name + ".excalidraw"), JSON.stringify(doc, null, 2));

    if (REGEN) {
      writeFileSync(expected, JSON.stringify(doc, null, 2));
      console.log(`[REGEN] ${name}.json — regenerated golden file`);
      pass++;
      continue;
    }

    const expectedDoc = JSON.parse(readFileSync(expected, "utf-8"));
    const a = deepSort(strip(doc));
    const b = deepSort(strip(expectedDoc));

    if (JSON.stringify(a) === JSON.stringify(b)) {
      console.log(`[PASS] ${name}.json`);
      pass++;
    } else {
      console.log(`[FAIL] ${name}.json`);
      fail++;
    }
  } catch (e) {
    console.error(`[ERROR] ${name}.json:`, e.message);
    fail++;
  }
}

// ── Recipe tests (renderFromRecipe) ────────────────────────────

for (const name of ["narrative"]) {
  const input = join(ROOT, "tests/input", name + ".json");
  const expected = join(ROOT, "tests/expected", name + ".excalidraw");

  try {
    const { renderFromRecipe } = await import(join(ROOT, "dist/index.js"));
    const content = JSON.parse(readFileSync(input, "utf-8"));
    const doc = renderFromRecipe("narrative", content, "sketchy");
    writeFileSync(join(TMP, name + ".excalidraw"), JSON.stringify(doc, null, 2));

    if (REGEN) {
      writeFileSync(expected, JSON.stringify(doc, null, 2));
      console.log(`[REGEN] ${name}.json — regenerated golden file`);
      pass++;
      continue;
    }

    const expectedDoc = JSON.parse(readFileSync(expected, "utf-8"));
    const a = deepSort(strip(doc));
    const b = deepSort(strip(expectedDoc));

    if (JSON.stringify(a) === JSON.stringify(b)) {
      console.log(`[PASS] ${name}.json (recipe)`);
      pass++;
    } else {
      console.log(`[FAIL] ${name}.json (recipe)`);
      fail++;
    }
  } catch (e) {
    console.error(`[ERROR] ${name}.json (recipe):`, e.message);
    fail++;
  }
}

console.log(`\nResults: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
