import { Lock, LogOut } from 'lucide-react';

type Props = {
  message: string;
  onSignOut: () => void;
};

export default function SiteClosed({ message, onSignOut }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>
      <div className="relative">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10">
          <Lock className="h-10 w-10 text-rose-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Gallery Closed</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{message}</p>
        <button
          onClick={onSignOut}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
