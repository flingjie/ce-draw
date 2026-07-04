import { Diagram } from "./dist/index.js";

const d = new Diagram("sketchy", {
  cols: 3,
  cellW: 220,
  cellH: 120,
  gapX: 50,
  gapY: 70,
});

// Left: Map (your internal model)
d.addBox("🗺️ 地图 Map\n──────────\n你的提示 + 上下文", {
  row: 0,
  col: 0,
  height: 130,
});

// Center: The gap — Unknowns
d.addBox("❓ Unknowns", {
  row: 0,
  col: 1,
  shape: "diamond",
  width: 140,
  height: 90,
});

// Right: Territory (real world)
d.addBox("🌍 领土 Territory\n──────────\n真实代码库 + 世界约束", {
  row: 0,
  col: 2,
  height: 130,
});

// Arrows map → gap → territory
d.addArrow("🗺️ 地图 Map\n──────────\n你的提示 + 上下文", "❓ Unknowns");
d.addArrow("❓ Unknowns", "🌍 领土 Territory\n──────────\n真实代码库 + 世界约束");

// Bottom insight
d.addBox("💡 模型强到，瓶颈已是澄清未知的能力", {
  row: 1,
  col: 0,
  span: 3,
  height: 55,
  shape: "rectangle",
});

d.save("map-territory.excalidraw");
console.log("Done: map-territory.excalidraw");
