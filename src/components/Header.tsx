import { Sparkles, LogOut, Heart, LayoutGrid, UploadCloud, Shield } from 'lucide-react';

type View = 'gallery' | 'upload' | 'admin';

type Props = {
  email: string;
  isAdmin: boolean;
  view: View;
  showFavoritesOnly: boolean;
  onNavigate: (view: View) => void;
  onToggleView: () => void;
  onSignOut: () => void;
};

export default function Header({
  email,
  isAdmin,
  view,
  showFavoritesOnly,
  onNavigate,
  onToggleView,
  onSignOut,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <button onClick={() => onNavigate('gallery')} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 shadow-lg shadow-rose-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Anime Community</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {view === 'gallery' && (
            <>
              <button
                onClick={onToggleView}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  showFavoritesOnly
                    ? 'bg-white/5 text-slate-400 hover:text-slate-200'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </button>
              <button
                onClick={onToggleView}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  showFavoritesOnly
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate(view === 'upload' ? 'gallery' : 'upload')}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
              view === 'upload'
                ? 'bg-rose-500/15 text-rose-300'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span className="hidden sm:inline">{view === 'upload' ? 'Gallery' : 'Upload'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate(view === 'admin' ? 'gallery' : 'admin')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                view === 'admin'
                  ? 'bg-rose-500/15 text-rose-300'
                  : 'border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{view === 'admin' ? 'Gallery' : 'Admin'}</span>
            </button>
          )}

          <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

          <span className="hidden max-w-[160px] truncate text-sm text-slate-400 sm:inline">
            {email}
          </span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
