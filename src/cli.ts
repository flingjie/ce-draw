#!/usr/bin/env node
/**
 * ec-draw CLI — generate Excalidraw diagrams from Mermaid or Python-like syntax.
 *
 * Usage:
 *   ec-draw mermaid diagram.mmd -o output.excalidraw -t sketchy
 *   echo "flowchart TD\n  A --> B" | ec-draw mermaid - -o output.excalidraw
 *   ec-draw --list-themes
 *   ec-draw --list-icons
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { mermaidToExcalidraw } from "./mermaid.js";
import { listThemes } from "./themes.js";
import { listIcons } from "./library.js";

function main() {
  const args = process.argv.slice(2);

  // --help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`ec-draw — Excalidraw diagram generator

Usage:
  ec-draw mermaid <file|-|inline> [options]
  ec-draw --list-themes
  ec-draw --list-icons

Options:
  -o, --output <path>    Output file (default: /Users/lingjiefan/Downloads/output.excalidraw)
  -t, --theme <name>     Theme: sketchy, professional, dark, colorful (default: sketchy)
  -h, --help             Show this help

Examples:
  ec-draw mermaid diagram.mmd -o flow.excalidraw
  echo "flowchart TD\\n  A --> B" | ec-draw mermaid - -t professional
  ec-draw mermaid "flowchart TD; A-->B" -o quick.excalidraw`);
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

  // Parse options
  let outputPath = "/Users/lingjiefan/Downloads/output.excalidraw";
  let themeName = "sketchy";

  const outputIdx = args.indexOf("-o") !== -1 ? args.indexOf("-o") : args.indexOf("--output");
  if (outputIdx !== -1 && outputIdx + 1 < args.length) {
    outputPath = args[outputIdx + 1];
  }

  const themeIdx = args.indexOf("-t") !== -1 ? args.indexOf("-t") : args.indexOf("--theme");
  if (themeIdx !== -1 && themeIdx + 1 < args.length) {
    themeName = args[themeIdx + 1];
  }

  // mermaid subcommand
  const mermaidIdx = args.indexOf("mermaid");
  if (mermaidIdx === -1) {
    console.error('Error: expected "mermaid" subcommand. Use --help for usage.');
    process.exit(1);
  }

  const mermaidArg = args[mermaidIdx + 1];
  if (!mermaidArg) {
    console.error('Error: "mermaid" requires a file, -, or inline text.');
    process.exit(1);
  }

  let mermaidText: string;
  if (mermaidArg === "-") {
    // Read from stdin
    mermaidText = readFileSync(0, "utf-8").trim();
  } else if (mermaidArg.includes(";") || mermaidArg.includes("\n") || mermaidArg.startsWith("flowchart") || mermaidArg.startsWith("sequenceDiagram") || mermaidArg.startsWith("erDiagram") || mermaidArg.startsWith("classDiagram")) {
    // Inline Mermaid text
    mermaidText = mermaidArg.replace(/;/g, "\n");
  } else {
    // File path
    mermaidText = readFileSync(resolve(mermaidArg), "utf-8").trim();
  }

  // Generate
  const doc = mermaidToExcalidraw(mermaidText, themeName);
  writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf-8");
  console.log(`Saved: ${resolve(outputPath)}`);
}

main();
