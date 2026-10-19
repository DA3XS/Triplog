import { useState } from 'react';
import type { Substance, Trip } from '../types';
import { addRedose } from '../lib/redose';
import { RedoseList } from './RedoseList';

interface Props {
  trip: Trip;
  substance: Substance;
}

/** Lets the user log an additional dose taken during the still-running trip ("Nachlegen"). */
export function RedoseControl({ trip, substance }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) return;
    setSaving(true);
    try {
      await addRedose(trip, value);
      setAmount('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <RedoseList trip={trip} />

      {open ? (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            placeholder={`z.B. 0.5`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-black/50 dark:text-white/50">{trip.amountUnit}</span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-medium"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-black/50 dark:text-white/50"
          >
            Abbrechen
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium"
        >
          + Nachlegen ({substance.name})
        </button>
      )}
    </div>
  );
}
