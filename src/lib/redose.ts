import { db } from '../db';
import type { Redose, Trip } from '../types';

export async function addRedose(trip: Trip, value: number): Promise<void> {
  if (!(value > 0)) return;
  const redose: Redose = { id: crypto.randomUUID(), time: new Date().toISOString(), value };
  const redoses = [...(trip.redoses ?? []), redose];
  await db.trips.update(trip.id, { redoses });
}

export async function deleteRedose(trip: Trip, redoseId: string): Promise<void> {
  const redoses = (trip.redoses ?? []).filter((r) => r.id !== redoseId);
  await db.trips.update(trip.id, { redoses });
}
