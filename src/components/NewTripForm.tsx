import { useEffect, useMemo, useState } from 'react';
import { useSortedSubstances } from '../hooks/useData';
import { db } from '../db';
import type { Trip, Unit } from '../types';
import { getDoseLevel } from '../lib/timeline';
import { toLocalInputValue, fromLocalInputValue } from '../lib/localDate';
import { DoseScaleBar } from './DoseScaleBar';

export type TripFormMode = 'new' | 'past';

interface Props {
  mode: TripFormMode | null;
  onClose: () => void;
}

export function NewTripForm({ mode, onClose }: Props) {
  const substances = useSortedSubstances();
  const [substanceId, setSubstanceId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveSubstanceId = substanceId || substances[0]?.id || '';
  const substance = useMemo(
    () => substances.find((s) => s.id === effectiveSubstanceId),
    [substances, effectiveSubstanceId],
  );

  useEffect(() => {
    if (substance) setUnit(substance.defaultUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substance?.id]);

  // Reset the form whenever it's (re-)opened, and prefill the time
  // differently depending on whether this is a live entry or a backdated one.
  useEffect(() => {
    if (!mode) return;
    setSubstanceId('');
    setAmount('');
    setNotes('');
    setError(null);
    setStartTime(mode === 'new' ? toLocalInputValue(new Date()) : '');
  }, [mode]);

  if (!mode) return null;

  const amountNum = parseFloat(amount.replace(',', '.'));
  const doseLevel = substance && !Number.isNaN(amountNum) && amountNum > 0 ? getDoseLevel(substance, amountNum, unit) : null;

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
      const trip: Trip = {
        id: crypto.randomUUID(),
        substanceId: substance.id,
        startTime: fromLocalInputValue(startTime).toISOString(),
        amountValue: amountNum,
        amountUnit: unit,
        notes: notes.trim() || undefined,
        source: 'manual',
        createdAt: new Date().toISOString(),
      };
      await db.trips.add(trip);
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
          <h2 className="text-lg font-semibold">{mode === 'past' ? 'Trip nachtragen' : 'Neuer Trip'}</h2>
          <button type="button" onClick={onClose} className="text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Substanz</span>
          <select
            value={effectiveSubstanceId}
            onChange={(e) => setSubstanceId(e.target.value)}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          >
            {substances.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </label>

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
              className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">
            {mode === 'past' ? 'Zeitpunkt (wann hat der Trip begonnen?)' : 'Zeitpunkt'}
          </span>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/60 dark:text-white/60">Notizen (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 resize-none"
          />
        </label>

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
            {mode === 'past' ? 'Nachtragen' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
