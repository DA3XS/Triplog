import type { DoseLevel, Substance, Trip, TripPhase, Unit } from '../types';

const UNIT_TO_UG: Record<Unit, number> = { g: 1_000_000, mg: 1000, ug: 1 };

export function convertAmount(value: number, from: Unit, to: Unit): number {
  return (value * UNIT_TO_UG[from]) / UNIT_TO_UG[to];
}

/** Amount expressed in the substance's own default unit, for threshold comparisons. */
export function normalizedAmount(substance: Substance, value: number, unit: Unit): number {
  return convertAmount(value, unit, substance.defaultUnit);
}

/** Dose levels in ascending order — index (0-4) doubles as the "1-5" scale shown in the UI. */
export const DOSE_LEVEL_ORDER: DoseLevel[] = ['low', 'medium', 'high', 'ultraHigh', 'heroic'];

export const DOSE_LEVEL_LABEL: Record<DoseLevel, string> = {
  low: 'Low Dose',
  medium: 'Medium Dose',
  high: 'High Dose',
  ultraHigh: 'Ultra High',
  heroic: 'Heroic Dose',
};

/** Light-to-dark purple scale, one color per dose level, used for the DoseScaleBar and level badges. */
export const DOSE_LEVEL_COLOR: Record<DoseLevel, string> = {
  low: '#ddd6fe',
  medium: '#c4b5fd',
  high: '#a78bfa',
  ultraHigh: '#7c3aed',
  heroic: '#5b21b6',
};

/** Readable text color against the corresponding DOSE_LEVEL_COLOR background. */
export const DOSE_LEVEL_TEXT_COLOR: Record<DoseLevel, string> = {
  low: '#3b0764',
  medium: '#3b0764',
  high: '#ffffff',
  ultraHigh: '#ffffff',
  heroic: '#ffffff',
};

/**
 * A continuous 0..1 factor describing how strong a dose is relative to the
 * substance's low/medium/high/ultraHigh/heroic thresholds. Used to stretch
 * the effect timeline for bigger doses.
 */
export function doseScaleFactor(substance: Substance, value: number, unit: Unit): number {
  const amount = normalizedAmount(substance, value, unit);
  const { low, medium, high, ultraHigh, heroic } = substance.doseThresholds;
  const points: [number, number][] = [
    [0, 0],
    [low, 0.2],
    [medium, 0.4],
    [high, 0.6],
    [ultraHigh, 0.8],
    [heroic, 1],
  ];
  if (amount >= heroic) return 1;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (amount >= x0 && amount <= x1) {
      if (x1 === x0) return y1;
      return y0 + ((amount - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 1;
}

export function getDoseLevel(substance: Substance, value: number, unit: Unit): DoseLevel {
  const amount = normalizedAmount(substance, value, unit);
  const { medium, high, ultraHigh, heroic } = substance.doseThresholds;
  if (amount >= heroic) return 'heroic';
  if (amount >= ultraHigh) return 'ultraHigh';
  if (amount >= high) return 'high';
  if (amount >= medium) return 'medium';
  return 'low';
}

function interpolatePhase(range: { fromMin: number; tillMin: number }, factor: number): number {
  return range.fromMin + factor * (range.tillMin - range.fromMin);
}

export interface TripBoundaries {
  start: Date;
  onsetEnd: Date;
  comeupEnd: Date;
  peakEnd: Date;
  comedownEnd: Date;
  /** End of the hours-scale pharmacological effects (tail/Ausklang). */
  tailEnd: Date;
  /** End of the days-scale mental afterglow window. */
  afterglowEnd: Date;
  toleranceResetEnd: Date;
}

/** Computes every phase boundary for a trip, scaled by its dose intensity. */
export function computeTripBoundaries(trip: Trip, substance: Substance): TripBoundaries {
  const factor = doseScaleFactor(substance, trip.amountValue, trip.amountUnit);
  const start = new Date(trip.startTime);

  const onsetMin = interpolatePhase(substance.onset, factor);
  const comeupMin = interpolatePhase(substance.comeup, factor);
  const peakMin = interpolatePhase(substance.peak, factor);
  const comedownMin = interpolatePhase(substance.comedown, factor);
  const tailMin = interpolatePhase(substance.tail, factor);

  const onsetEnd = new Date(start.getTime() + onsetMin * 60_000);
  const comeupEnd = new Date(onsetEnd.getTime() + comeupMin * 60_000);
  const peakEnd = new Date(comeupEnd.getTime() + peakMin * 60_000);
  const comedownEnd = new Date(peakEnd.getTime() + comedownMin * 60_000);
  const tailEnd = new Date(comedownEnd.getTime() + tailMin * 60_000);
  const afterglowEnd = new Date(start.getTime() + substance.mentalAfterglowDays * 86_400_000);
  const toleranceResetEnd = new Date(start.getTime() + substance.toleranceResetDays * 86_400_000);

  return { start, onsetEnd, comeupEnd, peakEnd, comedownEnd, tailEnd, afterglowEnd, toleranceResetEnd };
}

export interface TripPhaseInfo {
  phase: TripPhase;
  /** Progress within the current phase, 0..1. */
  progress: number;
  boundaries: TripBoundaries;
}

export function getTripPhaseAt(trip: Trip, substance: Substance, now: Date): TripPhaseInfo {
  const b = computeTripBoundaries(trip, substance);
  const t = now.getTime();

  const frame = (from: Date, to: Date): number => {
    const span = to.getTime() - from.getTime();
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, (t - from.getTime()) / span));
  };

  if (t < b.start.getTime()) return { phase: 'upcoming', progress: 0, boundaries: b };
  if (t < b.onsetEnd.getTime()) return { phase: 'onset', progress: frame(b.start, b.onsetEnd), boundaries: b };
  if (t < b.comeupEnd.getTime())
    return { phase: 'comeup', progress: frame(b.onsetEnd, b.comeupEnd), boundaries: b };
  if (t < b.peakEnd.getTime()) return { phase: 'peak', progress: frame(b.comeupEnd, b.peakEnd), boundaries: b };
  if (t < b.comedownEnd.getTime())
    return { phase: 'comedown', progress: frame(b.peakEnd, b.comedownEnd), boundaries: b };
  if (t < b.tailEnd.getTime()) return { phase: 'tail', progress: frame(b.comedownEnd, b.tailEnd), boundaries: b };
  if (t < b.afterglowEnd.getTime())
    return { phase: 'afterglow', progress: frame(b.tailEnd, b.afterglowEnd), boundaries: b };
  if (t < b.toleranceResetEnd.getTime())
    return { phase: 'tolerance', progress: frame(b.afterglowEnd, b.toleranceResetEnd), boundaries: b };
  return { phase: 'ready', progress: 1, boundaries: b };
}

const PHASE_SEVERITY: Record<TripPhase, number> = {
  upcoming: 0,
  ready: 0,
  tolerance: 1,
  afterglow: 2,
  tail: 3,
  comedown: 4,
  comeup: 5,
  onset: 6,
  peak: 7,
};

export interface OverallStatus {
  phase: TripPhase;
  /** The trip currently driving the status, if any. */
  activeTrip: Trip | null;
  /** Most recent trip overall, regardless of whether its effects have cleared. */
  lastTrip: Trip | null;
  /** When tolerance is expected to have fully reset (max across overlapping trips). */
  nextPossibleTripDate: Date | null;
  daysSinceLastTrip: number | null;
}

export function getOverallStatus(
  trips: Trip[],
  substancesById: Map<string, Substance>,
  now: Date,
): OverallStatus {
  const sorted = [...trips].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const lastTrip = sorted[0] ?? null;

  const active = sorted
    .map((trip) => {
      const substance = substancesById.get(trip.substanceId);
      if (!substance) return null;
      const info = getTripPhaseAt(trip, substance, now);
      if (info.phase === 'ready' || info.phase === 'upcoming') return null;
      return { trip, info };
    })
    .filter((x): x is { trip: Trip; info: TripPhaseInfo } => x !== null);

  const daysSinceLastTrip = lastTrip
    ? Math.floor((now.getTime() - new Date(lastTrip.startTime).getTime()) / 86_400_000)
    : null;

  if (active.length === 0) {
    return { phase: 'ready', activeTrip: null, lastTrip, nextPossibleTripDate: null, daysSinceLastTrip };
  }

  const mostSevere = active.reduce((best, cur) =>
    PHASE_SEVERITY[cur.info.phase] > PHASE_SEVERITY[best.info.phase] ? cur : best,
  );
  const nextPossibleTripDate = active.reduce<Date | null>((latest, cur) => {
    const end = cur.info.boundaries.toleranceResetEnd;
    return !latest || end > latest ? end : latest;
  }, null);

  return {
    phase: mostSevere.info.phase,
    activeTrip: mostSevere.trip,
    lastTrip,
    nextPossibleTripDate,
    daysSinceLastTrip,
  };
}
