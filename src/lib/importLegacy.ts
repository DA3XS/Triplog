import { db } from '../db';
import type { Substance, Trip, Unit } from '../types';

interface LegacyDuration {
  unit: string;
  valueFrom: number;
  valueTill: number;
  duration: 'onset' | 'duration' | 'aftereffects';
}

interface LegacySubstance {
  id: { id: string };
  name: string;
  durations?: LegacyDuration[] | null;
}

interface LegacyConsumeEntry {
  id: { id: string };
  substance: LegacySubstance;
  startTime: string;
  endTime?: string;
  amount: { value: number; unit: string; dosage?: string };
  notes?: string | null;
}

interface LegacyExport {
  consumeHistory: LegacyConsumeEntry[];
}

export interface ImportResult {
  importedTrips: number;
  newSubstances: string[];
  skipped: number;
}

const KNOWN_UNITS: Unit[] = ['g', 'mg', 'ug'];

function isValidUnit(unit: string): unit is Unit {
  return (KNOWN_UNITS as string[]).includes(unit);
}

function phaseFromLegacy(
  durations: LegacyDuration[] | null | undefined,
  kind: LegacyDuration['duration'],
  fallback: { fromMin: number; tillMin: number },
) {
  const match = durations?.find((d) => d.duration === kind);
  if (!match) return fallback;
  return { fromMin: match.valueFrom, tillMin: match.valueTill };
}

function buildFallbackSubstance(legacy: LegacySubstance, unit: Unit): Substance {
  const thresholdsByUnit: Record<Unit, Substance['doseThresholds']> = {
    g: { light: 0.5, common: 1, strong: 2.5, heavy: 4 },
    mg: { light: 500, common: 1000, strong: 2500, heavy: 4000 },
    ug: { light: 25, common: 50, strong: 125, heavy: 250 },
  };
  return {
    id: legacy.id.id,
    name: legacy.name,
    emoji: '❓',
    color: '#94a3b8',
    order: 100,
    defaultUnit: unit,
    onset: phaseFromLegacy(legacy.durations, 'onset', { fromMin: 30, tillMin: 90 }),
    duration: phaseFromLegacy(legacy.durations, 'duration', { fromMin: 180, tillMin: 360 }),
    aftereffects: phaseFromLegacy(legacy.durations, 'aftereffects', { fromMin: 60, tillMin: 720 }),
    doseThresholds: thresholdsByUnit[unit],
    mentalAfterglowDays: 3,
    toleranceResetDays: 14,
    builtin: false,
  };
}

/** Imports a legacy Openmind JSON export, merging into the local database. */
export async function importOpenmindExport(jsonText: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.');
  }
  return importOpenmindData(parsed);
}

/** Same as {@link importOpenmindExport} but takes an already-parsed object. */
export async function importOpenmindData(parsedInput: unknown): Promise<ImportResult> {
  const parsed = parsedInput as LegacyExport;
  if (!parsed || !Array.isArray(parsed.consumeHistory)) {
    throw new Error('Kein "consumeHistory"-Array gefunden – ist das ein Openmind-Export?');
  }

  const existingSubstanceIds = new Set((await db.substances.toArray()).map((s) => s.id));
  const newSubstances: Substance[] = [];
  const trips: Trip[] = [];
  let skipped = 0;

  for (const entry of parsed.consumeHistory) {
    const unit = entry.amount?.unit;
    if (!entry.id?.id || !entry.substance?.id?.id || !entry.startTime || !unit || !isValidUnit(unit)) {
      skipped += 1;
      continue;
    }

    const substanceId = entry.substance.id.id;
    if (!existingSubstanceIds.has(substanceId) && !newSubstances.some((s) => s.id === substanceId)) {
      newSubstances.push(buildFallbackSubstance(entry.substance, unit));
    }

    trips.push({
      id: entry.id.id,
      substanceId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      amountValue: entry.amount.value,
      amountUnit: unit,
      notes: entry.notes ?? undefined,
      source: 'import',
      createdAt: new Date().toISOString(),
    });
  }

  if (newSubstances.length > 0) {
    await db.substances.bulkAdd(newSubstances);
  }
  if (trips.length > 0) {
    await db.trips.bulkPut(trips);
  }

  return {
    importedTrips: trips.length,
    newSubstances: newSubstances.map((s) => s.name),
    skipped,
  };
}
