export type Unit = 'g' | 'mg' | 'ug';

export type DoseLevel = 'low' | 'medium' | 'high' | 'ultraHigh' | 'heroic';

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
   * (integration period, mood after-effects). A fixed harm-reduction
   * heuristic, not medical advice — not user-editable.
   */
  mentalAfterglowDays: number;
  /**
   * Days after the trip start recommended before tripping again, to allow
   * receptor tolerance to reset. A fixed harm-reduction heuristic, not
   * user-editable.
   */
  toleranceResetDays: number;
  /** True for substances seeded by the app; false for user-created ones. */
  builtin: boolean;
}

/** One timestamped entry in a trip's journal — added during or after the trip. */
export interface JournalEntry {
  id: string;
  timestamp: string; // ISO string
  text: string;
}

/** An additional dose taken during an already-running trip ("Nachlegen"), in the trip's own amountUnit. */
export interface Redose {
  id: string;
  time: string; // ISO string
  value: number;
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
  /** Additional doses taken during this same trip ("Nachlegen"), in amountUnit. */
  redoses?: Redose[];
  notes?: string;
  /** Where the trip took place — optional "Set & Setting" context. */
  location?: string;
  /** Alone or with other people — optional "Set & Setting" context. */
  setting?: 'alone' | 'accompanied';
  /** Mood right before taking the substance, 1 (schlecht) to 5 (gut) — optional "Set & Setting" context. */
  moodBefore?: number;
  /** Diary entries added over time, during or after the trip. */
  journal?: JournalEntry[];
  /** 1 (worst) to 5 (best), settable once the felt effects have worn off. */
  rating?: number;
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
