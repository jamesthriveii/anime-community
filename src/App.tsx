import { useState } from 'react';
import { useAuth } from './lib/useAuth';
import { useAdmin } from './lib/useAdmin';
import { useSiteSettings } from './lib/useSiteSettings';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import Gallery from './components/Gallery';
import UploadPanel from './components/UploadPanel';
import AdminPanel from './components/AdminPanel';
import SiteClosed from './components/SiteClosed';

type View = 'gallery' | 'upload' | 'admin';

export default function App() {
  const { session, loading: authLoading, passwordRecovery, signUp, signIn, resetPassword, updatePassword, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(session?.user.id);
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView] = useState<View>('gallery');

  const loading = authLoading || (session && adminLoading) || (session && settingsLoading);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400/30 border-t-rose-400" />
      </div>
    );
  }

  if (!session || passwordRecovery) {
    return (
      <AuthPage
        onSignIn={signIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        onUpdatePassword={updatePassword}
        passwordRecovery={passwordRecovery}
      />
    );
  }

  // Site is locked: non-admin users see the closed screen.
  // Admins bypass the lock and have full access.
  if (settings?.is_locked && !isAdmin) {
    return <SiteClosed message={settings.locked_message} onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header
        email={session.user.email ?? ''}
        isAdmin={isAdmin}
        view={view}
        showFavoritesOnly={showFavoritesOnly}
        onNavigate={setView}
        onToggleView={() => setShowFavoritesOnly((v) => !v)}
        onSignOut={signOut}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {view === 'admin' && isAdmin && settings ? (
          <AdminPanel settings={settings} userId={session.user.id} />
        ) : view === 'upload' ? (
          <UploadPanel userId={session.user.id} />
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {showFavoritesOnly ? 'Your Favorites' : 'Discover Anime Art'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {showFavoritesOnly
                  ? 'The pieces you have saved for later.'
                  : 'Browse anime artwork shared by the community. Upload your own and join the collection.'}
              </p>
            </div>
            <Gallery userId={session.user.id} showFavoritesOnly={showFavoritesOnly} isAdmin={isAdmin} />
          </>
        )}
      </main>
    </div>
  );
}
