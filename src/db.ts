import Dexie, { type Table } from 'dexie';
import type { AppMeta, Substance, Trip } from './types';
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

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await db.meta.get(key);
  return row?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}
