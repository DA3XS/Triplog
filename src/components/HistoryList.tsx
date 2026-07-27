import { useSubstancesById, useTrips } from '../hooks/useData';
import { db } from '../db';
import { formatAmount, formatDateTime } from '../lib/format';
import { getDoseLevel } from '../lib/timeline';

const DOSE_LABEL: Record<string, string> = {
  light: 'leicht',
  common: 'üblich',
  strong: 'stark',
  heavy: 'sehr stark',
};

export function HistoryList() {
  const trips = useTrips();
  const substancesById = useSubstancesById();

  async function handleDelete(id: string) {
    if (!confirm('Diesen Trip-Eintrag wirklich löschen?')) return;
    await db.trips.delete(id);
  }

  if (trips.length === 0) {
    return <div className="text-sm text-black/50 dark:text-white/50">Noch keine Trips erfasst.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {trips.map((trip) => {
        const substance = substancesById.get(trip.substanceId);
        if (!substance) return null;
        const doseLevel = getDoseLevel(substance, trip.amountValue, trip.amountUnit);
        return (
          <div
            key={trip.id}
            className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-medium flex items-center gap-2 flex-wrap">
                <span>{substance.emoji}</span>
                <span>{substance.name}</span>
                <span className="text-black/50 dark:text-white/50 font-normal">
                  {formatAmount(trip.amountValue, trip.amountUnit)}
                </span>
                <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
                  {DOSE_LABEL[doseLevel]}
                </span>
                {trip.source === 'import' && (
                  <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40">
                    importiert
                  </span>
                )}
              </div>
              <div className="text-xs text-black/50 dark:text-white/50 mt-1">{formatDateTime(new Date(trip.startTime))}</div>
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
        );
      })}
    </div>
  );
}
