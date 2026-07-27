import { Component, type ErrorInfo, type ReactNode } from 'react';
import { exportAndDownload } from '../lib/backup';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Triplog crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  async function handleExport() {
    try {
      await exportAndDownload();
    } catch (e) {
      alert('Export leider auch fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-red-300/50 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5 flex flex-col gap-3">
        <div className="text-lg font-semibold">Etwas ist schiefgelaufen</div>
        <p className="text-sm text-black/70 dark:text-white/70">
          Triplog konnte diese Ansicht nicht laden. Deine Daten sind trotzdem noch sicher in diesem Browser
          gespeichert (IndexedDB) – nichts wurde gelöscht.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium"
          >
            Seite neu laden
          </button>
          <button
            onClick={handleExport}
            className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium"
          >
            Backup jetzt exportieren
          </button>
          <button onClick={onReset} className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium">
            Erneut versuchen
          </button>
        </div>
        <details className="text-xs text-black/50 dark:text-white/50">
          <summary className="cursor-pointer">Technische Details</summary>
          <pre className="whitespace-pre-wrap mt-1">{error.message}</pre>
        </details>
      </div>
    </div>
  );
}
