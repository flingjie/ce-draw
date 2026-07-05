/**
 * Map vs Territory — thin wrapper over a content file.
 *
 * Before (Phase 0): 32 lines of manual grid + addBox + addArrow
 * After  (Phase 5): read content JSON → renderFromRecipe → save
 */
import { renderFromRecipe } from "../dist/recipe.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const content = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../content/map-territory.en.json"), "utf-8")
);

const doc = renderFromRecipe("narrative", content, "sketchy");
writeFileSync("output/map-territory.excalidraw", JSON.stringify(doc, null, 2));
console.log("✅ Generated: output/map-territory.excalidraw (from content/map-territory.en.json)");
