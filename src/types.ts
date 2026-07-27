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
  /** First physical/mental signals after ingestion. */
  onset: PhaseRange;
  /** Effects visibly building up (visuals, mood, energy). */
  comeup: PhaseRange;
  /** Full effects — most intense phase. */
  peak: PhaseRange;
  /** Effects gradually receding, introspection often still present. */
  comedown: PhaseRange;
  /** Final tail-off (hours-scale), not to be confused with the day-scale mental afterglow below. */
  tail: PhaseRange;
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

export type TripPhase =
  | 'upcoming'
  | 'onset'
  | 'comeup'
  | 'peak'
  | 'comedown'
  | 'tail'
  | 'afterglow'
  | 'tolerance'
  | 'ready';

export interface BackupFile {
  format: 'triplog-backup';
  version: 1;
  exportedAt: string;
  trips: Trip[];
  substances: Substance[];
}
