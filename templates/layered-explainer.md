# Layered Explainer Template

Use when explaining a **single concept** across increasing depth layers.
Each section goes deeper: what → how → why. Vertical sections, same `narrative`
archetype as `narrative-framework`.

Belongs to `narrative` archetype.

## When to use

- "Explain React's rendering model" (What→How→Why)
- Architecture deep-dive (Overview→Components→Data Flow)
- Tutorial progression (Beginner→Intermediate→Advanced)
- Any "from concept to detail" explanation

## Information slots (required)

- [ ] `title` — the concept being explained
- [ ] 2–4 `sections` in depth order:
  - Section 0: "WHAT" (definition, overview) — `role: "map"`
  - Section 1: "HOW" (mechanism, process) — `role: "territory"`
  - Section 2: "WHY" (rationale, trade-offs) — `role: "callout"`
- [ ] 1–4 `items` per section with `title` + `subtitle`
- [ ] `transitions` between sections: "then", "because", "this enables"
- [ ] optional `callout` with the key takeaway

## Visual hierarchy

Same as `narrative-framework`:
1. Title (24px)
2. Section heading (16px bold)
3. Item title (16px) + subtitle (12px muted)
4. Transition label (14px)
5. Callout (16px bold)

## Layout rules

- Direction: **TB**
- Section internal: `cols = min(itemCount, 3)`
- Max 3 sections (what/how/why)
- Roles: map (blue), territory (green), callout (amber)

## Anti-patterns

- ❌ More than 4 sections — split into separate diagrams
- ❌ Items without subtitles — layered explanation needs the "so what"
- ❌ Abstract headings — use concrete verbs/outcomes

## Golden reference

→ `templates/narrative-framework.md` for base pattern; adapt section count + roles
