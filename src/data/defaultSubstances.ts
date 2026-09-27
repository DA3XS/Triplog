import type { Substance } from '../types';

/**
 * Seed substances. Phase timings (onset/comeup/peak/comedown/tail, in
 * minutes) describe a typical hours-scale trip arc; the "from" value is
 * interpolated towards the "till" value as the logged dose goes from light
 * to heavy. Dose thresholds and afterglow/tolerance days are harm-reduction
 * heuristics, not medical advice — all are editable per substance in
 * Settings.
 */

// Mushrooms and truffles: 1h Wirkungseintritt, 4h Wirkdauer, 1h Nachwirkung
// (felt duration 6h), mental afterglow picks up right after.
const psilocybinPhases = {
  onset: { fromMin: 60, tillMin: 60 },
  comeup: { fromMin: 0, tillMin: 0 },
  peak: { fromMin: 240, tillMin: 240 },
  comedown: { fromMin: 60, tillMin: 60 },
  tail: { fromMin: 0, tillMin: 0 },
};

// LSD: same 1:4:1 shape as psilocybin, just expanded to its longer
// duration — 2h Wirkungseintritt, 8h Wirkdauer (peak at 5h), 2h
// Nachwirkung (felt duration 12h).
const lsdPhases = {
  onset: { fromMin: 120, tillMin: 120 },
  comeup: { fromMin: 0, tillMin: 0 },
  peak: { fromMin: 480, tillMin: 480 },
  comedown: { fromMin: 120, tillMin: 120 },
  tail: { fromMin: 0, tillMin: 0 },
};

export const defaultSubstances: Substance[] = [
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    emoji: '🍄',
    color: '#aa3bff',
    order: 0,
    defaultUnit: 'g',
    ...psilocybinPhases,
    // Low 0.5-1.5g, Medium 1.5-2.5g, High 2.5-3.5g, Ultra High 3.5-5g, Heroic 5g+.
    doseThresholds: { low: 0.5, medium: 1.5, high: 2.5, ultraHigh: 3.5, heroic: 5 },
    mentalAfterglowDays: 1,
    toleranceResetDays: 14,
    builtin: true,
  },
  {
    id: 'truffles',
    name: 'Truffles',
    emoji: '🟤',
    color: '#22c55e',
    order: 1,
    defaultUnit: 'g',
    ...psilocybinPhases,
    // Truffles are roughly ~10x weaker by weight than dried mushrooms;
    // scaled proportionally from the Mushrooms thresholds above (estimate).
    doseThresholds: { low: 5, medium: 15, high: 25, ultraHigh: 35, heroic: 50 },
    mentalAfterglowDays: 1,
    toleranceResetDays: 14,
    builtin: true,
  },
  {
    id: '1d-lsd',
    name: 'LSD',
    emoji: '🔹',
    color: '#3b82f6',
    order: 2,
    defaultUnit: 'ug',
    ...lsdPhases,
    // Not specified by the user - estimated from common harm-reduction
    // dosage charts.
    doseThresholds: { low: 25, medium: 75, high: 150, ultraHigh: 250, heroic: 400 },
    mentalAfterglowDays: 1,
    toleranceResetDays: 14,
    builtin: true,
  },
];
