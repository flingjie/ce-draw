/**
 * Narrative layout engine — vertical section stack + internal card grid.
 *
 * Designed for concept diagrams, mental models, and framework explanations.
 * Sections stack vertically (TB); cards arrange in a grid inside each section.
 * Transitions connect sections; callout sits at the bottom.
 *
 * Input: sections with nested cards (richer than LayoutNode[])
 * Output: positions for sections, cards, and optional callout
 */

import type { Position } from "../types.js";

// ── Narrative Input Types ─────────────────────────────────────

export interface NarrativeCard {
  id: string;
  title: string;
  subtitle?: string;
}

export interface NarrativeSection {
  id: string;
  heading: string;
  subtitle?: string;
  role?: string;
  cards: NarrativeCard[];
}

export interface NarrativeTransition {
  from: string;
  to: string;
  label: string;
}

export interface NarrativeCallout {
  text: string;
  role?: string;
}

export interface NarrativeInput {
  title?: string;
  sections: NarrativeSection[];
  transitions: NarrativeTransition[];
  callout?: NarrativeCallout;
}

export interface NarrativeLayoutResult {
  /** Section frame positions (keyed by section.id). */
  sections: Map<string, Position>;
  /** Card positions (keyed by card.id). */
  cards: Map<string, Position>;
  /** Optional callout position. */
  callout?: Position;
  /** Title Y position (centered at top). */
  titleY?: number;
  /** Overall diagram width. */
  width: number;
  /** Overall diagram height. */
  height: number;
}

// ── Layout Constants ──────────────────────────────────────────

const MARGIN = 120;
const SECTION_GAP = 60;
const CARD_W = 170;
const CARD_H = 80;
const CARD_GAP_X = 40;
const CARD_GAP_Y = 40;
const SECTION_PAD_TOP = 56;   // heading + subtitle
const SECTION_PAD_BOT = 24;
const SECTION_PAD_X = 24;
const CALLOUT_H = 48;
const MAX_COLS = 3;

// ── Layout Engine ─────────────────────────────────────────────

export function narrativeLayout(input: NarrativeInput, opts?: { cardW?: number; cardH?: number; maxCols?: number }): NarrativeLayoutResult {
  const cardW = opts?.cardW ?? CARD_W;
  const cardH = opts?.cardH ?? CARD_H;
  const maxCols = opts?.maxCols ?? MAX_COLS;

  // Compute section dimensions
  let maxWidth = 0;

  for (const section of input.sections) {
    const cols = Math.min(section.cards.length, maxCols);
    const rows = Math.ceil(section.cards.length / cols);
    const innerW = cols * cardW + (cols - 1) * CARD_GAP_X;
    const fullW = innerW + 2 * SECTION_PAD_X;
    if (fullW > maxWidth) maxWidth = fullW;
  }

  // Also account for callout width
  if (input.callout) {
    // Callout is full-width like sections
  }

  const width = maxWidth + 2 * MARGIN;

  // Position sections vertically
  let currentY = MARGIN;
  if (input.title) {
    currentY += 36; // title height
  }

  const sectionPositions = new Map<string, Position>();
  const cardPositions = new Map<string, Position>();

  for (const section of input.sections) {
    const cols = Math.min(section.cards.length, maxCols);
    const innerW = cols * cardW + (cols - 1) * CARD_GAP_X;
    const fullW = innerW + 2 * SECTION_PAD_X;
    const sectionX = MARGIN + (maxWidth - fullW) / 2;

    const rows = Math.ceil(section.cards.length / cols);
    const innerH = rows * cardH + (rows - 1) * CARD_GAP_Y;
    const fullH = SECTION_PAD_TOP + innerH + SECTION_PAD_BOT;

    sectionPositions.set(section.id, {
      x: sectionX,
      y: currentY,
      width: fullW,
      height: fullH,
    });

    // Position cards within this section
    const cardStartX = sectionX + SECTION_PAD_X;
    const cardStartY = currentY + SECTION_PAD_TOP;

    for (let i = 0; i < section.cards.length; i++) {
      const card = section.cards[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      cardPositions.set(card.id, {
        x: cardStartX + col * (cardW + CARD_GAP_X),
        y: cardStartY + row * (cardH + CARD_GAP_Y),
        width: cardW,
        height: cardH,
      });
    }

    currentY += fullH + SECTION_GAP;
  }

  // Callout position
  let calloutPos: Position | undefined;
  if (input.callout) {
    calloutPos = {
      x: MARGIN,
      y: currentY,
      width: maxWidth,
      height: CALLOUT_H,
    };
    currentY += CALLOUT_H + MARGIN;
  } else {
    currentY += MARGIN;
  }

  return {
    sections: sectionPositions,
    cards: cardPositions,
    callout: calloutPos,
    titleY: input.title ? MARGIN + 28 : undefined,
    width: maxWidth + 2 * MARGIN,
    height: currentY,
  };
}
