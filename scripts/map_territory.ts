import { Diagram } from "../dist/diagram.js";
import { writeFileSync } from "fs";

const d = new Diagram("sketchy", { cols: 3, cellW: 180, cellH: 90, gapX: 40, gapY: 50 });

// Top section: Map = Your prompts + Context
d.addBox("Map", { row: 0, col: 0, span: 2, width: 380, height: 70 });
d.addBox("Your prompts", { row: 1, col: 0, width: 180 });
d.addBox("Context", { row: 1, col: 1, width: 180 });

// Middle: The gap / Unknowns
d.addBox("Unknowns", { row: 2, col: 0, span: 2, width: 380, height: 100, shape: "diamond" });

// Bottom section: Territory = Real codebase + World constraints
d.addBox("Territory", { row: 4, col: 0, span: 2, width: 380, height: 70 });
d.addBox("Real codebase", { row: 5, col: 0, width: 180 });
d.addBox("World constraints", { row: 5, col: 1, width: 180 });

// Arrows showing relationships
d.addArrow("Map", "Unknowns", { label: "Gap" });
d.addArrow("Unknowns", "Territory", { label: "Gap" });

// Key insight box on the right
d.addBox("Bottleneck shift", { row: 1, col: 2, width: 200, height: 160 });
d.addText("Model capability ↑", 620, 180, 14);
d.addText("Your ability to", 620, 210, 14);
d.addText("clarify unknowns = new bottleneck", 620, 230, 14);

// Save
const doc = d.toDocument();
writeFileSync("output/map_territory.excalidraw", JSON.stringify(doc, null, 2));
console.log("Generated: output/map_territory.excalidraw");
