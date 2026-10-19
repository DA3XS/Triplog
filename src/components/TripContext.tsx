import type { Trip } from '../types';

interface Props {
  trip: Trip;
}

/** Shows the optional "Set & Setting" fields (Ort, Begleitung, Stimmung vorher), if any were recorded. */
export function TripContext({ trip }: Props) {
  if (!trip.location && !trip.setting && !trip.moodBefore) return null;

  return (
    <div className="text-xs text-black/50 dark:text-white/50 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      {trip.location && <span>📍 {trip.location}</span>}
      {trip.setting && <span>{trip.setting === 'alone' ? '🧍 Allein' : '👥 Begleitet'}</span>}
      {trip.moodBefore && <span>🙂 Stimmung vorher: {trip.moodBefore}/5</span>}
    </div>
  );
}
