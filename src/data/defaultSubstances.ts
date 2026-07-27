import type { Substance } from '../types';

/**
 * Seed substances. Phase timings (onset/comeup/peak/comedown/tail, in
 * minutes) describe a typical hours-scale trip arc; the "from" value is
 * interpolated towards the "till" value as the logged dose goes from light
 * to heavy. Dose thresholds and afterglow/tolerance days are harm-reduction
 * heuristics, not medical advice — all are editable per substance in
 * Settings.
 */

// Mushrooms and truffles: felt duration ~4-6h, full arc ~5-9h depending on dose.
const psilocybinPhases = {
  onset: { fromMin: 20, tillMin: 40 },
  comeup: { fromMin: 30, tillMin: 60 },
  peak: { fromMin: 90, tillMin: 150 },
  comedown: { fromMin: 120, tillMin: 180 },
  tail: { fromMin: 60, tillMin: 120 },
  peakShape: 'apex' as const,
};

// LSD: longer and flatter throughout — felt duration ~8-12h, full arc ~9.5-15.5h.
const lsdPhases = {
  onset: { fromMin: 30, tillMin: 60 },
  comeup: { fromMin: 60, tillMin: 90 },
  peak: { fromMin: 180, tillMin: 300 },
  comedown: { fromMin: 180, tillMin: 240 },
  tail: { fromMin: 120, tillMin: 240 },
  peakShape: 'plateau' as const,
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
    mentalAfterglowDays: 2,
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
    mentalAfterglowDays: 2,
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
    mentalAfterglowDays: 2,
    toleranceResetDays: 14,
    builtin: true,
  },
];
