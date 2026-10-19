import { useState } from 'react';
import type { DoseLevel, Substance, Trip } from '../types';
import {
  DOSE_LEVEL_COLOR,
  DOSE_LEVEL_LABEL,
  DOSE_LEVEL_ORDER,
  getDoseLevel,
  tripTotalAmount,
} from '../lib/timeline';
import { formatDayMonth } from '../lib/format';

interface Props {
  trips: Trip[];
  substances: Substance[];
  substancesById: Map<string, Substance>;
}

export function StatsView({ trips, substances, substancesById }: Props) {
  const [open, setOpen] = useState(false);
  const ratedTrips = trips.filter((t) => t.rating);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-violet-600 dark:text-violet-400 font-medium"
      >
        {open ? 'Auswertung ausblenden' : 'Auswertung anzeigen'}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-5">
          {ratedTrips.length === 0 ? (
            <div className="text-sm text-black/50 dark:text-white/50">
              Noch keine bewerteten Trips – die Auswertung füllt sich, sobald du Trips mit Smileys bewertest.
            </div>
          ) : (
            <>
              <RatingOverTime trips={ratedTrips} />
              <AvgRatingBySubstance trips={ratedTrips} substances={substances} />
              <AvgRatingByDoseLevel trips={ratedTrips} substancesById={substancesById} />
            </>
          )}
          <YearHeatmap trips={trips} substancesById={substancesById} />
        </div>
      )}
    </div>
  );
}

function RatingOverTime({ trips }: { trips: Trip[] }) {
  const sorted = [...trips].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const width = 100;
  const height = 60;
  const padX = 4;
  const padY = 8;
  const step = sorted.length > 1 ? (width - padX * 2) / (sorted.length - 1) : 0;
  const x = (i: number) => padX + i * step;
  const y = (rating: number) => height - padY - ((rating - 1) / 4) * (height - padY * 2);

  const points = sorted.map((t, i) => `${x(i)},${y(t.rating ?? 1)}`).join(' ');

  return (
    <div>
      <div className="text-sm font-medium mb-2">Bewertung im Zeitverlauf</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
        {[1, 2, 3, 4, 5].map((r) => (
          <line
            key={r}
            x1={0}
            x2={width}
            y1={y(r)}
            y2={y(r)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={0.5}
          />
        ))}
        {sorted.length > 1 && (
          <polyline points={points} fill="none" stroke="#7c3aed" strokeWidth={1.5} strokeLinejoin="round" />
        )}
        {sorted.map((t, i) => (
          <circle key={t.id} cx={x(i)} cy={y(t.rating ?? 1)} r={1.8} fill="#7c3aed" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-black/40 dark:text-white/40 mt-1">
        <span>{formatDayMonth(new Date(sorted[0].startTime))}</span>
        <span>{formatDayMonth(new Date(sorted[sorted.length - 1].startTime))}</span>
      </div>
    </div>
  );
}

function AvgRatingBySubstance({ trips, substances }: { trips: Trip[]; substances: Substance[] }) {
  const rows = substances
    .map((s) => {
      const rated = trips.filter((t) => t.substanceId === s.id);
      if (rated.length === 0) return null;
      const avg = rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length;
      return { substance: s, avg, count: rated.length };
    })
    .filter((r): r is { substance: Substance; avg: number; count: number } => r !== null);

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="text-sm font-medium mb-2">Ø Bewertung pro Substanz</div>
      <div className="flex flex-col gap-1.5">
        {rows.map(({ substance, avg, count }) => (
          <div key={substance.id} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate">
              {substance.emoji} {substance.name}
            </span>
            <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(avg / 5) * 100}%`, backgroundColor: substance.color }}
              />
            </div>
            <span className="w-16 shrink-0 text-black/50 dark:text-white/50 text-right">
              {avg.toFixed(1)} ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvgRatingByDoseLevel({ trips, substancesById }: { trips: Trip[]; substancesById: Map<string, Substance> }) {
  const buckets = new Map<DoseLevel, number[]>();
  for (const t of trips) {
    const substance = substancesById.get(t.substanceId);
    if (!substance || !t.rating) continue;
    const level = getDoseLevel(substance, tripTotalAmount(t), t.amountUnit);
    buckets.set(level, [...(buckets.get(level) ?? []), t.rating]);
  }

  const rows = DOSE_LEVEL_ORDER.map((level) => {
    const ratings = buckets.get(level) ?? [];
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return { level, avg, count: ratings.length };
  }).filter((r) => r.avg !== null);

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="text-sm font-medium mb-2">Ø Bewertung pro Dosisstufe</div>
      <div className="flex flex-col gap-1.5">
        {rows.map(({ level, avg, count }) => (
          <div key={level} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0">{DOSE_LEVEL_LABEL[level]}</span>
            <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${((avg ?? 0) / 5) * 100}%`, backgroundColor: DOSE_LEVEL_COLOR[level] }}
              />
            </div>
            <span className="w-16 shrink-0 text-black/50 dark:text-white/50 text-right">
              {avg?.toFixed(1)} ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearHeatmap({ trips, substancesById }: { trips: Trip[]; substancesById: Map<string, Substance> }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Align to the previous Monday so weeks form full columns.
  const startWeekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startWeekday);

  const tripsByDay = new Map<string, Substance>();
  for (const trip of trips) {
    const substance = substancesById.get(trip.substanceId);
    if (!substance) continue;
    const d = new Date(trip.startTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!tripsByDay.has(key)) tripsByDay.set(key, substance);
  }

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const weeks = Math.ceil(days.length / 7);

  return (
    <div>
      <div className="text-sm font-medium mb-2">Trip-Häufigkeit (letzte 12 Monate)</div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${weeks * 11} ${7 * 11}`}
          width={weeks * 11}
          height={7 * 11}
          className="max-w-full"
        >
          {days.map((day, i) => {
            const week = Math.floor(i / 7);
            const weekday = (day.getDay() + 6) % 7;
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const substance = tripsByDay.get(key);
            return (
              <rect
                key={i}
                x={week * 11}
                y={weekday * 11}
                width={9}
                height={9}
                rx={2}
                fill={substance ? substance.color : 'currentColor'}
                fillOpacity={substance ? 1 : 0.06}
              >
                <title>
                  {day.toLocaleDateString('de-CH')}
                  {substance ? ` · ${substance.emoji} ${substance.name}` : ''}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
