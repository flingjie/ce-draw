/**
 * Architecture golden test — 3-tier architecture.
 * Expected: 4 boxes, 3 arrows, themed with sketchy.
 */
import { Diagram } from "../../dist/index.js";

const d = new Diagram("sketchy", { cols: 3, cellW: 160, cellH: 80, gapX: 50, gapY: 60 });

// Client tier
d.addBox("Browser", { row: 0, col: 1, width: 160 });

// API tier
d.addBox("API Gateway", { row: 1, col: 0 });
d.addBox("Auth Service", { row: 1, col: 1 });
d.addBox("Business Logic", { row: 1, col: 2 });

// Data tier
d.addBox("PostgreSQL", { row: 2, col: 1, width: 160 });

// Connections
d.addArrow("Browser", "API Gateway");
d.addArrow("API Gateway", "Auth Service");
d.addArrow("API Gateway", "Business Logic");
d.addArrow("Auth Service", "PostgreSQL");
d.addArrow("Business Logic", "PostgreSQL");

export default d;
