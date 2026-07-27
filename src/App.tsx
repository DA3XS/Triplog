import { useEffect, useState } from 'react';
import { ensureSeedData, getMeta, setMeta } from './db';
import { useTrips } from './hooks/useData';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { HistoryList } from './components/HistoryList';
import { SettingsView } from './components/SettingsView';
import { NewTripForm, type TripFormMode } from './components/NewTripForm';

type Tab = 'dashboard' | 'calendar' | 'history' | 'settings';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Übersicht', emoji: '🏠' },
  { id: 'calendar', label: 'Kalender', emoji: '📅' },
  { id: 'history', label: 'Verlauf', emoji: '📜' },
  { id: 'settings', label: 'Einstellungen', emoji: '⚙️' },
];

const WELCOME_DISMISSED_KEY = 'welcomeDismissed';

function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tripFormMode, setTripFormMode] = useState<TripFormMode | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);
  const trips = useTrips();

  useEffect(() => {
    (async () => {
      await ensureSeedData();
      const dismissed = await getMeta(WELCOME_DISMISSED_KEY);
      setWelcomeDismissed(dismissed === '1');
      setReady(true);
    })();
  }, []);

  async function dismissWelcome() {
    await setMeta(WELCOME_DISMISSED_KEY, '1');
    setWelcomeDismissed(true);
  }

  if (!ready) return null;

  const showWelcome = !welcomeDismissed && trips.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-2xl">🍄</span>
          <span className="text-lg font-semibold">Triplog</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-6 pb-24 flex flex-col gap-5">
        {showWelcome && (
          <div className="rounded-2xl border border-violet-300/50 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 p-4 flex flex-col gap-2">
            <div className="font-medium">Willkommen bei Triplog 👋</div>
            <p className="text-sm text-black/70 dark:text-white/70">
              Alle Daten bleiben ausschliesslich lokal in diesem Browser. Du kannst deine bisherigen Trips aus der
              Openmind-App importieren oder direkt einen neuen Trip erfassen.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  setTab('settings');
                  dismissWelcome();
                }}
                className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium"
              >
                Openmind-Daten importieren
              </button>
              <button
                onClick={dismissWelcome}
                className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium"
              >
                Später
              </button>
            </div>
          </div>
        )}

        {tab === 'dashboard' && <Dashboard onOpenTripForm={setTripFormMode} />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'history' && <HistoryList />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <nav className="sticky bottom-0 border-t border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex flex-col items-center gap-0.5 py-2.5 text-xs',
                tab === t.id ? 'text-violet-600 dark:text-violet-400' : 'text-black/50 dark:text-white/50',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <NewTripForm mode={tripFormMode} onClose={() => setTripFormMode(null)} />
    </div>
  );
}

export default App;
