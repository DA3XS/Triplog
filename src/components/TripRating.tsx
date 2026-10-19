import { useState } from 'react';
import { useNow } from '../hooks/useNow';
import { computeTripBoundaries } from '../lib/timeline';
import { setTripRating, RATING_COLORS, RATING_MOODS, RATING_LABELS } from '../lib/rating';
import { Smiley } from './Smiley';
import type { Substance, Trip } from '../types';

interface Props {
  trip: Trip;
  substance: Substance;
  /** Set to false when a rating smiley is already shown elsewhere right above this (e.g. the history row's badge strip), to avoid repeating it. */
  showSmileyWhenRated?: boolean;
}

/** Rating picker for a trip, only shown once its felt effects (onset..Come-down) have worn off. */
export function TripRating({ trip, substance, showSmileyWhenRated = true }: Props) {
  const now = useNow(60_000);
  const [editing, setEditing] = useState(false);
  const b = computeTripBoundaries(trip, substance);

  if (now.getTime() < b.comedownEnd.getTime()) return null;

  async function handleSelect(value: number) {
    await setTripRating(trip.id, value);
    setEditing(false);
  }

  if (trip.rating && !editing) {
    const i = trip.rating - 1;
    return (
      <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
          {showSmileyWhenRated && <Smiley color={RATING_COLORS[i]} mood={RATING_MOODS[i]} size={28} />}
          <span>Bewertung: {RATING_LABELS[i]}</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-violet-600 dark:text-violet-400 font-medium shrink-0"
        >
          Bewertung anpassen
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
      <div className="text-sm font-medium text-black/70 dark:text-white/70">Wie war dein Trip?</div>
      <div className="flex gap-2">
        {RATING_COLORS.map((color, i) => {
          const value = i + 1;
          const selected = trip.rating === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              title={RATING_LABELS[i]}
              aria-label={RATING_LABELS[i]}
              className={`rounded-full transition-transform ${
                selected ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-neutral-900 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Smiley color={color} mood={RATING_MOODS[i]} />
            </button>
          );
        })}
      </div>
      {trip.rating && (
        <button
          onClick={() => setEditing(false)}
          className="self-start text-xs text-black/50 dark:text-white/50"
        >
          Abbrechen
        </button>
      )}
    </div>
  );
}
