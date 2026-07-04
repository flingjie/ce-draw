#!/usr/bin/env node
/**
 * ec-draw SVG exporter — .excalidraw → SVG for Codex preview.
 * Usage: node scripts/export_svg.mjs -i diagram.excalidraw [-o output.svg]
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, basename } from "path";

const FONT_MAP = { 1: "Virgil", 2: "Helvetica", 3: "Cascadia", 4: "Assistant", 5: "Excalifont" };

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderElement(el) {
  const ox = el.opacity / 100;
  const rx = el.roundness ? el.roundness.type * 8 : 0;

  switch (el.type) {
    case "rectangle": {
      const hw = el.width / 2, hh = el.height / 2;
      const rot = el.angle ? ` transform="rotate(${(el.angle * 180) / Math.PI} ${el.x + hw} ${el.y + hh})"` : "";
      return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" ry="${rx}" fill="${el.backgroundColor}" fill-opacity="${ox}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"${rot} stroke-linejoin="round" />`;
    }
    case "ellipse": {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const rot = el.angle ? ` transform="rotate(${(el.angle * 180) / Math.PI} ${cx} ${cy})"` : "";
      return `<ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.backgroundColor}" fill-opacity="${ox}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}"${rot} stroke-linejoin="round" />`;
    }
    case "diamond": {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const pts = `${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`;
      return `<polygon points="${pts}" fill="${el.backgroundColor}" fill-opacity="${ox}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}" stroke-linejoin="round" />`;
    }
    case "arrow":
    case "line": {
      if (!el.points || el.points.length < 2) return "";
      const pts = el.points.map((p) => `${el.x + p.x},${el.y + p.y}`).join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-opacity="${ox}" stroke-linecap="round" stroke-linejoin="round" />`;
    }
    case "text": {
      const font = FONT_MAP[el.fontFamily || 1] || FONT_MAP[1];
      const size = el.fontSize || 20;
      const align = el.textAlign || "center";
      const valign = el.verticalAlign || "middle";
      const txt = el.text || "";
      let tx = el.x, ty = el.y;
      if (align === "center") tx += el.width / 2;
      else if (align === "right") tx += el.width;
      if (valign === "middle") ty += el.height / 2 + size / 3;
      else if (valign === "bottom") ty += el.height;
      else ty += size;
      const lines = txt.split("\n");
      const tspans = lines.map((l, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : size * 1.2}">${escapeXml(l)}</tspan>`).join("");
      const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
      const rot = el.angle ? ` transform="rotate(${(el.angle * 180) / Math.PI} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : "";
      return `<text font-family="${font}" font-size="${size}" fill="${el.strokeColor}" fill-opacity="${ox}" text-anchor="${anchor}"${rot}>${tspans}</text>`;
    }
    default: return "";
  }
}

function main() {
  const args = process.argv.slice(2);
  let inputPath = "", outputPath = "";
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "-i" || args[i] === "--input") && i + 1 < args.length) inputPath = args[++i];
    else if ((args[i] === "-o" || args[i] === "--output") && i + 1 < args.length) outputPath = args[++i];
  }
  if (!inputPath) { console.error("Usage: node scripts/export_svg.mjs -i <file.excalidraw> [-o <output.svg>]"); process.exit(1); }

  const doc = JSON.parse(readFileSync(resolve(inputPath), "utf-8"));
  if (!outputPath) outputPath = basename(inputPath).replace(/\.excalidraw$/, "") + ".svg";

  // Sort: containers → arrows → text
  const sorted = [
    ...doc.elements.filter(e => e.type !== "arrow" && e.type !== "line" && e.type !== "text"),
    ...doc.elements.filter(e => e.type === "arrow" || e.type === "line"),
    ...doc.elements.filter(e => e.type === "text"),
  ];

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of doc.elements) {
    minX = Math.min(minX, el.x); minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height);
  }
  const pad = 40, vbX = minX - pad, vbY = minY - pad, vbW = maxX - minX + pad * 2, vbH = maxY - minY + pad * 2;
  const bg = doc.appState?.viewBackgroundColor || "#ffffff";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}">
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}" />
  ${sorted.map(renderElement).filter(Boolean).join("\n  ")}
</svg>`;

  writeFileSync(outputPath, svg, "utf-8");
  console.log(`Saved: ${resolve(outputPath)}`);
}
main();
