import type { Trip } from '../types';
import { deleteRedose } from '../lib/redose';
import { formatAmount, formatTime } from '../lib/format';

interface Props {
  trip: Trip;
}

/** Lists the additional doses taken during this trip ("Nachlegen"), if any. */
export function RedoseList({ trip }: Props) {
  const redoses = trip.redoses ?? [];
  if (redoses.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      {redoses.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 text-xs text-black/60 dark:text-white/60">
          <span>
            + Nachgelegt: {formatAmount(r.value, trip.amountUnit)} um {formatTime(new Date(r.time))}
          </span>
          <button
            onClick={() => deleteRedose(trip, r.id)}
            className="text-black/30 dark:text-white/30 hover:text-red-600"
            aria-label="Nachlege-Eintrag löschen"
            title="Löschen"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
