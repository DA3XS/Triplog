import { useMemo } from 'react';
import { useSubstancesById, useTrips } from '../hooks/useData';
import { useNow } from '../hooks/useNow';
import { getOverallStatus, getTripPhaseAt } from '../lib/timeline';
import { formatAmount, formatDate, formatDaysCount, formatRelativeDays } from '../lib/format';
import { TripCurve } from './TripCurve';
import { EffectTimer } from './EffectTimer';
import { AfterglowBar } from './AfterglowBar';
import type { TripFormMode } from './NewTripForm';
import type { TripPhase } from '../types';

const PHASE_LABEL: Record<TripPhase, string> = {
  upcoming: 'Geplant',
  onset: 'Onset',
  comeup: 'Come-up',
  peak: 'Wirkdauer',
  comedown: 'Come-down',
  tail: 'Ausklang',
  afterglow: 'Afterglow',
  tolerance: 'Erholungsphase',
  ready: 'Bereit',
};

const PHASE_EMOJI: Record<TripPhase, string> = {
  upcoming: '🕓',
  onset: '🌀',
  comeup: '📈',
  peak: '🍄',
  comedown: '📉',
  tail: '🌙',
  afterglow: '🌅',
  tolerance: '⏳',
  ready: '✅',
};

const PHARMACOLOGICAL_PHASES: TripPhase[] = ['onset', 'comeup', 'peak', 'comedown', 'tail'];

interface Props {
  onOpenTripForm: (mode: TripFormMode) => void;
}

export function Dashboard({ onOpenTripForm }: Props) {
  const trips = useTrips();
  const substancesById = useSubstancesById();
  const now = useNow();

  const status = useMemo(() => getOverallStatus(trips, substancesById, now), [trips, substancesById, now]);

  const activeSubstance = status.activeTrip ? substancesById.get(status.activeTrip.substanceId) : undefined;
  const lastSubstance = status.lastTrip ? substancesById.get(status.lastTrip.substanceId) : undefined;
  const activePhaseInfo =
    status.activeTrip && activeSubstance ? getTripPhaseAt(status.activeTrip, activeSubstance, now) : null;

  const inPharmacologicalEffect = activePhaseInfo && PHARMACOLOGICAL_PHASES.includes(activePhaseInfo.phase);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5 sm:p-6 bg-white/60 dark:bg-white/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-black/50 dark:text-white/50">Aktueller Status</div>
            <div className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
              <span>{PHASE_EMOJI[status.phase]}</span>
              <span>{PHASE_LABEL[status.phase]}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenTripForm('past')}
              className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium transition-colors"
            >
              Trip nachtragen
            </button>
            <button
              onClick={() => onOpenTripForm('new')}
              className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              + Neuer Trip
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-black/70 dark:text-white/70">
          {status.activeTrip && activeSubstance ? (
            <StatusDetail
              phase={status.phase}
              substanceName={activeSubstance.name}
              substanceEmoji={activeSubstance.emoji}
              amountValue={status.activeTrip.amountValue}
              amountUnit={status.activeTrip.amountUnit}
              now={now}
              nextPossibleTripDate={status.nextPossibleTripDate}
            />
          ) : status.lastTrip && lastSubstance ? (
            <div>
              Letzter Trip: {formatDate(new Date(status.lastTrip.startTime))} · {lastSubstance.emoji}{' '}
              {lastSubstance.name} ({formatAmount(status.lastTrip.amountValue, status.lastTrip.amountUnit)}) –{' '}
              {status.daysSinceLastTrip !== null ? formatDaysCount(status.daysSinceLastTrip) + ' her' : ''}
            </div>
          ) : (
            <div>Noch kein Trip erfasst. Leg los mit deinem ersten Eintrag.</div>
          )}
        </div>

        {status.activeTrip && activeSubstance && inPharmacologicalEffect && (
          <div className="mt-5 flex flex-col gap-4">
            <EffectTimer trip={status.activeTrip} substance={activeSubstance} />
            <TripCurve trip={status.activeTrip} substance={activeSubstance} now={now} />
          </div>
        )}

        {status.activeTrip && activeSubstance && (
          <div className="mt-5">
            <AfterglowBar trip={status.activeTrip} substance={activeSubstance} now={now} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDetail({
  phase,
  substanceName,
  substanceEmoji,
  amountValue,
  amountUnit,
  now,
  nextPossibleTripDate,
}: {
  phase: TripPhase;
  substanceName: string;
  substanceEmoji: string;
  amountValue: number;
  amountUnit: Parameters<typeof formatAmount>[1];
  now: Date;
  nextPossibleTripDate: Date | null;
}) {
  const amountText = formatAmount(amountValue, amountUnit);
  if (PHARMACOLOGICAL_PHASES.includes(phase)) {
    return (
      <div>
        {substanceEmoji} {substanceName} · {amountText} — aktuelle Phase: {PHASE_LABEL[phase]}
      </div>
    );
  }
  if (phase === 'afterglow' || phase === 'tolerance') {
    return (
      <div>
        {substanceEmoji} {substanceName} · {amountText}. Mentale Nachwirkung
        {phase === 'tolerance' ? ' abgeklungen, Psilocybin-Toleranz baut noch ab.' : ' klingt noch ab.'}
        {nextPossibleTripDate && (
          <>
            {' '}
            Frühestens sinnvoll wieder ab <strong>{formatDate(nextPossibleTripDate)}</strong> (
            {formatRelativeDays(now, nextPossibleTripDate)}).
          </>
        )}
      </div>
    );
  }
  return null;
}
