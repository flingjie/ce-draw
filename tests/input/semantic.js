/**
 * Semantic components golden test — Card, Section, Callout, Transition.
 * Expected: 2 sections, 3 cards, 2 labeled transitions, 1 callout.
 */
import { Diagram } from "../../dist/index.js";

const d = new Diagram("sketchy", { cols: 3, cellW: 160, cellH: 80, gapX: 50, gapY: 60 });

// Section 0: "INPUT" zone
d.addSection("inputSection", {
  heading: "INPUT",
  subtitle: "Data ingestion layer",
  role: "map",
  row: 0, col: 0, span: 3, width: 580, height: 160,
});

// Cards in the input section area
d.addCard("sourceA", {
  title: "Source A",
  subtitle: "Streaming data",
  icon: "cloud",
  role: "map",
  row: 1, col: 0,
});

d.addCard("sourceB", {
  title: "Source B",
  subtitle: "Batch uploads",
  icon: "document",
  role: "map",
  row: 1, col: 1,
});

// Section 1: "PROCESSING" zone
d.addSection("processingSection", {
  heading: "PROCESSING",
  subtitle: "Transformation layer",
  role: "territory",
  row: 2, col: 0, span: 3, width: 580, height: 160,
});

d.addCard("transform", {
  title: "Transform",
  subtitle: "ETL pipeline",
  icon: "gear",
  role: "territory",
  row: 3, col: 0,
});

// Labeled transitions
d.addTransition("sourceA", "transform", { label: "raw events" });
d.addTransition("sourceB", "transform", { label: "batch files" });

// Callout at bottom
d.addCallout("insight", {
  text: "Data must be validated before transformation",
  icon: "lock",
  role: "callout",
  row: 4, col: 0, span: 3,
});

export default d;
