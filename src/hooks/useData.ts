import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db';
import type { Substance, Trip } from '../types';

export function useTrips(): Trip[] {
  return useLiveQuery(() => db.trips.orderBy('startTime').reverse().toArray(), []) ?? [];
}

export function useSubstances(): Substance[] {
  return useLiveQuery(() => db.substances.toArray(), []) ?? [];
}

/** Substances sorted for display: builtins in their intended order, custom ones after. */
export function useSortedSubstances(): Substance[] {
  const substances = useSubstances();
  return useMemo(() => [...substances].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)), [substances]);
}

export function useSubstancesById(): Map<string, Substance> {
  const substances = useSubstances();
  return useMemo(() => new Map(substances.map((s) => [s.id, s])), [substances]);
}
