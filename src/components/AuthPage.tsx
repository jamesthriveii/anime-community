import { useState, type FormEvent } from 'react';
import { Sparkles, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

type Props = {
  onSignIn: (email: string, password: string) => Promise<unknown>;
  onSignUp: (email: string, password: string) => Promise<unknown>;
  onResetPassword: (email: string) => Promise<unknown>;
  onUpdatePassword: (newPassword: string) => Promise<unknown>;
  passwordRecovery?: boolean;
};

type Mode = 'login' | 'signup';

export default function AuthPage({
  onSignIn,
  onSignUp,
  onResetPassword,
  onUpdatePassword,
  passwordRecovery = false,
}: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyError(msg));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onResetPassword(email);
      setForgotSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyError(msg));
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onUpdatePassword(newPassword);
      setResetDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyError(msg));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword('');
  };

  const openForgot = () => {
    setForgotOpen(true);
    setForgotSent(false);
    setError(null);
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotSent(false);
    setError(null);
  };

  // Password recovery view — reached after clicking the email link.
  if (passwordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-rose-300 backdrop-blur">
              <KeyRound className="h-4 w-4" />
              Anime Community
            </div>
            <h1 className="mt-4 bg-gradient-to-r from-rose-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              {resetDone ? 'Password updated' : 'Set a new password'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {resetDone
                ? 'You can now sign in with your new password.'
                : 'Choose a new password for your account.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            {resetDone ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <p className="text-sm text-slate-300">
                  Your password has been changed successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={submitNewPassword} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">New password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">At least 6 characters</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Forgot-password view — request a reset email.
  if (forgotOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-rose-300 backdrop-blur">
              <Mail className="h-4 w-4" />
              Anime Community
            </div>
            <h1 className="mt-4 bg-gradient-to-r from-rose-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {forgotSent
                ? 'Check your inbox for a reset link.'
                : 'Enter your email and we will send you a reset link.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            {forgotSent ? (
              <div className="flex flex-col items-center gap-5 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <p className="text-sm text-slate-300">
                  We sent a password reset link to <span className="font-medium text-white">{email}</span>.
                  The link expires in a short time, so check your email soon.
                </p>
                <button
                  type="button"
                  onClick={closeForgot}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </button>

                <button
                  type="button"
                  onClick={closeForgot}
                  className="flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* animated background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-rose-300 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Anime Community
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-rose-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login'
              ? 'Sign in to explore the collection'
              : 'Join the community and start sharing anime artwork'}
          </p>
        </div>

        {/* card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* mode tabs */}
          <div className="mb-6 flex rounded-xl bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={openForgot}
                    className="text-xs font-medium text-rose-300 transition hover:text-rose-200"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs text-slate-500">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-400 hover:to-fuchsia-400 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          By continuing you agree to browse responsibly.
        </p>
      </div>
    </div>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try logging in.';
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  return msg;
}
