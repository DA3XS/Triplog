export type Unit = 'g' | 'mg' | 'ug';

export type DoseLevel = 'light' | 'common' | 'strong' | 'heavy';

/** A minute-range for one phase of a trip's effect timeline. */
export interface PhaseRange {
  fromMin: number;
  tillMin: number;
}

export interface Substance {
  id: string;
  name: string;
  emoji: string;
  /** Tailwind-ish hex used for calendar/curve accents. */
  color: string;
  /** Controls display order in pickers; lower sorts first. */
  order: number;
  defaultUnit: Unit;
  /** Time from ingestion until effects start being felt. */
  onset: PhaseRange;
  /** Time from end of onset until the main effects taper off. */
  duration: PhaseRange;
  /** Residual/comedown effects after the main duration (hours-scale). */
  aftereffects: PhaseRange;
  /** Dose thresholds in the substance's defaultUnit, used to label a trip's intensity. */
  doseThresholds: Record<DoseLevel, number>;
  /**
   * Days after the trip during which mental/emotional afterglow is expected
   * (integration period, mood after-effects). This is a personal heuristic,
   * not medical advice, and can be tuned per substance in settings.
   */
  mentalAfterglowDays: number;
  /**
   * Days after the trip start recommended before tripping again, to allow
   * receptor tolerance to reset. Personal/harm-reduction heuristic, editable.
   */
  toleranceResetDays: number;
  /** True for substances seeded by the app; false for user-created ones. */
  builtin: boolean;
}

export interface Trip {
  id: string;
  substanceId: string;
  startTime: string; // ISO string
  /**
   * Optional explicit end of effects, e.g. carried over from an imported
   * legacy record. When absent it is computed from the substance profile.
   */
  endTime?: string;
  amountValue: number;
  amountUnit: Unit;
  notes?: string;
  source: 'manual' | 'import';
  createdAt: string; // ISO string
}

export interface AppMeta {
  key: string;
  value: string;
}

export type TripPhase = 'upcoming' | 'onset' | 'duration' | 'aftereffects' | 'afterglow' | 'tolerance' | 'ready';

export interface BackupFile {
  format: 'triplog-backup';
  version: 1;
  exportedAt: string;
  trips: Trip[];
  substances: Substance[];
}
