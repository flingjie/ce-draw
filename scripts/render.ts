#!/usr/bin/env npx tsx
/**
 * ec-draw renderer — Mermaid → Excalidraw converter.
 *
 * Usage:
 *   npx tsx scripts/render.ts --input diagram.mmd --output diagram.excalidraw --theme sketchy
 *   echo "flowchart TD\n  A --> B" | npx tsx scripts/render.ts --output flow.excalidraw
 *
 * This is the main entry point that Claude Code / Codex invokes.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { mermaidToExcalidraw } from "../dist/index.js";

async function main() {
  const args = process.argv.slice(2);

  let inputPath = "";
  let outputPath = "diagram.excalidraw";
  let themeName = "sketchy";

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "-i" || args[i] === "--input") && i + 1 < args.length) {
      inputPath = args[++i];
    } else if ((args[i] === "-o" || args[i] === "--output") && i + 1 < args.length) {
      outputPath = args[++i];
    } else if ((args[i] === "-t" || args[i] === "--theme") && i + 1 < args.length) {
      themeName = args[++i];
    }
  }

  let mermaidText: string;

  if (inputPath && inputPath !== "-") {
    mermaidText = readFileSync(resolve(inputPath), "utf-8").trim();
  } else {
    // Read from stdin
    mermaidText = readFileSync(0, "utf-8").trim();
  }

  if (!mermaidText) {
    console.error("Error: no Mermaid input provided");
    process.exit(1);
  }

  const doc = await mermaidToExcalidraw(mermaidText, themeName);

  const outPath = outputPath.endsWith(".excalidraw") ? outputPath : outputPath + ".excalidraw";
  writeFileSync(outPath, JSON.stringify(doc, null, 2), "utf-8");

  console.log(`Saved: ${resolve(outPath)}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
