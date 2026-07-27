import { useMemo, useState } from 'react';
import { useSubstancesById, useTrips } from '../hooks/useData';
import { getDayInfo, getMonthGrid, isSameDay, type DayInfo } from '../lib/calendar';
import { formatMonthYear, formatWeekday } from '../lib/format';
import { DayDetailSheet } from './DayDetailSheet';

const WEEKDAY_SAMPLE = [
  new Date(2024, 0, 1), // Monday
  new Date(2024, 0, 2),
  new Date(2024, 0, 3),
  new Date(2024, 0, 4),
  new Date(2024, 0, 5),
  new Date(2024, 0, 6),
  new Date(2024, 0, 7),
];

export function CalendarView() {
  const trips = useTrips();
  const substancesById = useSubstancesById();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const today = new Date();

  const dayInfos = useMemo(() => {
    const map = new Map<number, DayInfo>();
    for (const day of grid) {
      map.set(day.getTime(), getDayInfo(day, trips, substancesById));
    }
    return map;
  }, [grid, trips, substancesById]);

  const selectedInfo = selectedDay ? dayInfos.get(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate()).getTime()) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <div className="font-semibold capitalize">{formatMonthYear(cursor)}</div>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-black/40 dark:text-white/40">
        {WEEKDAY_SAMPLE.map((d, i) => (
          <div key={i} className="capitalize">
            {formatWeekday(d)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const info = dayInfos.get(day.getTime())!;
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          const isToday = isSameDay(day, today);
          const substance = info.trips[0] ? substancesById.get(info.trips[0].substanceId) : undefined;
          const color = substance?.color ?? '#94a3b8';

          const bg =
            info.status === 'trip'
              ? color
              : info.status === 'afterglow'
                ? hexWithAlpha(color, 0.18 + 0.42 * info.intensity)
                : info.status === 'tolerance'
                  ? hexWithAlpha(color, 0.06 + 0.18 * info.intensity)
                  : 'transparent';

          return (
            <button
              key={day.getTime()}
              onClick={() => setSelectedDay(day)}
              className={[
                'aspect-square rounded-lg text-sm flex items-center justify-center relative transition-colors',
                isCurrentMonth ? '' : 'opacity-30',
                isToday ? 'ring-2 ring-violet-500' : '',
                info.status === 'trip' ? 'text-white font-semibold' : '',
              ].join(' ')}
              style={{ backgroundColor: bg }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-black/50 dark:text-white/50 mt-1">
        <LegendDot color="#aa3bff" label="Trip" opacity={1} />
        <LegendDot color="#aa3bff" label="Afterglow" opacity={0.45} />
        <LegendDot color="#aa3bff" label="Toleranz-Erholung" opacity={0.16} />
        <LegendDot color="#94a3b8" label="Frei" opacity={0} bordered />
      </div>

      {selectedDay && selectedInfo && (
        <DayDetailSheet day={selectedDay} info={selectedInfo} substancesById={substancesById} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}

function LegendDot({ color, label, opacity, bordered }: { color: string; label: string; opacity: number; bordered?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-3 h-3 rounded-full ${bordered ? 'border border-black/20 dark:border-white/20' : ''}`}
        style={{ backgroundColor: hexWithAlpha(color, opacity) }}
      />
      {label}
    </div>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
