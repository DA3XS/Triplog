import { useMemo, useState } from 'react';
import { useSortedSubstances, useSubstancesById, useTrips } from '../hooks/useData';
import { db } from '../db';
import { formatAmount, formatDateTime } from '../lib/format';
import {
  convertAmount,
  DOSE_LEVEL_COLOR,
  DOSE_LEVEL_LABEL,
  DOSE_LEVEL_TEXT_COLOR,
  getDoseLevel,
  tripTotalAmount,
} from '../lib/timeline';
import { TripJournal } from './TripJournal';
import { TripRating } from './TripRating';
import { TripContext } from './TripContext';
import { RedoseList } from './RedoseList';
import { StatsView } from './StatsView';
import { Smiley } from './Smiley';
import { RATING_COLORS, RATING_MOODS, RATING_LABELS } from '../lib/rating';
import type { Substance, Trip } from '../types';

function matchesSearch(trip: Trip, substance: Substance, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (substance.name.toLowerCase().includes(q)) return true;
  if (trip.notes?.toLowerCase().includes(q)) return true;
  if (trip.journal?.some((entry) => entry.text.toLowerCase().includes(q))) return true;
  return false;
}

export function HistoryList() {
  const trips = useTrips();
  const substances = useSortedSubstances();
  const substancesById = useSubstancesById();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function handleDelete(id: string) {
    if (!confirm('Diesen Trip-Eintrag wirklich löschen?')) return;
    await db.trips.delete(id);
  }

  if (trips.length === 0) {
    return <div className="text-sm text-black/50 dark:text-white/50">Noch keine Trips erfasst.</div>;
  }

  const filteredTrips = trips.filter((trip) => {
    const substance = substancesById.get(trip.substanceId);
    return substance ? matchesSearch(trip, substance, search) : false;
  });

  return (
    <div className="flex flex-col gap-5">
      <StatsSummary trips={trips} substances={substances} />

      <StatsView trips={trips} substances={substances} substancesById={substancesById} />

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suche in Substanz, Notizen, Tagebuch…"
        className="rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      />

      {filteredTrips.length === 0 && (
        <div className="text-sm text-black/50 dark:text-white/50">Keine Treffer für "{search}".</div>
      )}

      <div className="flex flex-col gap-2">
        {filteredTrips.map((trip) => {
          const substance = substancesById.get(trip.substanceId);
          if (!substance) return null;
          const totalAmount = tripTotalAmount(trip);
          const doseLevel = getDoseLevel(substance, totalAmount, trip.amountUnit);
          const journalCount = trip.journal?.length ?? 0;
          const expanded = expandedId === trip.id;
          return (
            <div key={trip.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium flex items-center gap-2 flex-wrap">
                    <span>{substance.emoji}</span>
                    <span>{substance.name}</span>
                    <span className="text-black/50 dark:text-white/50 font-normal">
                      {formatAmount(totalAmount, trip.amountUnit)}
                      {trip.redoses && trip.redoses.length > 0 && (
                        <span className="text-black/35 dark:text-white/35"> (inkl. Nachlegen)</span>
                      )}
                    </span>
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{ backgroundColor: DOSE_LEVEL_COLOR[doseLevel], color: DOSE_LEVEL_TEXT_COLOR[doseLevel] }}
                    >
                      {DOSE_LEVEL_LABEL[doseLevel]}
                    </span>
                    {trip.source === 'import' && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40">
                        importiert
                      </span>
                    )}
                    {trip.rating && (
                      <span title={RATING_LABELS[trip.rating - 1]}>
                        <Smiley color={RATING_COLORS[trip.rating - 1]} mood={RATING_MOODS[trip.rating - 1]} size={20} />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-black/50 dark:text-white/50 mt-1">
                    {formatDateTime(new Date(trip.startTime))}
                  </div>
                  <TripContext trip={trip} />
                  <RedoseList trip={trip} />
                  {trip.notes && <div className="text-sm mt-2 whitespace-pre-wrap">{trip.notes}</div>}
                </div>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="text-black/30 dark:text-white/30 hover:text-red-600 shrink-0"
                  aria-label="Löschen"
                  title="Löschen"
                >
                  🗑
                </button>
              </div>

              <TripRating trip={trip} substance={substance} />

              <button
                onClick={() => setExpandedId(expanded ? null : trip.id)}
                className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-2"
              >
                {expanded ? 'Tagebuch ausblenden' : journalCount > 0 ? `Tagebuch (${journalCount})` : 'Tagebuch hinzufügen'}
              </button>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <TripJournal trip={trip} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsSummary({ trips, substances }: { trips: Trip[]; substances: Substance[] }) {
  const stats = useMemo(() => {
    const bySubstance = new Map<string, { count: number; total: number }>();
    for (const trip of trips) {
      const substance = substances.find((s) => s.id === trip.substanceId);
      if (!substance) continue;
      const entry = bySubstance.get(substance.id) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += convertAmount(tripTotalAmount(trip), trip.amountUnit, substance.defaultUnit);
      bySubstance.set(substance.id, entry);
    }
    return substances
      .map((substance) => ({ substance, ...(bySubstance.get(substance.id) ?? { count: 0, total: 0 }) }))
      .filter((s) => s.count > 0);
  }, [trips, substances]);

  return (
    <div>
      <div className="text-sm text-black/50 dark:text-white/50 mb-2">
        {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'} insgesamt
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stats.map(({ substance, count, total }) => (
          <div key={substance.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3">
            <div className="flex items-center gap-1.5 font-medium">
              <span>{substance.emoji}</span>
              <span>{substance.name}</span>
            </div>
            <div className="text-sm text-black/60 dark:text-white/60 mt-0.5">
              {count} {count === 1 ? 'Trip' : 'Trips'}
            </div>
            <div className="text-sm text-black/60 dark:text-white/60">
              {formatAmount(Math.round(total * 100) / 100, substance.defaultUnit)} gesamt
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
