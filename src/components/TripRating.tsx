import { useNow } from '../hooks/useNow';
import { computeTripBoundaries } from '../lib/timeline';
import { setTripRating, RATING_COLORS, RATING_MOODS, RATING_LABELS } from '../lib/rating';
import { Smiley } from './Smiley';
import type { Substance, Trip } from '../types';

interface Props {
  trip: Trip;
  substance: Substance;
}

/** Rating picker for a trip, only shown once its felt effects (onset..Come-down) have worn off. */
export function TripRating({ trip, substance }: Props) {
  const now = useNow(60_000);
  const b = computeTripBoundaries(trip, substance);

  if (now.getTime() < b.comedownEnd.getTime()) return null;

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
              onClick={() => setTripRating(trip.id, value)}
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
    </div>
  );
}
