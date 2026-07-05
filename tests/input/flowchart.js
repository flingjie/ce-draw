/**
 * Flowchart golden test — simple decision tree.
 * Expected: 4 nodes, 4 arrows, themed with sketchy.
 */
import { Diagram } from "../../dist/index.js";

const d = new Diagram("sketchy", { cols: 4, cellW: 180, cellH: 80, gapX: 60, gapY: 80 });

d.addBox("Login", { row: 0, col: 1 });
d.addBox("Valid?", { row: 1, col: 1, shape: "diamond" });
d.addBox("Dashboard", { row: 2, col: 0 });
d.addBox("Error", { row: 2, col: 2 });

d.addArrow("Login", "Valid?");
d.addArrow("Valid?", "Dashboard", { label: "Yes" });
d.addArrow("Valid?", "Error", { label: "No" });

export default d;
