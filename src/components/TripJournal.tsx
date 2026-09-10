import { useState } from 'react';
import type { Trip } from '../types';
import { addJournalEntry, deleteJournalEntry } from '../lib/journal';
import { formatDateTime } from '../lib/format';

interface Props {
  trip: Trip;
}

export function TripJournal({ trip }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const entries = [...(trip.journal ?? [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addJournalEntry(trip, text);
      setText('');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Diesen Tagebucheintrag löschen?')) return;
    await deleteJournalEntry(trip, entryId);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-black/70 dark:text-white/70">Trip-Tagebuch</div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg bg-black/5 dark:bg-white/10 p-2.5 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-black/45 dark:text-white/45">{formatDateTime(new Date(entry.timestamp))}</div>
                <div className="text-sm mt-0.5 whitespace-pre-wrap">{entry.text}</div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-black/30 dark:text-white/30 hover:text-red-600 shrink-0"
                aria-label="Eintrag löschen"
                title="Eintrag löschen"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was passiert gerade? Wie fühlst du dich?"
          rows={2}
          className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !text.trim()}
          className="self-start rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-1.5 text-sm font-medium"
        >
          Eintrag hinzufügen
        </button>
      </div>
    </div>
  );
}
