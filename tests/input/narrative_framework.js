/**
 * Golden test: narrative-framework recipe — Map vs Territory.
 * Expected: 3 sections, 6 cards, 2 labeled transitions, 1 callout.
 *
 * Wraps renderFromRecipe result in a toDocument() shim for CLI run mode.
 */
import { renderFromRecipe } from "../../dist/index.js";

const doc = renderFromRecipe("narrative-framework", {
  title: "MAP vs TERRITORY",
  sections: [
    {
      heading: "MAP — Your Mental Model",
      subtitle: "What you think the world is",
      role: "primary",
      items: [
        { title: "Prompt", subtitle: "What you ask the model", icon: "document" },
        { title: "Context", subtitle: "What the model remembers", icon: "brain" },
      ],
    },
    {
      heading: "UNKNOWNS — The Gap",
      subtitle: "What you don't know you don't know",
      role: "gap",
      items: [
        { title: "Hidden Constraints", subtitle: "Undocumented requirements", icon: "lock" },
        { title: "Missing Context", subtitle: "Context not in your prompt", icon: "document" },
      ],
    },
    {
      heading: "TERRITORY — The Real World",
      subtitle: "What actually exists",
      role: "secondary",
      items: [
        { title: "Codebase", subtitle: "Real files and logic", icon: "code" },
        { title: "Constraints", subtitle: "Physical and business limits", icon: "lock" },
      ],
    },
  ],
  transitions: [
    { from: 0, to: 1, label: "cannot fully describe reality" },
    { from: 1, to: 2, label: "must be actively discovered" },
  ],
  callout: {
    text: "Today's bottleneck is not model capability — it's your ability to clarify unknowns.",
    icon: "fire",
  },
});

// CLI expects .toDocument() on the default export
export default {
  toDocument: () => doc,
  toJSON: () => JSON.stringify(doc, null, 2),
};
