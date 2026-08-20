import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Lock, Mail, User, AlertCircle, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RegisterProps {
  navigate: (route: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ navigate }) => {
  const { signUp, resendConfirmationEmail } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Email confirmation awaiting state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; message: string | null; error: string | null }>({
    loading: false,
    message: null,
    error: null
  });

  // Countdown timer for resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0 || resendStatus.loading) return;
    setResendStatus({ loading: true, message: null, error: null });

    const res = await resendConfirmationEmail(registeredEmail);
    if (res.success) {
      setResendStatus({
        loading: false,
        message: 'Confirmation email resent! Please check your inbox and spam folder.',
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

    if (!email.trim() || !password.trim() || !username.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await signUp(email.trim(), password, username.trim());

      // Check for signup failure
      if (!res.success || res.error) {
        const errorMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error && res.error.message) || 'Registration failed.';
        setError(errorMsg);
        return;
      }

      // If email confirmation is required by Supabase
      if (res.needsEmailConfirmation) {
        setRegisteredEmail(email.trim());
        setResendCooldown(60);
        return;
      }

      // If auto-logged in (no confirmation needed)
      navigate('home');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // If waiting for email verification
  if (registeredEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-12">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-sky-500/15 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto text-sky-400 shadow-lg shadow-sky-500/10">
            <Mail className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-zinc-100">Check Your Email</h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              We have sent a verification link to{' '}
              <span className="font-semibold text-sky-400 break-all">{registeredEmail}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-left flex flex-col gap-2">
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>Click the link in the email to activate your account.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-400">
              <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>If you don't see it within a couple minutes, please check your spam or junk folder.</span>
            </div>
          </div>

          {resendStatus.message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
              {resendStatus.message}
            </div>
          )}

          {resendStatus.error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {resendStatus.error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate('login')}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0 || resendStatus.loading}
              onClick={handleResend}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-zinc-700/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendStatus.loading ? 'animate-spin' : ''}`} />
              <span>
                {resendStatus.loading
                  ? 'Resending...'
                  : resendCooldown > 0
                  ? `Resend email in ${resendCooldown}s`
                  : 'Resend confirmation email'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRegisteredEmail(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors pt-2"
            >
              Register with a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-12">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center font-black text-black text-xl shadow-lg shadow-sky-500/20">
            LM
          </div>
          <h1 className="text-2xl font-black text-zinc-100 mt-2">Create an Account</h1>
          <p className="text-xs text-zinc-400">
            Join LetMeCheck to track, organize, and explore movies, TV series, anime, manga, and entertainment universes
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. MangaScholar"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-sky-400 font-bold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
