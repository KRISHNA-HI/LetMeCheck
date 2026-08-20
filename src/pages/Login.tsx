import React, { useState, useEffect, useRef } from 'react';
import { LogIn, Lock, Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  navigate: (route: string) => void;
}

export const Login: React.FC<LoginProps> = ({ navigate }) => {
  const { signIn, resendConfirmationEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Email confirmation state & resend support
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; message: string | null; error: string | null }>({
    loading: false,
    message: null,
    error: null
  });

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendConfirmation = async () => {
    if (!email.trim() || resendCooldown > 0 || resendStatus.loading) return;
    setResendStatus({ loading: true, message: null, error: null });

    const res = await resendConfirmationEmail(email.trim());
    if (res.success) {
      setResendStatus({
        loading: false,
        message: 'Confirmation email sent! Please check your inbox and spam folder.',
        error: null
      });
      setResendCooldown(60);
    } else {
      setResendStatus({
        loading: false,
        message: null,
        error: res.error || 'Failed to resend confirmation email.'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setIsUnconfirmed(false);
    setResendStatus({ loading: false, message: null, error: null });

    try {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        const errorMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error && res.error.message) || 'Login failed. Please check your credentials.';

        setError(errorMsg);

        // Check if the failure was specifically due to an unconfirmed email
        if (errorMsg.toLowerCase().includes('email not confirmed')) {
          setIsUnconfirmed(true);
        }
      } else {
        navigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-12">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center font-black text-black text-xl shadow-lg shadow-sky-500/20">
            LM
          </div>
          <h1 className="text-2xl font-black text-zinc-100 mt-2">Welcome Back</h1>
          <p className="text-xs text-zinc-400">
            Sign in to sync your LetMeCheck library, watch and reading progress, and personal preferences across devices
          </p>
        </div>

        {/* Unconfirmed Email Notice & Action */}
        {isUnconfirmed && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
            <div className="flex items-start gap-2.5 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold">Email confirmation required.</span>
                <p className="text-zinc-300 mt-1 text-xs">
                  Your account was created, but your email has not been confirmed yet. Click the link sent to your email to activate it.
                </p>
              </div>
            </div>

            {resendStatus.message && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>{resendStatus.message}</span>
              </div>
            )}

            {resendStatus.error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {resendStatus.error}
              </div>
            )}

            <button
              type="button"
              disabled={resendCooldown > 0 || resendStatus.loading}
              onClick={handleResendConfirmation}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendStatus.loading ? 'animate-spin' : ''}`} />
              <span>
                {resendStatus.loading
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend confirmation email'}
              </span>
            </button>
          </div>
        )}

        {/* General Error Notice */}
        {error && !isUnconfirmed && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsUnconfirmed(false);
                }}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsUnconfirmed(false);
                }}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => navigate('register')}
            className="text-sky-400 font-bold hover:underline cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};
