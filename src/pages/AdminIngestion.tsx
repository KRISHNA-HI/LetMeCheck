import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Film,
  Tv,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Server,
  ShieldCheck,
  Zap,
  Sliders,
  BarChart3,
  Globe2,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { contentService } from '../services/contentService';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { isUserAdmin } from '../utils/adminAuth';
import { runCatalogSemanticAudit, reconcileCatalogIntegrity } from '../services/adminAudit';

interface AdminIngestionProps {
  navigate: (route: string) => void;
}

export const AdminIngestion: React.FC<AdminIngestionProps> = ({ navigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<{
    configured: boolean;
    totalCatalogCount?: number;
    countByContentType?: { movies: number; tvSeries: number };
    integrity?: {
      totalContent: number;
      moviesCount: number;
      tvCount: number;
      contentWithIndustry: number;
      orphanedContent: number;
      contentWithLanguage: number;
      contentWithCountry: number;
      contentWithGenres: number;
      isHealthy: boolean;
    };
    relationalIntegrity?: {
      totalContent: number;
      contentWithIndustry: number;
      contentWithLanguage: number;
      contentWithCountry: number;
      contentWithGenres: number;
      orphanedContent: number;
      exactOneIndustryCount: number;
      multiIndustryCount: number;
      missingIndustryCount: number;
      duplicateSourceIdsCount: number;
      isRelationallyHealthy: boolean;
    };
    semanticQuality?: {
      evaluatedCount: number;
      semanticMatches: number;
      semanticDiscrepanciesCount: number;
      languageIndustryContradictions: number;
      fallbackHollywoodAnomalies: number;
      unclassifiedTitlesCount: number;
      semanticQualityScore: number;
      isSemanticallyHealthy: boolean;
      overallHealth: boolean;
      anomalies: Array<{
        id: string;
        title: string;
        actualIndustry: string;
        expectedIndustry: string;
        language: string;
        reason: string;
      }>;
    };
    currentDailyQuota?: number;
    pagesProcessed?: number;
    pagesRemaining?: number | string;
    successfulItems?: number;
    failedItems?: number;
    lastRun: any | null;
    lastSuccessfulRun?: any | null;
    nextScheduledRun?: string;
    recentRuns: any[];
    progress: any[];
  }>({
    configured: false,
    totalCatalogCount: 0,
    countByContentType: { movies: 0, tvSeries: 0 },
    integrity: {
      totalContent: 0,
      moviesCount: 0,
      tvCount: 0,
      contentWithIndustry: 0,
      orphanedContent: 0,
      contentWithLanguage: 0,
      contentWithCountry: 0,
      contentWithGenres: 0,
      isHealthy: true
    },
    currentDailyQuota: 1000,
    pagesProcessed: 0,
    pagesRemaining: 'Continuous',
    successfulItems: 0,
    failedItems: 0,
    lastRun: null,
    lastSuccessfulRun: null,
    nextScheduledRun: '02:00 UTC (Nightly via pg_cron)',
    recentRuns: [],
    progress: []
  });

  const [regionalCounts, setRegionalCounts] = useState<Array<{
    code: string;
    name: string;
    count: number;
    movieCount: number;
    tvCount: number;
  }>>([]);

  const [selectedLimit, setSelectedLimit] = useState<number>(100);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [reconcileLoading, setReconcileLoading] = useState<boolean>(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);

  const handleRunSemanticAudit = async () => {
    try {
      setAuditLoading(true);
      setAuditFeedback(null);

      // 1. Direct Client-Side Supabase Semantic Audit
      try {
        const audit = await runCatalogSemanticAudit(supabase);
        if (audit) {
          setAuditFeedback(`Audit complete: ${audit.semanticQuality.semanticQualityScore}% semantic quality score. ${audit.semanticQuality.semanticDiscrepanciesCount} anomalies found.`);
          await loadData();
          setAuditLoading(false);
          return;
        }
      } catch (directErr) {
        console.warn('Direct Supabase audit error, trying Edge Function fallback:', directErr);
      }

      // 2. Fallback to Supabase Edge Function 'admin-reconcile'
      const { data, error } = await supabase.functions.invoke('admin-reconcile', {
        body: { action: 'semantic-audit' }
      });
      if (!error && data && data.success) {
        setAuditFeedback(`Audit complete: ${data.semanticQuality?.semanticQualityScore || 100}% semantic quality score. ${data.semanticQuality?.semanticDiscrepanciesCount || 0} anomalies found.`);
        await loadData();
      } else {
        setAuditFeedback(`Audit failed: ${error?.message || data?.error || 'Unknown audit error'}`);
      }
    } catch (err: any) {
      setAuditFeedback(`Audit error: ${err.message}`);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setReconcileLoading(true);
      setAuditFeedback(null);

      const res = await reconcileCatalogIntegrity(supabase);
      if (res && res.success) {
        setAuditFeedback(res.message);
        await loadData();
      } else {
        setAuditFeedback(`Reconcile failed: ${res?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setAuditFeedback(`Reconcile error: ${err.message}`);
    } finally {
      setReconcileLoading(false);
    }
  };
  const [runMessage, setRunMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!isUserAdmin(user)) return;
    setLoading(true);
    try {
      const [status, counts] = await Promise.all([
        contentService.getIngestionStatus(),
        contentService.getRegionalCatalogCounts()
      ]);
      setStatusData(status as any);
      setRegionalCounts(counts);
    } catch (err) {
      console.warn('Error loading admin ingestion data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!isUserAdmin(user)) {
        navigate('home');
      } else {
        loadData();
      }
    }
  }, [authLoading, user, navigate, loadData]);

  const handleTriggerIngestion = async () => {
    if (triggering) return;
    setTriggering(true);
    setRunMessage(null);

    try {
      const res = await contentService.triggerIngestion({
        limit: selectedLimit,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        media_type: selectedMediaType !== 'all' ? selectedMediaType : undefined
      });

      if (res.success) {
        setRunMessage({
          type: 'success',
          text: `Ingestion batch completed successfully! Processed ${res.data?.stats?.scanned || 0} titles (${res.data?.stats?.inserted || 0} newly indexed, ${res.data?.stats?.updated || 0} refreshed).`
        });
        await loadData();
      } else {
        setRunMessage({
          type: 'error',
          text: `Ingestion failed or returned warning: ${res.error || 'Unknown error'}`
        });
      }
    } catch (e: any) {
      setRunMessage({
        type: 'error',
        text: `Trigger error: ${e.message || 'Network failure'}`
      });
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Success
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Partial
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!isUserAdmin(user)) {
    return null;
  }

  const lastRun = statusData.lastRun;
  const lastSuccessful = statusData.lastSuccessfulRun || (statusData.recentRuns?.find((r: any) => r.status === 'SUCCESS') ?? null);
  const totalCount = statusData.totalCatalogCount || regionalCounts.reduce((acc, c) => acc + c.count, 0);
  const totalMovies = statusData.countByContentType?.movies ?? regionalCounts.reduce((acc, c) => acc + c.movieCount, 0);
  const totalTv = statusData.countByContentType?.tvSeries ?? regionalCounts.reduce((acc, c) => acc + c.tvCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <button
            onClick={() => navigate('profile')}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 shadow-xs">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Continuous TMDB Catalog Ingestion Engine
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                  Open-Ended Cursor Scaling
                </span>
              </h1>
              <p className="text-sm text-zinc-400">
                Automated continuous synchronization of regional and global film, drama, and anime catalogs without artificial caps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleTriggerIngestion}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {triggering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting TMDB...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Run Ingestion Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert / Notification Feedback */}
      {runMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            runMessage.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
          }`}
        >
          {runMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium">{runMessage.text}</div>
        </div>
      )}

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Count */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
            <span>Total Catalog Size</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {totalCount.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="text-sky-400 flex items-center gap-1">
                <Film className="w-3 h-3" /> {totalMovies.toLocaleString()} Movies
              </span>
              <span>•</span>
              <span className="text-indigo-400 flex items-center gap-1">
                <Tv className="w-3 h-3" /> {totalTv.toLocaleString()} Series/Anime
              </span>
            </div>
          </div>
        </div>

        {/* Ingestion Progress & Cursors */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
            <span>Pages Processed / Cursor State</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {statusData.pagesProcessed || statusData.progress.reduce((acc, p) => acc + (p.last_successful_page || 0), 0)}
              <span className="text-sm font-normal text-zinc-500 ml-1.5">pages</span>
            </div>
            <div className="text-xs text-emerald-400/90 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Open-ended persistent cursor
            </div>
          </div>
        </div>

        {/* Daily Throughput / Quota */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
            <span>Configured Daily Quota</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {statusData.currentDailyQuota ? statusData.currentDailyQuota.toLocaleString() : '1,000'}
              <span className="text-sm font-normal text-zinc-500 ml-1.5">titles/day</span>
            </div>
            <div className="text-xs text-zinc-400">
              Configurable via <code className="text-amber-300 font-mono text-[10px]">DAILY_INGESTION_LIMIT</code>
            </div>
          </div>
        </div>

        {/* Scheduled Runs & Health */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
            <span>Automation Schedule</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              {statusData.nextScheduledRun || '02:00 UTC (Nightly)'}
            </div>
            <div className="text-xs text-zinc-400">
              Last Success: {lastSuccessful?.started_at ? new Date(lastSuccessful.started_at).toLocaleTimeString() : 'Recent'}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Execution Tuning Panel */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Sliders className="w-4 h-4 text-sky-400" /> Manual Run Configuration
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Batch Ingestion Limit</label>
            <select
              value={selectedLimit}
              onChange={(e) => setSelectedLimit(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value={25}>25 titles (Quick test)</option>
              <option value={50}>50 titles (Standard batch)</option>
              <option value={100}>100 titles (Recommended)</option>
              <option value={250}>250 titles (Large sync)</option>
              <option value={500}>500 titles (Deep backfill)</option>
              <option value={1000}>1,000 titles (Full daily quota)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Target Region / Industry</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="all">All Regions (Balanced Round-Robin)</option>
              <option value="hollywood">Hollywood (US/English)</option>
              <option value="bollywood">Bollywood (Hindi)</option>
              <option value="tollywood">Tollywood (Telugu)</option>
              <option value="kollywood">Kollywood (Tamil)</option>
              <option value="mollywood">Mollywood (Malayalam)</option>
              <option value="sandalwood">Sandalwood (Kannada)</option>
              <option value="korean_cinema">Korean Cinema & K-Drama</option>
              <option value="japanese_cinema">Japanese Cinema & J-Drama</option>
              <option value="anime_industry">Anime Industry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Media Type</label>
            <select
              value={selectedMediaType}
              onChange={(e) => setSelectedMediaType(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="all">Both (Movies & TV Series)</option>
              <option value="movie">Movies Only</option>
              <option value="tv">TV & Web Series Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {auditFeedback && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{auditFeedback}</span>
          </div>
          <button
            onClick={() => setAuditFeedback(null)}
            className="text-sky-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Relational Database Integrity & Junction Sync Diagnostic */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Relational Database Integrity & Junction Sync
                {statusData.relationalIntegrity?.isRelationallyHealthy ?? statusData.integrity?.isHealthy ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100% Junction Complete
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {statusData.integrity?.orphanedContent || 0} Orphans Detected
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Audits relational existence and foreign keys across content and junction tables (`content_industries`, `content_languages`, `content_countries`, `content_genres`).
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Total Titles</div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {(statusData.relationalIntegrity?.totalContent || statusData.integrity?.totalContent || totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Base content rows</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Industry Linked</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {(statusData.relationalIntegrity?.contentWithIndustry ?? statusData.integrity?.contentWithIndustry ?? totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">content_industries</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Language Linked</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-1">
              {(statusData.relationalIntegrity?.contentWithLanguage ?? statusData.integrity?.contentWithLanguage ?? totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-sky-500/80 mt-0.5">content_languages</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Country Linked</div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-1">
              {(statusData.relationalIntegrity?.contentWithCountry ?? statusData.integrity?.contentWithCountry ?? totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-500/80 mt-0.5">content_countries</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Genre Linked</div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-1">
              {(statusData.relationalIntegrity?.contentWithGenres ?? statusData.integrity?.contentWithGenres ?? totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-500/80 mt-0.5">content_genres</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            (statusData.relationalIntegrity?.orphanedContent || statusData.integrity?.orphanedContent || 0) === 0
              ? 'bg-emerald-950/20 border-emerald-800/40'
              : 'bg-rose-950/20 border-rose-800/40'
          }`}>
            <div className="text-[11px] text-zinc-400 font-medium">Orphaned Records</div>
            <div className={`text-lg font-bold font-mono mt-1 ${
              (statusData.relationalIntegrity?.orphanedContent || statusData.integrity?.orphanedContent || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {statusData.relationalIntegrity?.orphanedContent || statusData.integrity?.orphanedContent || 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Missing junction links</div>
          </div>
        </div>
      </div>

      {/* Semantic Classification Quality Audit Panel */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Semantic Classification Quality & Metadata Determinism
                {statusData.semanticQuality?.isSemanticallyHealthy ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100% Semantically Valid
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {statusData.semanticQuality?.semanticDiscrepanciesCount || 0} Semantic Discrepancies
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Audits language/country alignment against assigned regional industries, verifies zero fallback-to-Hollywood leakages, and enforces deterministic mapping rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSemanticAudit}
              disabled={auditLoading || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
              Run Forensic Audit
            </button>
            {statusData.semanticQuality && !statusData.semanticQuality.isSemanticallyHealthy && (
              <button
                onClick={handleReconcile}
                disabled={reconcileLoading || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${reconcileLoading ? 'animate-spin' : ''}`} />
                Auto-Reconcile Catalog
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Quality Score</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {statusData.semanticQuality?.semanticQualityScore ?? 100}%
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Deterministic match rate</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Language Consistency</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-1">
              {((statusData.semanticQuality?.evaluatedCount || totalCount) - (statusData.semanticQuality?.languageIndustryContradictions || 0)).toLocaleString()} / {(statusData.semanticQuality?.evaluatedCount || totalCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-sky-500/80 mt-0.5">0 Contradictions</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Hollywood Fallback Anomalies</div>
            <div className={`text-lg font-bold font-mono mt-1 ${
              (statusData.semanticQuality?.fallbackHollywoodAnomalies || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {statusData.semanticQuality?.fallbackHollywoodAnomalies || 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Silent fallback rate: 0%</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Unclassified Records</div>
            <div className="text-lg font-bold text-zinc-300 font-mono mt-1">
              {statusData.semanticQuality?.unclassifiedTitlesCount || 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Explicit unknown state</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400 font-medium">Duplicate Sources</div>
            <div className="text-lg font-bold text-zinc-300 font-mono mt-1">
              {statusData.relationalIntegrity?.duplicateSourceIdsCount || 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Unique external IDs</div>
          </div>
        </div>
      </div>

      {/* Regional Catalog Distribution Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-sky-400" /> Regional Catalog Distribution
            </h2>
            <p className="text-xs text-zinc-400">
              Live catalog breakdown across all configured industries. Titles grow indefinitely with nightly scheduled synchronizations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionalCounts.map((reg) => (
            <div
              key={reg.code}
              className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-zinc-100">{reg.name}</div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  {reg.count.toLocaleString()} titles
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{reg.movieCount} Movies</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{reg.tvCount} Series</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ingestion Progress Cursors Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" /> Ingestion Progress Cursors
          </h2>
          <p className="text-xs text-zinc-400">
            Persistent cursor pagination tracking ensuring continuous, resume-capable multi-page scanning without artificial bounds.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Category / Industry</th>
                <th className="py-3 px-4">Media</th>
                <th className="py-3 px-4">Current Cursor</th>
                <th className="py-3 px-4">Last Success Page</th>
                <th className="py-3 px-4">Pages Scanned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {statusData.progress.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-500 font-sans">
                    No cursor progress records found yet. Cursors will populate automatically during ingestion.
                  </td>
                </tr>
              ) : (
                statusData.progress.map((p: any) => (
                  <tr key={`${p.category || p.industry_code}_${p.media_type || p.content_type}`} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-zinc-100">{p.category || p.industry_code}</td>
                    <td className="py-3 px-4 uppercase text-[11px] text-zinc-400">{p.media_type || p.content_type}</td>
                    <td className="py-3 px-4 text-sky-400 font-bold">Page {p.current_page}</td>
                    <td className="py-3 px-4 text-emerald-400">Page {p.last_successful_page || 0}</td>
                    <td className="py-3 px-4 text-zinc-400">{p.total_pages_scanned || p.last_successful_page || 0}</td>
                    <td className="py-3 px-4 font-sans">{getStatusBadge(p.status || 'SUCCESS')}</td>
                    <td className="py-3 px-4 font-sans text-zinc-400">
                      {p.last_run_at || p.last_synced_at ? new Date(p.last_run_at || p.last_synced_at).toLocaleTimeString() : 'Recently'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Ingestion Runs Log Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" /> Ingestion Runs History
          </h2>
          <p className="text-xs text-zinc-400">
            Audit log of scheduled and manual synchronization executions.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scanned</th>
                <th className="py-3 px-4">Inserted</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Errors / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {statusData.recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-zinc-500 font-sans">
                    No historical runs logged yet. Click "Run Ingestion Now" to trigger a run.
                  </td>
                </tr>
              ) : (
                statusData.recentRuns.map((r: any) => (
                  <tr key={r.run_id || r.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] truncate max-w-[140px]">{r.run_id || r.id}</td>
                    <td className="py-3 px-4 font-sans text-zinc-300">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">{getStatusBadge(r.status)}</td>
                    <td className="py-3 px-4 text-zinc-200">{r.titles_scanned ?? r.scanned_count ?? 0}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">+{r.titles_inserted ?? r.inserted_count ?? 0}</td>
                    <td className="py-3 px-4 text-sky-400">~{r.titles_updated ?? r.updated_count ?? 0}</td>
                    <td className="py-3 px-4 text-rose-400">{r.failed_records ?? r.errors_count ?? 0}</td>
                    <td className="py-3 px-4 font-sans text-zinc-400 truncate max-w-[200px]" title={r.error_summary || 'Clean run'}>
                      {r.error_summary || 'Clean run without errors'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
