import { useState } from 'react';
import type { Substance } from '../types';
import type { DayInfo } from '../lib/calendar';
import {
  computeTripBoundaries,
  DOSE_LEVEL_COLOR,
  DOSE_LEVEL_LABEL,
  DOSE_LEVEL_TEXT_COLOR,
  getDoseLevel,
} from '../lib/timeline';
import { formatAmount, formatDate, formatDateTime } from '../lib/format';
import { TripRating } from './TripRating';
import { TripJournal } from './TripJournal';

interface Props {
  day: Date;
  info: DayInfo;
  substancesById: Map<string, Substance>;
  onClose: () => void;
}

const STATUS_LABEL: Record<DayInfo['status'], string> = {
  none: 'Frei',
  tolerance: 'Toleranz-Erholung',
  afterglow: 'Afterglow',
  trip: 'Trip',
};

export function DayDetailSheet({ day, info, substancesById, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-black/10 dark:border-white/10 p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{formatDate(day)}</h2>
          <button onClick={onClose} className="text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70">
            ✕
          </button>
        </div>

        <div className="text-sm">
          Status: <span className="font-medium">{STATUS_LABEL[info.status]}</span>
        </div>

        {info.trips.length === 0 ? (
          <div className="text-sm text-black/50 dark:text-white/50">Kein Trip an diesem Tag oder in dessen Nachwirkung.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {info.trips.map((trip) => {
              const substance = substancesById.get(trip.substanceId);
              if (!substance) return null;
              const b = computeTripBoundaries(trip, substance);
              const doseLevel = getDoseLevel(substance, trip.amountValue, trip.amountUnit);
              const journalCount = trip.journal?.length ?? 0;
              const expanded = expandedId === trip.id;
              return (
                <div key={trip.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                  <div className="font-medium flex items-center gap-2 flex-wrap">
                    <span>{substance.emoji}</span>
                    <span>{substance.name}</span>
                    <span className="text-black/50 dark:text-white/50 font-normal">
                      {formatAmount(trip.amountValue, trip.amountUnit)}
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
                  </div>
                  <div className="text-xs text-black/50 dark:text-white/50 mt-1 flex flex-col gap-0.5">
                    <span>Start: {formatDateTime(b.start)}</span>
                    <span>Wirkung endet: {formatDateTime(b.tailEnd)}</span>
                    <span>Afterglow bis: {formatDate(b.afterglowEnd)}</span>
                    <span>Toleranz-Reset: {formatDate(b.toleranceResetEnd)}</span>
                  </div>
                  {trip.notes && <div className="text-sm mt-2 whitespace-pre-wrap">{trip.notes}</div>}

                  <TripRating trip={trip} substance={substance} />

                  <button
                    onClick={() => setExpandedId(expanded ? null : trip.id)}
                    className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-3"
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
        )}
      </div>
    </div>
  );
}
