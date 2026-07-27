import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from '../lib/timeline';
import { formatDate } from '../lib/format';

interface Props {
  trip: Trip;
  substance: Substance;
  now: Date;
}

export function AfterglowBar({ trip, substance, now }: Props) {
  const b = computeTripBoundaries(trip, substance);
  const start = b.start.getTime();
  const total = Math.max(1, b.toleranceResetEnd.getTime() - start);

  const pct = (t: number) => (Math.min(Math.max(t, start), b.toleranceResetEnd.getTime()) - start) / total * 100;

  const wTrip = pct(b.tailEnd.getTime());
  const wAfterglow = pct(b.afterglowEnd.getTime()) - wTrip;
  const wTolerance = 100 - wTrip - wAfterglow;
  const nowPct = pct(now.getTime());
  const showNow = now.getTime() >= start && now.getTime() <= b.toleranceResetEnd.getTime();

  return (
    <div>
      <div className="relative h-3 w-full rounded-full overflow-hidden flex bg-black/5 dark:bg-white/10">
        <div style={{ width: `${wTrip}%`, backgroundColor: substance.color }} />
        <div
          style={{
            width: `${wAfterglow}%`,
            background: `linear-gradient(to right, ${substance.color}, ${substance.color}33)`,
          }}
        />
        <div
          style={{
            width: `${wTolerance}%`,
            background: `linear-gradient(to right, ${substance.color}33, transparent)`,
          }}
        />
        {showNow && (
          <div
            className="absolute top-0 h-full w-0.5 bg-black/70 dark:bg-white/80"
            style={{ left: `${nowPct}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-black/50 dark:text-white/50">
        <span>{formatDate(b.start)} · Trip</span>
        <span>Afterglow bis {formatDate(b.afterglowEnd)}</span>
        <span>Bereit ab {formatDate(b.toleranceResetEnd)}</span>
      </div>
    </div>
  );
}
