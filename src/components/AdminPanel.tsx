import { useState } from 'react';
import { Lock, Unlock, Loader2, AlertCircle, Shield, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SiteSettings } from '../lib/useSiteSettings';

type Props = {
  settings: SiteSettings;
  userId: string;
};

export default function AdminPanel({ settings, userId }: Props) {
  const [isLocked, setIsLocked] = useState(settings.is_locked);
  const [message, setMessage] = useState(settings.locked_message);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggleLock = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    const newValue = !isLocked;
    try {
      const { error: err } = await supabase
        .from('site_settings')
        .update({ is_locked: newValue, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (err) throw err;
      setIsLocked(newValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update site setting.');
    } finally {
      setBusy(false);
    }
  };

  const saveMessage = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const { error: err } = await supabase
        .from('site_settings')
        .update({ locked_message: message, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-rose-400" />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h2>
        </div>
        <p className="mt-1 text-sm text-slate-400">Control site-wide access and settings.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-300/60 hover:text-rose-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Settings saved.
        </div>
      )}

      {/* Lock toggle card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Site Access</h3>
            <p className="mt-1 text-sm text-slate-400">
              {isLocked
                ? 'The gallery is currently locked. Other users see a closed screen. You still have full access.'
                : 'The gallery is open. All logged-in users can view and upload images.'}
            </p>
          </div>
          <button
            onClick={toggleLock}
            disabled={busy}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-6 py-4 transition ${
              isLocked
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10'
            } disabled:opacity-60`}
          >
            {busy ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : isLocked ? (
              <Lock className="h-8 w-8 text-rose-400" />
            ) : (
              <Unlock className="h-8 w-8 text-emerald-400" />
            )}
            <span
              className={`text-sm font-bold uppercase tracking-wide ${
                isLocked ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isLocked ? 'Locked' : 'Open'}
            </span>
          </button>
        </div>
      </div>

      {/* Locked message editor */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Closed Message</h3>
        <p className="mt-1 text-sm text-slate-400">
          This message is shown to non-admin users when the site is locked.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
        />
        <button
          onClick={saveMessage}
          disabled={busy}
          className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Message
        </button>
      </div>
    </div>
  );
}
