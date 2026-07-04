 #!/usr/bin/env npx tsx
 /**
  * ec-draw SVG exporter — .excalidraw → SVG for Codex preview.
  *
  * Usage:
  *   npx tsx scripts/export_svg.ts -i diagram.excalidraw -o diagram.svg
  *   npx tsx scripts/export_svg.ts -i diagram.excalidraw  # auto-names output
  */
 
 import { readFileSync, writeFileSync } from "fs";
 import { resolve, basename } from "path";
 
 interface Element {
   id: string;
   type: string;
   x: number;
   y: number;
   width: number;
   height: number;
   angle: number;
   strokeColor: string;
   backgroundColor: string;
   fillStyle: string;
   strokeWidth: number;
   roughness: number;
   opacity: number;
   roundness: { type: number } | null;
   boundElements: Array<{ id: string; type: string }> | null;
   points?: Array<{ x: number; y: number }>;
   text?: string;
   fontSize?: number;
   fontFamily?: number;
   textAlign?: string;
   verticalAlign?: string;
   containerId?: string | null;
   strokeSharpness?: string;
 }
 
 interface Doc {
   elements: Element[];
   appState: { viewBackgroundColor: string };
 }
 
 const FONT_MAP: Record<number, string> = {
   1: "Virgil, 'Segoe UI Emoji'",
   2: "Helvetica, 'Segoe UI Emoji'",
   3: "Cascadia, 'Segoe UI Emoji'",
   4: "Assistant, 'Segoe UI Emoji'",
   5: "'Excalifont', 'Segoe UI Emoji'",
 };
 
 function escapeXml(s: string): string {
   return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
 }
 
 function renderElement(el: Element): string {
   const ox = el.opacity / 100;
   const rx = el.roundness ? el.roundness.type * 8 : 0;
 
   switch (el.type) {
     case "rectangle": {
       const hw = el.width / 2;
       const hh = el.height / 2;
       return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" ry="${rx}"
         fill="${el.backgroundColor}" fill-opacity="${ox}"
         stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"
         ${el.angle ? `transform="rotate(${(el.angle * 180) / Math.PI} ${el.x + hw} ${el.y + hh})"` : ""}
         stroke-linejoin="round" />`;
     }
 
     case "ellipse": {
       const cx = el.x + el.width / 2;
       const cy = el.y + el.height / 2;
       return `<ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}"
         fill="${el.backgroundColor}" fill-opacity="${ox}"
         stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"
         ${el.angle ? `transform="rotate(${(el.angle * 180) / Math.PI} ${cx} ${cy})"` : ""}
         stroke-linejoin="round" />`;
     }
 
     case "diamond": {
       const cx = el.x + el.width / 2;
       const cy = el.y + el.height / 2;
       const hw = el.width / 2;
       const hh = el.height / 2;
       const pts = `${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`;
       return `<polygon points="${pts}"
         fill="${el.backgroundColor}" fill-opacity="${ox}"
         stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"
         stroke-linejoin="round" />`;
     }
 
     case "arrow":
     case "line": {
       if (!el.points || el.points.length < 2) return "";
       const pts = el.points.map((p) => `${el.x + p.x},${el.y + p.y}`).join(" ");
       let arrowHead = "";
       if (el.type === "arrow") {
         const last = el.points[el.points.length - 1];
         const prev = el.points[el.points.length - 2];
         arrowHead = arrowSvg(el.x + last.x, el.y + last.y, el.x + prev.x, el.y + prev.y, el.strokeColor);
       }
       return `<polyline points="${pts}"
         fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"
         stroke-linecap="round" stroke-linejoin="round" />${arrowHead}`;
     }
 
     case "text": {
       const font = FONT_MAP[el.fontFamily || 1] || FONT_MAP[1];
       const size = el.fontSize || 20;
       const align = el.textAlign || "center";
       const valign = el.verticalAlign || "middle";
       const txt = el.text || "";
 
       let tx = el.x;
       if (align === "center") tx += el.width / 2;
       else if (align === "right") tx += el.width;
 
       let ty = el.y;
       if (valign === "middle") ty += el.height / 2 + size / 3;
       else if (valign === "bottom") ty += el.height;
       else ty += size;
 
       const lines = txt.split("\n");
       const tspans = lines
         .map((line, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : size * 1.2}">${escapeXml(line)}</tspan>`)
         .join("");
 
       return `<text font-family="${font}" font-size="${size}" fill="${el.strokeColor}" fill-opacity="${ox}"
         text-anchor="${align === "center" ? "middle" : align === "right" ? "end" : "start"}"
         ${el.angle ? `transform="rotate(${(el.angle * 180) / Math.PI} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : ""}>
         ${tspans}</text>`;
     }
 
     default:
       return "";
   }
 }
 
 function arrowSvg(x1: number, y1: number, x2: number, y2: number, color: string): string {
   const size = 10;
   const angle = Math.atan2(y1 - y2, x1 - x2);
   const a1 = angle + Math.PI / 6;
   const a2 = angle - Math.PI / 6;
   return `<polygon points="${x1},${y1} ${x1 - size * Math.cos(a1)},${y1 - size * Math.sin(a1)} ${x1 - size * Math.cos(a2)},${y1 - size * Math.sin(a2)}"
     fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round" />`;
 }
 
 function main() {
   const args = process.argv.slice(2);
   let inputPath = "";
   let outputPath = "";
 
   for (let i = 0; i < args.length; i++) {
     if ((args[i] === "-i" || args[i] === "--input") && i + 1 < args.length) {
       inputPath = args[++i];
     } else if ((args[i] === "-o" || args[i] === "--output") && i + 1 < args.length) {
       outputPath = args[++i];
     }
   }
 
   if (!inputPath) {
     console.error("Usage: npx tsx scripts/export_svg.ts -i <file.excalidraw> [-o <output.svg>]");
     process.exit(1);
   }
 
   const json = readFileSync(resolve(inputPath), "utf-8");
   const doc: Doc = JSON.parse(json);
 
   if (!outputPath) {
     outputPath = basename(inputPath).replace(/\.excalidraw$/, "") + ".svg";
   }
 
   const containerEls = doc.elements.filter((e) => e.containerId);
   const nonTextEls = doc.elements.filter((e) => e.type !== "text");
   const textEls = doc.elements.filter((e) => e.type === "text");
 
   // Calculate bounding box
   const allEls = [...nonTextEls, ...textEls];
   let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
   for (const el of allEls) {
     minX = Math.min(minX, el.x);
     minY = Math.min(minY, el.y);
     maxX = Math.max(maxX, el.x + el.width);
     maxY = Math.max(maxY, el.y + el.height);
   }
 
   const pad = 40;
   const vbW = maxX - minX + pad * 2;
   const vbH = maxY - minY + pad * 2;
   const vbX = minX - pad;
   const vbY = minY - pad;
 
   const bg = doc.appState?.viewBackgroundColor || "#ffffff";
 
   const elements = [
     // Containers first (frames, rects)
     ...nonTextEls.filter((e) => !e.containerId),
     // Arrows/lines on top
     ...nonTextEls.filter((e) => e.type === "arrow" || e.type === "line"),
   ].filter((el, i, arr) => arr.findIndex((x) => x.id === el.id) === i); // dedupe
 
   // Sort: non-arrow first, then arrows
   const sorted = [
     ...elements.filter((e) => e.type !== "arrow" && e.type !== "line"),
     ...elements.filter((e) => e.type === "arrow" || e.type === "line"),
     ...textEls,
   ];
 
   const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}">
   <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}" />
   ${sorted.map(renderElement).filter(Boolean).join("\n  ")}
 </svg>`;
 
   writeFileSync(outputPath, svg, "utf-8");
   console.log(`Saved: ${resolve(outputPath)}`);
 }
 
 main();
