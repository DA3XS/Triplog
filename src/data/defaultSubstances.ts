import type { Substance } from '../types';

/**
 * Seed substances, mirroring the profiles from the legacy Openmind export
 * where available. Onset/duration/aftereffects are in minutes. Dose
 * thresholds and afterglow/tolerance days are harm-reduction heuristics,
 * not medical advice — all are editable per substance in Settings.
 */
export const defaultSubstances: Substance[] = [
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    emoji: '🍄',
    color: '#aa3bff',
    order: 0,
    defaultUnit: 'g',
    onset: { fromMin: 60, tillMin: 120 },
    duration: { fromMin: 240, tillMin: 400 },
    aftereffects: { fromMin: 60, tillMin: 1440 },
    doseThresholds: { light: 0.5, common: 1, strong: 2.5, heavy: 4 },
    mentalAfterglowDays: 3,
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
    onset: { fromMin: 40, tillMin: 90 },
    duration: { fromMin: 180, tillMin: 360 },
    aftereffects: { fromMin: 60, tillMin: 1080 },
    doseThresholds: { light: 5, common: 10, strong: 15, heavy: 25 },
    mentalAfterglowDays: 3,
    toleranceResetDays: 14,
    builtin: true,
  },
  {
    id: '1d-lsd',
    name: '1D-LSD',
    emoji: '🔹',
    color: '#3b82f6',
    order: 2,
    defaultUnit: 'ug',
    onset: { fromMin: 45, tillMin: 90 },
    duration: { fromMin: 480, tillMin: 720 },
    aftereffects: { fromMin: 360, tillMin: 1440 },
    doseThresholds: { light: 25, common: 50, strong: 125, heavy: 250 },
    mentalAfterglowDays: 4,
    toleranceResetDays: 14,
    builtin: true,
  },
];
