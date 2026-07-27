import { db } from '../db';
import type { Trip, Unit } from '../types';

interface LegacySubstance {
  id: { id: string };
  name: string;
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
  skippedUnsupportedSubstances: string[];
  skipped: number;
}

const KNOWN_UNITS: Unit[] = ['g', 'mg', 'ug'];

function isValidUnit(unit: string): unit is Unit {
  return (KNOWN_UNITS as string[]).includes(unit);
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
  const trips: Trip[] = [];
  const skippedSubstanceNames = new Set<string>();
  let skipped = 0;

  for (const entry of parsed.consumeHistory) {
    const unit = entry.amount?.unit;
    if (!entry.id?.id || !entry.substance?.id?.id || !entry.startTime || !unit || !isValidUnit(unit)) {
      skipped += 1;
      continue;
    }

    const substanceId = entry.substance.id.id;
    if (!existingSubstanceIds.has(substanceId)) {
      // Triplog only supports Mushrooms, Truffles and LSD — skip anything else
      // rather than silently adding a new substance to the picker.
      skippedSubstanceNames.add(entry.substance.name);
      skipped += 1;
      continue;
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

  if (trips.length > 0) {
    await db.trips.bulkPut(trips);
  }

  return {
    importedTrips: trips.length,
    skippedUnsupportedSubstances: [...skippedSubstanceNames],
    skipped,
  };
}
