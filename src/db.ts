import Dexie, { type Table } from 'dexie';
import type { AppMeta, PhaseRange, Substance, Trip } from './types';
import { defaultSubstances } from './data/defaultSubstances';

export class TriplogDB extends Dexie {
  trips!: Table<Trip, string>;
  substances!: Table<Substance, string>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super('triplog');
    this.version(1).stores({
      trips: 'id, substanceId, startTime',
      substances: 'id',
      meta: 'key',
    });
  }
}

export const db = new TriplogDB();

/** Seeds built-in substances on first run without overwriting user edits. */
export async function ensureSeedData() {
  const count = await db.substances.count();
  if (count === 0) {
    await db.substances.bulkAdd(defaultSubstances);
  }
}

function isCurrentPhaseShape(s: Substance): boolean {
  return Boolean(s.comeup && s.peak && s.comedown && s.tail);
}

/** Splits an old single duration/aftereffects block into the newer 5-phase shape as a best-effort fallback. */
function splitLegacyPhases(legacy: {
  duration?: PhaseRange;
  aftereffects?: PhaseRange;
}): Pick<Substance, 'comeup' | 'peak' | 'comedown' | 'tail'> {
  const duration = legacy.duration ?? { fromMin: 120, tillMin: 240 };
  const aftereffects = legacy.aftereffects ?? { fromMin: 60, tillMin: 240 };
  const scale = (r: PhaseRange, factor: number): PhaseRange => ({
    fromMin: Math.round(r.fromMin * factor),
    tillMin: Math.round(r.tillMin * factor),
  });
  return {
    comeup: scale(duration, 0.3),
    peak: scale(duration, 0.5),
    comedown: scale(duration, 0.2),
    tail: { fromMin: Math.min(aftereffects.fromMin, 240), tillMin: Math.min(aftereffects.tillMin, 240) },
  };
}

/**
 * Upgrades substances already stored in the user's browser to the current
 * app schema. Runs on every start so shipping a code update (new phase
 * model, renamed substance, adjusted dose thresholds, ...) never leaves
 * stale IndexedDB data that crashes the UI. Built-in substances are
 * re-synced from the shipped defaults on every load (their afterglow/
 * tolerance day settings are preserved if the user customized them); any
 * other substance still stuck on an older shape gets a best-effort repair.
 */
export async function migrateSubstances() {
  const stored = await db.substances.toArray();
  const storedById = new Map(stored.map((s) => [s.id, s]));
  const updates: Substance[] = [];

  for (const builtinDefault of defaultSubstances) {
    const existing = storedById.get(builtinDefault.id);
    updates.push({
      ...builtinDefault,
      mentalAfterglowDays: existing?.mentalAfterglowDays ?? builtinDefault.mentalAfterglowDays,
      toleranceResetDays: existing?.toleranceResetDays ?? builtinDefault.toleranceResetDays,
    });
  }

  for (const record of stored) {
    if (defaultSubstances.some((d) => d.id === record.id)) continue; // already handled above
    if (!isCurrentPhaseShape(record)) {
      const legacy = record as unknown as { duration?: PhaseRange; aftereffects?: PhaseRange };
      updates.push({ ...record, ...splitLegacyPhases(legacy), builtin: false });
    }
  }

  if (updates.length > 0) {
    await db.substances.bulkPut(updates);
  }
}

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await db.meta.get(key);
  return row?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}
