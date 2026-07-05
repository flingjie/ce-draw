import type { TemplateConfig, NarrativeSlots } from "./recipe_types.js";

/** Validate NarrativeSlots against template config. Returns errors array (empty = valid). */
export function validateNarrativeSlots(
  slots: NarrativeSlots,
  config: TemplateConfig
): string[] {
  const errors: string[] = [];

  // sections
  if (!Array.isArray(slots.sections) || slots.sections.length === 0) {
    errors.push("sections: must be a non-empty array");
  } else if (slots.sections.length < 2) {
    errors.push("sections: narrative archetype requires at least 2 sections");
  } else {
    for (let i = 0; i < slots.sections.length; i++) {
      const s = slots.sections[i];
      if (!s.heading || typeof s.heading !== "string") {
        errors.push(`sections[${i}].heading: required string`);
      }
      if (!s.role || typeof s.role !== "string") {
        errors.push(`sections[${i}].role: required string`);
      } else if (config.roles && !config.roles[s.role]) {
        errors.push(`sections[${i}].role: "${s.role}" not defined in template roles (${Object.keys(config.roles).join(", ")})`);
      }
      if (!Array.isArray(s.items) || s.items.length === 0) {
        errors.push(`sections[${i}].items: must be a non-empty array`);
      } else {
        for (let j = 0; j < s.items.length; j++) {
          if (!s.items[j].title || typeof s.items[j].title !== "string") {
            errors.push(`sections[${i}].items[${j}].title: required string`);
          }
        }
      }
    }
  }

  // transitions
  if (!Array.isArray(slots.transitions)) {
    errors.push("transitions: must be an array");
  } else {
    for (let i = 0; i < slots.transitions.length; i++) {
      const t = slots.transitions[i];
      if (typeof t.from !== "number" || t.from < 0 || t.from >= slots.sections.length) {
        errors.push(`transitions[${i}].from: must be valid section index (0–${slots.sections.length - 1})`);
      }
      if (typeof t.to !== "number" || t.to < 0 || t.to >= slots.sections.length) {
        errors.push(`transitions[${i}].to: must be valid section index (0–${slots.sections.length - 1})`);
      }
      if (t.from === t.to) {
        errors.push(`transitions[${i}]: from and to must be different (got ${t.from})`);
      }
      if (!t.label || typeof t.label !== "string" || t.label.trim() === "") {
        errors.push(`transitions[${i}].label: required non-empty string (narrative arrows need labels)`);
      }
    }
  }

  // callout (optional)
  if (slots.callout !== undefined) {
    if (!slots.callout.text || typeof slots.callout.text !== "string") {
      errors.push("callout.text: required string when callout is present");
    }
  }

  return errors;
}
