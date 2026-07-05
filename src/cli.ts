#!/usr/bin/env node
/**
 * ec-draw CLI — generate Excalidraw diagrams from JS scripts or JSON descriptors.
 *
 * Usage:
 *   ec-draw run diagram.js -o output.excalidraw -t sketchy
 *   ec-draw render diagram.json -o output.excalidraw
 *   ec-draw --list-themes
 *   ec-draw --list-icons
 *   ec-draw --list-libraries
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { listThemes } from "./themes.js";
import { listIcons, listLibraries } from "./library.js";
import { renderDiagram } from "./render.js";

function main() {
  const args = process.argv.slice(2);

  // --help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`ec-draw — Excalidraw diagram generator

Usage:
  ec-draw run <file.js> [options]       Execute a JS script that exports a Diagram
  ec-draw render <file.json> [options]  Render a JSON diagram descriptor
  ec-draw --list-themes
  ec-draw --list-icons
  ec-draw --list-libraries

Options:
  -o, --output <path>    Output file (default: ~/Downloads/output.excalidraw)
  -t, --theme <name>     Theme: sketchy, professional, dark, colorful (default: sketchy)
  -h, --help             Show this help

JS script mode:
  The script must export default a Diagram instance:
    import { Diagram } from "ec-draw";
    const d = new Diagram("sketchy");
    d.addBox("Start", { row: 0, col: 0 });
    d.addBox("End", { row: 0, col: 2 });
    d.addArrow("Start", "End");
    export default d;

JSON descriptor mode:
  {
    "type": "flowchart",
    "direction": "TB",
    "nodes": [
      { "id": "A", "label": "Start", "shape": "rectangle" },
      { "id": "B", "label": "End", "shape": "diamond" }
    ],
    "edges": [
      { "from": "A", "to": "B", "label": "next" }
    ]
  }

  Supported types: flowchart, sequence, er, class, pipeline, workflow, architecture, arch`);
    return;
  }

  // --list-themes
  if (args.includes("--list-themes")) {
    console.log("Available themes:");
    for (const name of listThemes()) console.log(`  - ${name}`);
    return;
  }

  // --list-icons
  if (args.includes("--list-icons")) {
    console.log("Available icons:");
    for (const name of listIcons()) console.log(`  - ${name}`);
    return;
  }

  // --list-libraries
  if (args.includes("--list-libraries")) {
    console.log("Available external libraries:");
    for (const name of listLibraries()) console.log(`  - ${name}`);
    return;
  }

  // Parse options
  let outputPath = resolve(process.env.HOME || "/tmp", "Downloads/output.excalidraw");
  let themeName = "sketchy";

  const outputIdx = args.indexOf("-o") !== -1 ? args.indexOf("-o") : args.indexOf("--output");
  if (outputIdx !== -1 && outputIdx + 1 < args.length) {
    outputPath = args[outputIdx + 1];
  }

  const themeIdx = args.indexOf("-t") !== -1 ? args.indexOf("-t") : args.indexOf("--theme");
  if (themeIdx !== -1 && themeIdx + 1 < args.length) {
    themeName = args[themeIdx + 1];
  }

  // Detect subcommand
  const subIdx = args.findIndex(a => a === "run" || a === "render");
  if (subIdx === -1) {
    console.error('Error: expected "run" or "render" subcommand. Use --help for usage.');
    process.exit(1);
  }

  const sub = args[subIdx];
  const fileArg = args[subIdx + 1];
  if (!fileArg) {
    console.error(`Error: "${sub}" requires a file path. Use --help for usage.`);
    process.exit(1);
  }

  // Run subcommand asynchronously
  (async () => {
    try {
      let doc: { type: string; version: number; source: string; elements: any[]; appState: any; files: Record<string, unknown> };

      if (sub === "run") {
        // JS script mode — dynamic import
        const filePath = resolve(fileArg);
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(fileUrl);
        const diagram = mod.default;
        if (!diagram || typeof diagram.toDocument !== "function") {
          throw new Error(`Script "${fileArg}" must export default a Diagram instance.`);
        }
        doc = diagram.toDocument();
      } else {
        // JSON descriptor mode
        const raw = readFileSync(resolve(fileArg), "utf-8").trim();
        const diagram = JSON.parse(raw);
        if (!diagram.type || !Array.isArray(diagram.nodes)) {
          throw new Error('JSON must have "type" (string) and "nodes" (array).');
        }
        doc = renderDiagram(diagram, diagram.theme || themeName);
      }

      writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf-8");
      console.log(`Saved: ${resolve(outputPath)}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  })();
}

main();
