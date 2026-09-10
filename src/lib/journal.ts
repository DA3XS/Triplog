import { db } from '../db';
import type { Trip } from '../types';

export async function addJournalEntry(trip: Trip, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const entry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), text: trimmed };
  const journal = [...(trip.journal ?? []), entry];
  await db.trips.update(trip.id, { journal });
}

export async function deleteJournalEntry(trip: Trip, entryId: string): Promise<void> {
  const journal = (trip.journal ?? []).filter((e) => e.id !== entryId);
  await db.trips.update(trip.id, { journal });
}
