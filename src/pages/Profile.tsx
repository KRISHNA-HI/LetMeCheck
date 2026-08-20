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
  HardDrive,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  Server,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { isUserAdmin } from '../utils/adminAuth';

interface ProfileProps {
  navigate: (route: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ navigate }) => {
  const { user, profile, signOut, deleteAccount, isConfigured } = useAuth();
  const { stats, refreshLibrary } = useLibrary();

  const [syncing, setSyncing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await refreshLibrary();
    setTimeout(() => setSyncing(false), 800);
  };

  const handleConfirmDelete = async () => {
    if (confirmationInput.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteAccount();
      if (result.success) {
        setIsDeleteModalOpen(false);
        navigate('home');
      } else {
        setDeleteError(result.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred during account deletion.');
      setIsDeleting(false);
    }
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
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('register')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
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
            {profile?.username || 'Member'}
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Activity Statistics Breakdown */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-sky-400" />
            <span>Your Activity & Library Statistics</span>
          </h2>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer"
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
            <span className="text-xs text-sky-400 font-medium">In Progress</span>
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
          LetMeCheck utilizes an offline-first resilient architecture. All your library entries, watch & reading progress, franchise checkpoints, and personal notes are cached locally instantly and synchronized seamlessly with Supabase database when credentials are provided.
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

      {/* Ingestion Admin Console (Admin Only) */}
      {isUserAdmin(user) && (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Catalog Ingestion Console</span>
            </div>
            <button
              onClick={() => navigate('admin/ingestion')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Monitor the automated nightly TMDB catalog ingestion engine, view regional quota metrics, and manage progress cursors.
          </p>
        </div>
      )}

      {/* Danger Zone: Account Deletion */}
      <div className="bg-zinc-900/80 border border-rose-950/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Permanently delete your account and all associated personal data including library items, watch & reading progress, notes, and favorites. This action is irreversible.
            </p>
          </div>

          <button
            onClick={() => {
              setIsDeleteModalOpen(true);
              setConfirmationInput('');
              setDeleteError(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Two-Step Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-rose-900/50 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Permanently Delete Account?</h3>
                  <p className="text-xs text-zinc-400">This action is permanent and cannot be undone.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setIsDeleteModalOpen(false);
                    setConfirmationInput('');
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3.5 flex flex-col gap-2 text-xs text-zinc-300">
              <span className="font-semibold text-rose-400">The following data will be permanently wiped:</span>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                <li>Your profile credentials & authentication record</li>
                <li>All library entries & custom lists</li>
                <li>All chapter/episode reading & watching progress</li>
                <li>All private notes & favorited titles</li>
                <li>All local device caches for this account</li>
              </ul>
              <span className="text-[11px] text-zinc-500 mt-1">
                Shared entertainment catalog metadata (TMDB / AniList) will not be affected.
              </span>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-300 font-medium">
                To confirm, type <span className="font-bold text-rose-400 font-mono">DELETE</span> below:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="DELETE"
                disabled={isDeleting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-rose-500 font-mono tracking-wider disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmationInput('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={confirmationInput.trim() !== 'DELETE' || isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

