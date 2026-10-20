import { useEffect, useMemo, useState } from 'react';
import { useSortedSubstances, useTrips } from '../hooks/useData';
import { db } from '../db';
import type { Trip, Unit } from '../types';
import { computeTripBoundaries, getDoseLevel } from '../lib/timeline';
import { formatAmount, formatDate } from '../lib/format';
import { toLocalInputValue, fromLocalInputValue } from '../lib/localDate';
import { DoseScaleBar } from './DoseScaleBar';

export type TripFormMode = 'new' | 'past';
export type TripFormTarget = { mode: 'new' } | { mode: 'past' } | { mode: 'edit'; trip: Trip };

interface Props {
  target: TripFormTarget | null;
  onClose: () => void;
}

export function NewTripForm({ target, onClose }: Props) {
  const substances = useSortedSubstances();
  const trips = useTrips();
  const [substanceId, setSubstanceId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [location, setLocation] = useState('');
  const [setting, setSetting] = useState<'' | 'alone' | 'accompanied'>('');
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editingTrip = target?.mode === 'edit' ? target.trip : null;

  const effectiveSubstanceId = substanceId || substances[0]?.id || '';
  const substance = useMemo(
    () => substances.find((s) => s.id === effectiveSubstanceId),
    [substances, effectiveSubstanceId],
  );

  useEffect(() => {
    if (substance && !editingTrip) setUnit(substance.defaultUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substance?.id]);

  // Reset/prefill the form whenever it's (re-)opened: blank for a new entry,
  // or filled from the existing trip when editing one.
  useEffect(() => {
    if (!target) return;
    setShowAdvanced(false);
    setError(null);
    if (target.mode === 'edit') {
      const t = target.trip;
      setSubstanceId(t.substanceId);
      setAmount(String(t.amountValue));
      setUnit(t.amountUnit);
      setNotes(t.notes ?? '');
      setShowAdvanced(Boolean(t.location || t.setting || t.moodBefore));
      setLocation(t.location ?? '');
      setSetting(t.setting ?? '');
      setMoodBefore(t.moodBefore ?? null);
      setStartTime(toLocalInputValue(new Date(t.startTime)));
    } else {
      setSubstanceId('');
      setAmount('');
      setNotes('');
      setLocation('');
      setSetting('');
      setMoodBefore(null);
      setStartTime(target.mode === 'new' ? toLocalInputValue(new Date()) : '');
    }
  }, [target]);

  if (!target) return null;

  const amountNum = parseFloat(amount.replace(',', '.'));
  const doseLevel = substance && !Number.isNaN(amountNum) && amountNum > 0 ? getDoseLevel(substance, amountNum, unit) : null;

  // Other trips (excluding the one being edited), for prefill and the tolerance check below.
  const otherTrips = editingTrip ? trips.filter((t) => t.id !== editingTrip.id) : trips;
  const lastTripForSubstance = substance ? otherTrips.find((t) => t.substanceId === substance.id) ?? null : null;

  function applyLastTrip() {
    if (!lastTripForSubstance) return;
    setAmount(String(lastTripForSubstance.amountValue));
    setUnit(lastTripForSubstance.amountUnit);
  }

  let toleranceWarning: string | null = null;
  if (substance && startTime) {
    const startDate = fromLocalInputValue(startTime);
    const prior = otherTrips
      .filter((t) => t.substanceId === substance.id && new Date(t.startTime).getTime() < startDate.getTime())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
    if (prior) {
      const b = computeTripBoundaries(prior, substance);
      if (b.toleranceResetEnd.getTime() > startDate.getTime()) {
        toleranceWarning = `Die Toleranz-Erholung von deiner letzten ${substance.name}-Einnahme (${formatDate(
          new Date(prior.startTime),
        )}) ist erst am ${formatDate(b.toleranceResetEnd)} abgeschlossen.`;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!substance) {
      setError('Bitte eine Substanz wählen.');
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Bitte eine gültige Menge angeben.');
      return;
    }
    if (!startTime) {
      setError('Bitte Datum und Uhrzeit angeben.');
      return;
    }
    setSaving(true);
    try {
      const patch = {
        substanceId: substance.id,
        startTime: fromLocalInputValue(startTime).toISOString(),
        amountValue: amountNum,
        amountUnit: unit,
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        setting: setting || undefined,
        moodBefore: moodBefore ?? undefined,
      };
      if (editingTrip) {
        await db.trips.update(editingTrip.id, patch);
      } else {
        const trip: Trip = {
          id: crypto.randomUUID(),
          ...patch,
          source: 'manual',
          createdAt: new Date().toISOString(),
        };
        await db.trips.add(trip);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-black/10 dark:border-white/10 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {target.mode === 'edit' ? 'Trip bearbeiten' : target.mode === 'past' ? 'Trip nachtragen' : 'Neuer Trip'}
          </h2>
          <button type="button" onClick={onClose} className="text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Substanz</span>
          <select
            value={effectiveSubstanceId}
            onChange={(e) => setSubstanceId(e.target.value)}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-neutral-900 text-black dark:text-white px-3 py-2"
          >
            {substances.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </label>

        {lastTripForSubstance && target.mode !== 'edit' && (
          <button
            type="button"
            onClick={applyLastTrip}
            className="self-start text-xs text-violet-600 dark:text-violet-400 font-medium -mt-2"
          >
            Wie letztes Mal ({formatAmount(lastTripForSubstance.amountValue, lastTripForSubstance.amountUnit)})
          </button>
        )}

        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1">
            <span className="text-black/60 dark:text-white/60">Menge</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="z.B. 2.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm w-24">
            <span className="text-black/60 dark:text-white/60">Einheit</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-neutral-900 text-black dark:text-white px-3 py-2"
            >
              <option value="g">g</option>
              <option value="mg">mg</option>
              <option value="ug">µg</option>
            </select>
          </label>
        </div>

        {doseLevel && (
          <div className="-mt-2">
            <DoseScaleBar level={doseLevel} />
          </div>
        )}

        {doseLevel === 'heroic' && (
          <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300/50 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 px-3 py-2">
            ⚠️ Heroic Dose – sehr hohe Menge. Sicheres Setting und ein nüchterner Trip-Sitter werden dringend empfohlen.
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">
            {target.mode === 'past' || target.mode === 'edit' ? 'Zeitpunkt (wann hat der Trip begonnen?)' : 'Zeitpunkt'}
          </span>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>

        {toleranceWarning && (
          <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300/50 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 px-3 py-2">
            ⚠️ {toleranceWarning}
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Notizen (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 resize-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="self-start text-xs text-violet-600 dark:text-violet-400 font-medium -mt-1"
        >
          {showAdvanced ? 'Set & Setting ausblenden' : 'Set & Setting hinzufügen (Ort, Begleitung, Stimmung)'}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-black/60 dark:text-white/60">Ort (optional)</span>
              <input
                type="text"
                placeholder="z.B. Zuhause, Natur, Festival"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
              />
            </label>

            <div className="flex flex-col gap-1 text-sm">
              <span className="text-black/60 dark:text-white/60">Begleitung</span>
              <div className="flex gap-2">
                {(['alone', 'accompanied'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSetting(setting === opt ? '' : opt)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
                      setting === opt
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-black/15 dark:border-white/15 text-black/70 dark:text-white/70'
                    }`}
                  >
                    {opt === 'alone' ? 'Allein' : 'Begleitet'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <span className="text-black/60 dark:text-white/60">Stimmung vorher</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMoodBefore(moodBefore === v ? null : v)}
                    className={`w-9 h-9 rounded-full text-sm font-medium border ${
                      moodBefore === v
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-black/15 dark:border-white/15 text-black/70 dark:text-white/70'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-black/15 dark:border-white/15 py-2 text-sm font-medium"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving || substances.length === 0}
            className="flex-1 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2 text-sm font-medium"
          >
            {target.mode === 'past' ? 'Nachtragen' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
