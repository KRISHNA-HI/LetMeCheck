import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 2. Server-side Delete Account Endpoint
// Securely validates caller JWT token, purges user-scoped records, and deletes Auth user via Supabase Admin API
app.post('/api/delete-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Missing bearer token.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (!supabaseUrl) {
      return res.status(500).json({ success: false, error: 'Supabase URL is not configured.' });
    }

    // Authenticate the user from the client JWT token
    const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired user session.' });
    }

    const userId = user.id;

    // Use Service Role client if available, or authenticated client to delete user data
    const executionClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false }
        });

    // Delete user's data from public tables
    await executionClient.from('notes').delete().eq('user_id', userId);
    await executionClient.from('favorites').delete().eq('user_id', userId);
    await executionClient.from('user_material_progress').delete().eq('user_id', userId);
    await executionClient.from('user_progress').delete().eq('user_id', userId);
    await executionClient.from('user_library').delete().eq('user_id', userId);
    await executionClient.from('profiles').delete().eq('id', userId);

    // Delete Auth User from auth.users
    let authUserDeleted = false;
    let authErrorMessage = '';

    // If Service Role key is present, delete via Supabase Admin API
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { error: adminDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (!adminDeleteErr) {
        authUserDeleted = true;
      } else {
        authErrorMessage = adminDeleteErr.message;
      }
    }

    // Try PostgreSQL RPC function if not already deleted
    if (!authUserDeleted) {
      const { error: rpcErr } = await executionClient.rpc('delete_user_account');
      if (!rpcErr) {
        authUserDeleted = true;
      } else {
        authErrorMessage = authErrorMessage || rpcErr.message;
      }
    }

    if (!authUserDeleted) {
      return res.status(500).json({
        success: false,
        error: authErrorMessage
          ? `Server failed to delete auth account: ${authErrorMessage}`
          : 'Could not permanently delete auth account. Service role key or RPC function is required.'
      });
    }

    return res.json({
      success: true,
      message: 'Account and associated user data permanently deleted'
    });
  } catch (err: any) {
    console.error('API /api/delete-account error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during account deletion.'
    });
  }
});

import {
  executeTmdbIngestion,
  getIngestionRuns,
  getIngestionProgress,
  getIngestedCatalog,
  initIngestionScheduler,
  REGION_REGISTRY,
  resolveDeterministicClassification
} from './src/server/ingestionWorker';
import { requireAdminAuth } from './src/server/adminAuth';

// Helper for unified semantic & relational audit across all catalog items
async function auditCatalogIntegrity(client: any) {
  const [
    allContentRes,
    allCiRes,
    allClRes,
    allCcRes,
    allCgRes,
    indListRes,
    langListRes,
    countryListRes
  ] = await Promise.all([
    client.from('content').select('id, title, original_title, content_type, is_anime, external_source, external_id, metadata'),
    client.from('content_industries').select('content_id, industry_id, is_primary'),
    client.from('content_languages').select('content_id, language_id, is_primary'),
    client.from('content_countries').select('content_id, country_id'),
    client.from('content_genres').select('content_id, genre_id'),
    client.from('industries').select('id, name'),
    client.from('languages').select('id, name, iso_code'),
    client.from('countries').select('id, name, iso_code')
  ]);

  const allContent = allContentRes.data || [];
  const allCi = allCiRes.data || [];
  const allCl = allClRes.data || [];
  const allCc = allCcRes.data || [];
  const allCg = allCgRes.data || [];
  const indList = indListRes.data || [];
  const langList = langListRes.data || [];
  const countryList = countryListRes.data || [];

  const indMap = new Map<string, number>();
  const indIdToName = new Map<number, string>();
  indList.forEach((i: any) => {
    indIdToName.set(i.id, i.name);
    if (i.name) indMap.set(i.name.toLowerCase(), i.id);
  });
  indMap.set('hollywood', indMap.get('hollywood') || 3);
  indMap.set('bollywood', indMap.get('bollywood') || 4);
  indMap.set('tollywood', indMap.get('tollywood') || 5);
  indMap.set('kollywood', indMap.get('kollywood') || 6);
  indMap.set('mollywood', indMap.get('mollywood') || 7);
  indMap.set('sandalwood', indMap.get('sandalwood') || 8);
  indMap.set('korean_cinema', indMap.get('korean cinema & k-drama') || 9);
  indMap.set('japanese_cinema', indMap.get('japanese cinema & j-drama') || 10);
  indMap.set('anime_industry', indMap.get('anime industry') || 11);

  const langMap = new Map<string, number>();
  const langIdToIso = new Map<number, string>();
  langList.forEach((l: any) => {
    if (l.iso_code) {
      langMap.set(l.iso_code.toLowerCase(), l.id);
      langIdToIso.set(l.id, l.iso_code.toLowerCase());
    }
    if (l.name) langMap.set(l.name.toLowerCase(), l.id);
  });

  const countryMap = new Map<string, number>();
  const countryIdToIso = new Map<number, string>();
  countryList.forEach((c: any) => {
    if (c.iso_code) {
      countryMap.set(c.iso_code.toLowerCase(), c.id);
      countryIdToIso.set(c.id, c.iso_code.toUpperCase());
    }
    if (c.name) countryMap.set(c.name.toLowerCase(), c.id);
  });

  // Junction mappings
  const ciByContent = new Map<string, any[]>();
  allCi.forEach((ci: any) => {
    const list = ciByContent.get(ci.content_id) || [];
    list.push(ci);
    ciByContent.set(ci.content_id, list);
  });

  const clByContent = new Map<string, any[]>();
  allCl.forEach((cl: any) => {
    const list = clByContent.get(cl.content_id) || [];
    list.push(cl);
    clByContent.set(cl.content_id, list);
  });

  const ccByContent = new Map<string, any[]>();
  allCc.forEach((cc: any) => {
    const list = ccByContent.get(cc.content_id) || [];
    list.push(cc);
    ccByContent.set(cc.content_id, list);
  });

  const cgByContent = new Map<string, any[]>();
  allCg.forEach((cg: any) => {
    const list = cgByContent.get(cg.content_id) || [];
    list.push(cg);
    cgByContent.set(cg.content_id, list);
  });

  // Check duplicate source IDs
  const sourceIdSeen = new Set<string>();
  let duplicateSourceIdsCount = 0;
  for (const c of allContent) {
    if (c.external_source && c.external_id) {
      const key = `${c.external_source}:${c.external_id}`;
      if (sourceIdSeen.has(key)) {
        duplicateSourceIdsCount++;
      } else {
        sourceIdSeen.add(key);
      }
    }
  }

  // Check duplicate junction records & multi-industry assignments
  let multiIndustryCount = 0;
  let missingIndustryCount = 0;
  let exactOneIndustryCount = 0;

  // Semantic audit structures
  let languageIndustryContradictions = 0;
  let fallbackHollywoodAnomalies = 0;
  let unclassifiedTitlesCount = 0;
  let semanticMatches = 0;
  const anomalies: Array<{
    id: string;
    title: string;
    actualIndustry: string;
    expectedIndustry: string;
    language: string;
    reason: string;
  }> = [];

  for (const c of allContent) {
    const cis = ciByContent.get(c.id) || [];
    if (cis.length === 0) missingIndustryCount++;
    else if (cis.length === 1) exactOneIndustryCount++;
    else multiIndustryCount++;

    const primaryCi = cis.find((x: any) => x.is_primary) || cis[0];
    const actualIndId = primaryCi?.industry_id;
    const actualIndName = actualIndId ? (indIdToName.get(actualIndId) || 'Unknown') : 'None';

    const meta = c.metadata || {};
    const cls = clByContent.get(c.id) || [];
    const primaryCl = cls.find((x: any) => x.is_primary) || cls[0];
    const actualLangIso = primaryCl?.language_id ? (langIdToIso.get(primaryCl.language_id) || '') : '';
    const rawLang = (meta.original_language || actualLangIso || '').toLowerCase().trim();

    const expected = resolveDeterministicClassification(
      {
        original_language: rawLang,
        industry_code: meta.industry_code,
        origin_country: meta.country_code,
        genres: meta.genres,
        is_anime: c.is_anime || meta.is_anime,
        title: c.title,
        original_title: c.original_title
      },
      { indMap, langMap, countryMap }
    );

    if (expected.isUnclassified) {
      unclassifiedTitlesCount++;
      anomalies.push({
        id: c.id,
        title: c.title,
        actualIndustry: actualIndName,
        expectedIndustry: 'Unclassified',
        language: rawLang,
        reason: 'Unable to deterministically classify from metadata'
      });
    } else if (expected.industryId && expected.industryId !== actualIndId) {
      if (actualIndName === 'Hollywood' && expected.industryName !== 'Hollywood') {
        fallbackHollywoodAnomalies++;
      }
      if (['hi', 'te', 'ta', 'ml', 'kn', 'ko', 'ja'].includes(rawLang) && actualIndName !== expected.industryName) {
        languageIndustryContradictions++;
      }
      anomalies.push({
        id: c.id,
        title: c.title,
        actualIndustry: actualIndName,
        expectedIndustry: expected.industryName || 'Unknown',
        language: rawLang,
        reason: expected.reason
      });
    } else {
      semanticMatches++;
    }
  }

  const totalContent = allContent.length;
  const contentWithIndustry = ciByContent.size;
  const contentWithLanguage = clByContent.size;
  const contentWithCountry = ccByContent.size;
  const contentWithGenres = cgByContent.size;
  const orphanedContent = Math.max(0, totalContent - contentWithIndustry);

  const isRelationallyHealthy = totalContent > 0 && orphanedContent === 0 && multiIndustryCount === 0 && duplicateSourceIdsCount === 0;
  const semanticErrors = anomalies.length;
  const isSemanticallyHealthy = totalContent > 0 && semanticErrors === 0;
  const semanticQualityScore = totalContent > 0 ? Number(((semanticMatches / totalContent) * 100).toFixed(1)) : 0;
  const overallHealth = isRelationallyHealthy && isSemanticallyHealthy;

  return {
    totalContent,
    moviesCount: allContent.filter((c: any) => c.content_type === 'movie').length,
    tvCount: allContent.filter((c: any) => c.content_type === 'series').length,
    relationalIntegrity: {
      totalContent,
      contentWithIndustry,
      contentWithLanguage,
      contentWithCountry,
      contentWithGenres,
      orphanedContent,
      exactOneIndustryCount,
      multiIndustryCount,
      missingIndustryCount,
      duplicateSourceIdsCount,
      isRelationallyHealthy
    },
    semanticQuality: {
      evaluatedCount: totalContent,
      semanticMatches,
      semanticDiscrepanciesCount: semanticErrors,
      languageIndustryContradictions,
      fallbackHollywoodAnomalies,
      unclassifiedTitlesCount,
      semanticQualityScore,
      isSemanticallyHealthy,
      overallHealth,
      anomalies
    }
  };
}

// 3. Admin Ingestion Status Endpoint (Admin Only)
app.get('/api/admin/ingestion-status', requireAdminAuth, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
    const dailyQuota = parseInt(process.env.DAILY_INGESTION_LIMIT || '1000', 10);

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const client = createClient(supabaseUrl, supabaseServiceKey);
        const [runsRes, progRes, auditResult, ciRes, indListRes] = await Promise.all([
          client.from('ingestion_runs').select('*').order('started_at', { ascending: false }).limit(10),
          client.from('ingestion_progress').select('*').order('updated_at', { ascending: false }),
          auditCatalogIntegrity(client),
          client.from('content_industries').select('content_id, industry_id'),
          client.from('industries').select('id, name')
        ]);

        const recentRuns = runsRes.data || [];
        const progress = progRes.data || [];
        const lastRun = recentRuns.length > 0 ? recentRuns[0] : null;
        const lastSuccessfulRun = recentRuns.find((r: any) => r.status === 'SUCCESS') || null;

        const indList = indListRes.data || [];
        const ciList = ciRes.data || [];
        const indIdToName = new Map<number | string, string>();
        indList.forEach((i: any) => indIdToName.set(i.id, i.name));

        const industrySets: Record<string, Set<string>> = {
          hollywood: new Set(),
          bollywood: new Set(),
          tollywood: new Set(),
          kollywood: new Set(),
          mollywood: new Set(),
          sandalwood: new Set(),
          korean_cinema: new Set(),
          japanese_cinema: new Set(),
          anime_industry: new Set()
        };

        const NAME_TO_KEY: Record<string, string> = {
          'hollywood': 'hollywood',
          'bollywood': 'bollywood',
          'tollywood': 'tollywood',
          'kollywood': 'kollywood',
          'mollywood': 'mollywood',
          'sandalwood': 'sandalwood',
          'korean cinema & k-drama': 'korean_cinema',
          'japanese cinema & j-drama': 'japanese_cinema',
          'anime industry': 'anime_industry'
        };

        ciList.forEach((ci: any) => {
          const indName = indIdToName.get(ci.industry_id);
          if (indName) {
            const key = NAME_TO_KEY[indName.toLowerCase()];
            if (key && industrySets[key]) {
              industrySets[key].add(ci.content_id);
            }
          }
        });

        const industryCounts: Record<string, number> = {};
        for (const [key, set] of Object.entries(industrySets)) {
          industryCounts[key] = set.size;
        }

        let totalPagesProcessed = 0;
        let totalPagesAvailable = 0;
        for (const p of progress) {
          totalPagesProcessed += (p.last_successful_page || 0);
          totalPagesAvailable += (p.total_pages_available || 1);
        }

        const totalInsertedAll = recentRuns.reduce((acc: number, r: any) => acc + (r.titles_inserted || 0), 0);
        const totalFailedAll = recentRuns.reduce((acc: number, r: any) => acc + (r.failed_records || 0), 0);

        const integrity = {
          totalContent: auditResult.totalContent,
          moviesCount: auditResult.moviesCount,
          tvCount: auditResult.tvCount,
          contentWithIndustry: auditResult.relationalIntegrity.contentWithIndustry,
          orphanedContent: auditResult.relationalIntegrity.orphanedContent,
          contentWithLanguage: auditResult.relationalIntegrity.contentWithLanguage,
          contentWithCountry: auditResult.relationalIntegrity.contentWithCountry,
          contentWithGenres: auditResult.relationalIntegrity.contentWithGenres,
          isHealthy: auditResult.semanticQuality.overallHealth
        };

        return res.json({
          success: true,
          configured: true,
          totalCatalogCount: auditResult.totalContent,
          countByContentType: {
            movies: auditResult.moviesCount,
            tvSeries: auditResult.tvCount
          },
          industryCounts,
          integrity,
          relationalIntegrity: auditResult.relationalIntegrity,
          semanticQuality: auditResult.semanticQuality,
          currentDailyQuota: dailyQuota,
          pagesProcessed: totalPagesProcessed,
          pagesRemaining: Math.max(0, totalPagesAvailable - totalPagesProcessed),
          successfulItems: totalInsertedAll,
          failedItems: totalFailedAll,
          lastRun,
          lastSuccessfulRun,
          nextScheduledRun: '02:00 AM IST / 20:30 UTC (Nightly via pg_cron)',
          recentRuns,
          progress: progress.map((p: any) => ({
            ...p,
            pagesRemaining: Math.max(0, (p.total_pages_available || 1) - (p.last_successful_page || 0))
          })),
          source: 'Supabase-Native Database (Live Synchronization)'
        });
      } catch (dbErr) {
        console.warn('Direct Supabase status query error:', dbErr);
        return res.status(503).json({ success: false, configured: false, error: 'Database unavailable' });
      }
    }

    return res.status(503).json({
      success: false,
      configured: false,
      error: 'Database unavailable: Supabase credentials not configured'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch ingestion status' });
  }
});

// 3b. Live Read-Only Semantic Audit Endpoint (Admin Only)
app.get('/api/admin/semantic-audit', requireAdminAuth, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({ success: false, error: 'Database credentials not configured' });
    }

    const client = createClient(supabaseUrl, supabaseServiceKey);
    const auditResult = await auditCatalogIntegrity(client);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...auditResult
    });
  } catch (err: any) {
    console.error('API /api/admin/semantic-audit error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Audit failed' });
  }
});

// 3c. Live Reconcile & Self-Healing Endpoint (Admin Only)
app.post('/api/admin/reconcile-integrity', requireAdminAuth, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({ success: false, error: 'Database credentials not configured' });
    }

    const client = createClient(supabaseUrl, supabaseServiceKey);
    const auditBefore = await auditCatalogIntegrity(client);
    let healedCount = 0;

    const [indListRes, langListRes, countryListRes] = await Promise.all([
      client.from('industries').select('id, name'),
      client.from('languages').select('id, name, iso_code'),
      client.from('countries').select('id, name, iso_code')
    ]);

    const indMap = new Map<string, number>();
    (indListRes.data || []).forEach((i: any) => {
      if (i.name) indMap.set(i.name.toLowerCase(), i.id);
    });
    indMap.set('hollywood', indMap.get('hollywood') || 3);
    indMap.set('bollywood', indMap.get('bollywood') || 4);
    indMap.set('tollywood', indMap.get('tollywood') || 5);
    indMap.set('kollywood', indMap.get('kollywood') || 6);
    indMap.set('mollywood', indMap.get('mollywood') || 7);
    indMap.set('sandalwood', indMap.get('sandalwood') || 8);
    indMap.set('korean_cinema', indMap.get('korean cinema & k-drama') || 9);
    indMap.set('japanese_cinema', indMap.get('japanese cinema & j-drama') || 10);
    indMap.set('anime_industry', indMap.get('anime industry') || 11);

    const langMap = new Map<string, number>();
    (langListRes.data || []).forEach((l: any) => {
      if (l.iso_code) langMap.set(l.iso_code.toLowerCase(), l.id);
      if (l.name) langMap.set(l.name.toLowerCase(), l.id);
    });

    const countryMap = new Map<string, number>();
    (countryListRes.data || []).forEach((c: any) => {
      if (c.iso_code) countryMap.set(c.iso_code.toLowerCase(), c.id);
      if (c.name) countryMap.set(c.name.toLowerCase(), c.id);
    });

    for (const anomaly of auditBefore.semanticQuality.anomalies) {
      const { data: contentItem } = await client.from('content').select('*').eq('id', anomaly.id).single();
      if (!contentItem) continue;

      const meta = contentItem.metadata || {};
      const expected = resolveDeterministicClassification(
        {
          original_language: meta.original_language,
          industry_code: meta.industry_code,
          origin_country: meta.country_code,
          genres: meta.genres,
          is_anime: contentItem.is_anime || meta.is_anime,
          title: contentItem.title,
          original_title: contentItem.original_title
        },
        { indMap, langMap, countryMap }
      );

      if (expected.industryId) {
        await client.from('content_industries').delete().eq('content_id', contentItem.id);
        await client.from('content_industries').insert({
          content_id: contentItem.id,
          industry_id: expected.industryId,
          is_primary: true
        });
        healedCount++;
      }
    }

    const auditAfter = await auditCatalogIntegrity(client);

    return res.json({
      success: true,
      message: `Reconciled catalog relationships. ${healedCount} records corrected.`,
      healedCount,
      auditBefore: {
        discrepancies: auditBefore.semanticQuality.semanticDiscrepanciesCount,
        score: auditBefore.semanticQuality.semanticQualityScore
      },
      auditAfter: {
        discrepancies: auditAfter.semanticQuality.semanticDiscrepanciesCount,
        score: auditAfter.semanticQuality.semanticQualityScore
      }
    });
  } catch (err: any) {
    console.error('API /api/admin/reconcile-integrity error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Reconciliation failed' });
  }
});

// 4. Admin Manual Trigger Ingestion Endpoint (Admin Only)
app.post('/api/admin/ingest-tmdb', requireAdminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const limit = typeof body.limit === 'number' ? body.limit : typeof body.batch_limit === 'number' ? body.batch_limit : typeof body.batchLimit === 'number' ? body.batchLimit : 100;
    const category = body.category || body.force_category || body.region_filter || undefined;
    const mediaType = body.media_type || body.force_media_type || undefined;

    // Resilient server-side Ingestion Worker with direct transactional Supabase synchronization
    const result = await executeTmdbIngestion({
      batchLimit: limit,
      regionFilter: category,
      mediaType: mediaType === 'movie' || mediaType === 'tv' ? mediaType : undefined,
      runType: 'manual'
    });

    return res.json(result);
  } catch (err: any) {
    console.error('API /api/admin/ingest-tmdb error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during ingestion trigger.'
    });
  }
});

// 4b. Admin Regional Distribution Counts Endpoint
app.get('/api/admin/regional-counts', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    const REGION_MAP: Record<string, { name: string; matchNames: string[] }> = {
      hollywood: { name: 'Hollywood (English)', matchNames: ['hollywood'] },
      bollywood: { name: 'Bollywood (Hindi)', matchNames: ['bollywood'] },
      tollywood: { name: 'Tollywood (Telugu)', matchNames: ['tollywood'] },
      kollywood: { name: 'Kollywood (Tamil)', matchNames: ['kollywood'] },
      mollywood: { name: 'Mollywood (Malayalam)', matchNames: ['mollywood'] },
      sandalwood: { name: 'Sandalwood (Kannada)', matchNames: ['sandalwood'] },
      korean_cinema: { name: 'Korean Cinema (K-Drama / Movies)', matchNames: ['korean cinema & k-drama', 'korean_cinema'] },
      japanese_cinema: { name: 'Japanese Cinema (Live Action)', matchNames: ['japanese cinema & j-drama', 'japanese_cinema'] },
      anime_industry: { name: 'Anime (Japanese Animation)', matchNames: ['anime industry', 'anime', 'anime_industry'] }
    };

    if (supabaseUrl && supabaseServiceKey) {
      const client = createClient(supabaseUrl, supabaseServiceKey);
      
      // Fetch live content, junction records, and industries to compute 100% accurate dynamic counts
      const [contentRes, ciRes, indRes] = await Promise.all([
        client.from('content').select('id, content_type'),
        client.from('content_industries').select('content_id, industry_id'),
        client.from('industries').select('id, name')
      ]);

      const contentList = contentRes.data || [];
      const ciList = ciRes.data || [];
      const indList = indRes.data || [];

      const contentMap = new Map<string, string>();
      contentList.forEach((c: any) => contentMap.set(c.id, c.content_type));

      const indIdToName = new Map<number | string, string>();
      indList.forEach((i: any) => indIdToName.set(i.id, i.name.toLowerCase()));

      // Use Sets of distinct content IDs per region to guarantee COUNT(DISTINCT content_id)
      const regionalSets: Record<string, { all: Set<string>; movies: Set<string>; tv: Set<string> }> = {};
      for (const key of Object.keys(REGION_MAP)) {
        regionalSets[key] = { all: new Set<string>(), movies: new Set<string>(), tv: new Set<string>() };
      }

      // Aggregate strictly through content_industries junction records with DISTINCT content IDs
      for (const ci of ciList) {
        const indName = indIdToName.get(ci.industry_id);
        const contentType = contentMap.get(ci.content_id) || 'movie';
        const isMovie = contentType === 'movie';

        if (indName) {
          for (const [key, config] of Object.entries(REGION_MAP)) {
            if (config.matchNames.some(m => indName.includes(m))) {
              regionalSets[key].all.add(ci.content_id);
              if (isMovie) {
                regionalSets[key].movies.add(ci.content_id);
              } else {
                regionalSets[key].tv.add(ci.content_id);
              }
              break;
            }
          }
        }
      }

      const result = Object.entries(REGION_MAP).map(([code, config]) => ({
        code,
        name: config.name,
        count: regionalSets[code].all.size,
        movieCount: regionalSets[code].movies.size,
        tvCount: regionalSets[code].tv.size
      }));

      return res.json({ success: true, data: result });
    }

    return res.status(503).json({
      success: false,
      error: 'Database unavailable: Supabase credentials not configured'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4c. Admin Trigger Scheduled Nightly Worker (Admin Only)
app.post('/api/admin/trigger-nightly', requireAdminAuth, async (req, res) => {
  try {
    const result = await executeTmdbIngestion({
      batchLimit: 100,
      runType: 'scheduled'
    });
    return res.json(result);
  } catch (err: any) {
    console.error('API /api/admin/trigger-nightly error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error triggering scheduled nightly ingestion'
    });
  }
});

// 5. Ingested Catalog Query Endpoint with 20-item pagination
app.get('/api/catalog', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 20;
    const contentType = req.query.content_type as string;
    const industry = req.query.industry as string;
    const genre = req.query.genre as string;
    const query = (req.query.query as string || '').toLowerCase().trim();

    let items = getIngestedCatalog();

    if (query) {
      items = items.filter(i =>
        i.title.toLowerCase().includes(query) ||
        (i.original_title && i.original_title.toLowerCase().includes(query)) ||
        (i.description && i.description.toLowerCase().includes(query))
      );
    }

    if (contentType && contentType !== 'all') {
      items = items.filter(i => i.content_type === contentType);
    }

    if (industry && industry !== 'all') {
      items = items.filter(i => i.industry_code === industry);
    }

    if (genre && genre !== 'All') {
      items = items.filter(i => i.genres && i.genres.includes(genre));
    }

    const total = items.length;
    const startIndex = (page - 1) * perPage;
    const paginatedItems = items.slice(startIndex, startIndex + perPage);
    const hasNextPage = startIndex + perPage < total;

    return res.json({
      items: paginatedItems,
      total,
      page,
      per_page: perPage,
      hasNextPage
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch catalog' });
  }
});

// Vite middleware & Static Serving setup
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize autonomous ingestion daemon
  initIngestionScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
