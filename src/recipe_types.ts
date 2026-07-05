/** Archetype determines which layout engine renders the diagram. */
export type Archetype = "narrative" | "flow" | "topology" | "comparison" | "pipeline";

/** Template frontmatter — parsed from YAML between --- markers. */
export interface TemplateConfig {
  id: string;
  schema_version: number;
  archetype: Archetype;
  description: string;
  grid: {
    cols: number;
    cellW: number;
    cellH: number;
    gapX: number;
    gapY: number;
  };
  direction: "TB" | "LR";
  /** Role name → color key (resolved via tokens.yaml colors) */
  roles: Record<string, string>;
}

// ── Per-archetype slot types ────────────────────────────────────

export interface CardSlot {
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface SectionSlot {
  heading: string;
  subtitle?: string;
  role: string;
  items: CardSlot[];
}

export interface TransitionSlot {
  from: number; // section index
  to: number;   // section index
  label: string;
}

export interface CalloutSlot {
  text: string;
  icon?: string;
}

export interface NarrativeSlots {
  title?: string;
  sections: SectionSlot[];
  transitions: TransitionSlot[];
  callout?: CalloutSlot;
}

// Future archetype slot types (not yet wired):
// export interface FlowSlots { nodes: ...; edges: ... }
// export interface TopologySlots { ... }
// export interface ComparisonSlots { ... }
// export interface PipelineSlots { ... }

/** Union of all archetype slot types. */
export type RecipeSlots = NarrativeSlots;
// | FlowSlots | TopologySlots | ComparisonSlots | PipelineSlots;
