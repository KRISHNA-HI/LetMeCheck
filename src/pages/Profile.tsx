import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  Settings,
  Mail,
  Shield,
  Bookmark,
  Heart,
  BookOpen,
  CheckCircle,
  Database,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';

interface ProfileProps {
  navigate: (route: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ navigate }) => {
  const { user, profile, signOut, isConfigured } = useAuth();
  const { stats, refreshLibrary } = useLibrary();

  const [syncing, setSyncing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await refreshLibrary();
    setTimeout(() => setSyncing(false), 800);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <UserIcon className="w-6 h-6 text-sky-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Guest Session</h2>
        <p className="text-xs text-zinc-400">
          You are using local temporary storage. Sign in to unlock cloud synchronization across all devices.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('login')}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('register')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Profile Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-zinc-950 text-2xl font-black shadow-lg shadow-sky-500/20 shrink-0">
          {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'LM'}
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100">
            {profile?.username || 'Manga Reader'}
          </h1>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            <span>{user.email}</span>
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Account Active
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> {isConfigured ? 'Supabase Cloud Sync' : 'Local Storage Engine'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Reading Statistics Breakdown */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-sky-400" />
            <span>Your Reading Milestone Statistics</span>
          </h2>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Total Titles</span>
            <span className="text-2xl font-black text-zinc-100 mt-1">{stats.total}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col">
            <span className="text-xs text-sky-400 font-medium">Currently Reading</span>
            <span className="text-2xl font-black text-sky-300 mt-1">{stats.reading}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col">
            <span className="text-xs text-emerald-400 font-medium">Completed Titles</span>
            <span className="text-2xl font-black text-emerald-300 mt-1">{stats.completed}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col">
            <span className="text-xs text-pink-400 font-medium">Favorited</span>
            <span className="text-2xl font-black text-pink-300 mt-1">{stats.favorites}</span>
          </div>
        </div>
      </div>

      {/* Cloud & Storage Config Info */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <span>Storage & Cloud Configuration</span>
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed">
          LetMeCheck utilizes an offline-first resilient architecture. All your reading progress, adaptation material checkpoints, and notes are cached locally instantly and synchronized seamlessly with Supabase database when credentials are provided.
        </p>

        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Connection Protocol:</span>
          </div>
          <span className="font-mono text-emerald-400 font-semibold">
            {isConfigured ? 'Supabase Live Connected' : 'Local Cache Storage Ready'}
          </span>
        </div>
      </div>
    </div>
  );
};
