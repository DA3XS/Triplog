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

// LSD: longer and flatter throughout — felt duration ~8-12h, full arc ~9.5-15.5h.
const lsdPhases = {
  onset: { fromMin: 30, tillMin: 60 },
  comeup: { fromMin: 60, tillMin: 90 },
  peak: { fromMin: 180, tillMin: 300 },
  comedown: { fromMin: 180, tillMin: 240 },
  tail: { fromMin: 120, tillMin: 240 },
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
    doseThresholds: { light: 0.5, common: 1, strong: 2.5, heavy: 4 },
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
    doseThresholds: { light: 5, common: 10, strong: 15, heavy: 25 },
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
    doseThresholds: { light: 25, common: 50, strong: 125, heavy: 250 },
    mentalAfterglowDays: 1,
    toleranceResetDays: 14,
    builtin: true,
  },
];
