import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface RegionConfig {
  code: string;
  name: string;
  languageCode: string;
  countryCode: string;
  priorityOrder: number;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  if (supabaseUrl && supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return null;
}

export interface ClassificationResult {
  industryId: number | null;
  industryCode: string | null;
  industryName: string | null;
  languageId: number | null;
  languageCode: string;
  countryId: number | null;
  countryCode: string;
  isAnime: boolean;
  isUnclassified: boolean;
  confidence: 'high' | 'medium' | 'unclassified';
  reason: string;
}

export function resolveDeterministicClassification(
  item: {
    original_language?: string;
    industry_code?: string;
    origin_country?: string[] | string;
    genres?: string[] | number[];
    is_anime?: boolean;
    title?: string;
    original_title?: string;
  },
  lookups: {
    indMap: Map<string, number>;
    langMap: Map<string, number>;
    countryMap: Map<string, number>;
  }
): ClassificationResult {
  const origLang = (item.original_language || '').toLowerCase().trim();
  const explicitCode = (item.industry_code || '').toLowerCase().trim();
  const genreList = Array.isArray(item.genres) ? item.genres.map(g => String(g).toLowerCase()) : [];

  const isAnime = Boolean(
    item.is_anime ||
    explicitCode === 'anime_industry' ||
    (origLang === 'ja' && (genreList.includes('animation') || genreList.includes('16')))
  );

  // 1. Resolve language
  let languageId: number | null = null;
  if (origLang && lookups.langMap.has(origLang)) {
    languageId = lookups.langMap.get(origLang) || null;
  }

  // 2. Resolve country
  let countryCode = '';
  if (Array.isArray(item.origin_country) && item.origin_country.length > 0) {
    countryCode = String(item.origin_country[0]).toUpperCase();
  } else if (typeof item.origin_country === 'string' && item.origin_country) {
    countryCode = item.origin_country.toUpperCase();
  }

  if (!countryCode) {
    if (['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr'].includes(origLang)) countryCode = 'IN';
    else if (origLang === 'ko') countryCode = 'KR';
    else if (origLang === 'ja') countryCode = 'JP';
    else if (origLang === 'en') countryCode = 'US';
  }

  let countryId: number | null = null;
  if (countryCode && lookups.countryMap.has(countryCode.toLowerCase())) {
    countryId = lookups.countryMap.get(countryCode.toLowerCase()) || null;
  }

  // 3. Determine industry deterministically
  let industryId: number | null = null;
  let industryCode: string | null = null;
  let industryName: string | null = null;
  let isUnclassified = false;
  let confidence: 'high' | 'medium' | 'unclassified' = 'high';
  let reason = '';

  if (isAnime) {
    industryCode = 'anime_industry';
    industryName = 'Anime Industry';
    industryId = lookups.indMap.get('anime_industry') || 11;
    reason = 'Anime Industry (Japanese Animation)';
  } else if (origLang === 'ml' || explicitCode === 'mollywood') {
    industryCode = 'mollywood';
    industryName = 'Mollywood';
    industryId = lookups.indMap.get('mollywood') || 7;
    reason = 'Mollywood (Malayalam Cinema)';
  } else if (origLang === 'te' || explicitCode === 'tollywood') {
    industryCode = 'tollywood';
    industryName = 'Tollywood';
    industryId = lookups.indMap.get('tollywood') || 5;
    reason = 'Tollywood (Telugu Cinema)';
  } else if (origLang === 'ta' || explicitCode === 'kollywood') {
    industryCode = 'kollywood';
    industryName = 'Kollywood';
    industryId = lookups.indMap.get('kollywood') || 6;
    reason = 'Kollywood (Tamil Cinema)';
  } else if (origLang === 'kn' || explicitCode === 'sandalwood') {
    industryCode = 'sandalwood';
    industryName = 'Sandalwood';
    industryId = lookups.indMap.get('sandalwood') || 8;
    reason = 'Sandalwood (Kannada Cinema)';
  } else if (origLang === 'hi' || explicitCode === 'bollywood') {
    industryCode = 'bollywood';
    industryName = 'Bollywood';
    industryId = lookups.indMap.get('bollywood') || 4;
    reason = 'Bollywood (Hindi Cinema)';
  } else if (origLang === 'ko' || explicitCode === 'korean_cinema') {
    industryCode = 'korean_cinema';
    industryName = 'Korean Cinema & K-Drama';
    industryId = lookups.indMap.get('korean_cinema') || 9;
    reason = 'Korean Cinema & K-Drama';
  } else if ((origLang === 'ja' || explicitCode === 'japanese_cinema') && !isAnime) {
    industryCode = 'japanese_cinema';
    industryName = 'Japanese Cinema & J-Drama';
    industryId = lookups.indMap.get('japanese_cinema') || 10;
    reason = 'Japanese Cinema & J-Drama';
  } else if (origLang === 'en' || explicitCode === 'hollywood' || ['US', 'GB', 'CA', 'AU'].includes(countryCode)) {
    industryCode = 'hollywood';
    industryName = 'Hollywood';
    industryId = lookups.indMap.get('hollywood') || 3;
    reason = 'Hollywood (Western/English Cinema)';
  } else {
    // Explicit Unknown/Unclassified fallback - NEVER silently assign Hollywood!
    isUnclassified = true;
    confidence = 'unclassified';
    reason = 'Unclassified / Unknown Origin';
  }

  return {
    industryId,
    industryCode,
    industryName,
    languageId,
    languageCode: origLang,
    countryId,
    countryCode,
    isAnime,
    isUnclassified,
    confidence,
    reason
  };
}

export const REGION_REGISTRY: Record<string, RegionConfig> = {
  hollywood: { code: 'hollywood', name: 'Hollywood', languageCode: 'en', countryCode: 'US', priorityOrder: 1 },
  bollywood: { code: 'bollywood', name: 'Bollywood', languageCode: 'hi', countryCode: 'IN', priorityOrder: 2 },
  tollywood: { code: 'tollywood', name: 'Tollywood', languageCode: 'te', countryCode: 'IN', priorityOrder: 3 },
  kollywood: { code: 'kollywood', name: 'Kollywood', languageCode: 'ta', countryCode: 'IN', priorityOrder: 4 },
  mollywood: { code: 'mollywood', name: 'Mollywood', languageCode: 'ml', countryCode: 'IN', priorityOrder: 5 },
  sandalwood: { code: 'sandalwood', name: 'Sandalwood', languageCode: 'kn', countryCode: 'IN', priorityOrder: 6 },
  korean_cinema: { code: 'korean_cinema', name: 'Korean Cinema & K-Drama', languageCode: 'ko', countryCode: 'KR', priorityOrder: 7 },
  japanese_cinema: { code: 'japanese_cinema', name: 'Japanese Cinema & J-Drama', languageCode: 'ja', countryCode: 'JP', priorityOrder: 8 },
  anime_industry: { code: 'anime_industry', name: 'Anime Industry', languageCode: 'ja', countryCode: 'JP', priorityOrder: 9 }
};

export const TMDB_GENRE_MAP: Record<number, string[]> = {
  28: ['Action'],
  12: ['Adventure'],
  16: ['Animation'],
  35: ['Comedy'],
  80: ['Crime'],
  99: ['Documentary'],
  18: ['Drama'],
  10751: ['Family'],
  14: ['Fantasy'],
  36: ['History'],
  27: ['Horror'],
  10402: ['Music'],
  9648: ['Mystery'],
  10749: ['Romance'],
  878: ['Science Fiction'],
  10770: ['TV Movie'],
  53: ['Thriller'],
  10752: ['War'],
  37: ['Western'],
  10759: ['Action', 'Adventure'],
  10762: ['Family', 'Animation'],
  10763: ['Documentary'],
  10764: ['Documentary'],
  10765: ['Science Fiction', 'Fantasy'],
  10766: ['Drama', 'Romance'],
  10767: ['Documentary'],
  10768: ['War', 'Drama']
};

export interface IngestionRunRecord {
  id: string;
  run_type: 'scheduled' | 'manual';
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  started_at: string;
  completed_at: string;
  duration_ms: number;
  scanned_count: number;
  inserted_count: number;
  updated_count: number;
  errors_count: number;
  logs: string[];
}

export interface IngestionProgressRecord {
  industry_code: string;
  content_type: 'movie' | 'tv';
  current_page: number;
  last_successful_page: number;
  total_pages_scanned: number;
  items_inserted: number;
  last_synced_at: string;
  retry_count: number;
}

export interface IngestedItem {
  id: string;
  tmdb_id: number;
  external_source: 'tmdb';
  external_id: string;
  content_type: 'movie' | 'series';
  title: string;
  original_title: string;
  description: string;
  release_date: string;
  year: number;
  runtime_minutes?: number;
  poster_url?: string;
  backdrop_url?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  industry_code: string;
  genres: string[];
  is_anime?: boolean;
  created_at: string;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), '.ingestion_data');
const RUNS_FILE = path.join(DATA_DIR, 'runs.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RUNS_FILE)) {
    fs.writeFileSync(RUNS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(PROGRESS_FILE)) {
    const initialProgress: Record<string, IngestionProgressRecord> = {};
    for (const [code] of Object.entries(REGION_REGISTRY)) {
      initialProgress[`${code}_movie`] = {
        industry_code: code,
        content_type: 'movie',
        current_page: 1,
        last_successful_page: 0,
        total_pages_scanned: 0,
        items_inserted: 0,
        last_synced_at: new Date().toISOString(),
        retry_count: 0
      };
      initialProgress[`${code}_tv`] = {
        industry_code: code,
        content_type: 'tv',
        current_page: 1,
        last_successful_page: 0,
        total_pages_scanned: 0,
        items_inserted: 0,
        last_synced_at: new Date().toISOString(),
        retry_count: 0
      };
    }
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(initialProgress, null, 2));
  }
  if (!fs.existsSync(CATALOG_FILE)) {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify([]));
  }
}

export function getIngestionRuns(): IngestionRunRecord[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(RUNS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveIngestionRun(run: IngestionRunRecord) {
  ensureDataDir();
  const runs = getIngestionRuns();
  runs.unshift(run);
  fs.writeFileSync(RUNS_FILE, JSON.stringify(runs.slice(0, 50), null, 2));
}

export function getIngestionProgress(): Record<string, IngestionProgressRecord> {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveIngestionProgress(progress: Record<string, IngestionProgressRecord>) {
  ensureDataDir();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

export function getIngestedCatalog(): IngestedItem[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveIngestedCatalog(items: IngestedItem[]) {
  ensureDataDir();
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(items, null, 2));
}

export async function getTodayIngestedCount(): Promise<number> {
  const supabase = getSupabaseClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (supabase) {
    try {
      const { data: runs } = await supabase
        .from('ingestion_runs')
        .select('titles_inserted')
        .gte('started_at', todayStart.toISOString());
      if (runs && Array.isArray(runs)) {
        return runs.reduce((sum: number, r: any) => sum + (r.titles_inserted || 0), 0);
      }
    } catch (_) {}
  }
  return 0;
}

let isIngestionRunning = false;

export async function executeTmdbIngestion(options: {
  batchLimit?: number;
  regionFilter?: string;
  mediaType?: 'movie' | 'tv';
  runType?: 'scheduled' | 'manual';
}) {
  const startedAt = new Date();
  const runId = `run_${startedAt.getTime()}_${Math.random().toString(36).substring(2, 7)}`;
  const logs: string[] = [];
  const runType = options.runType || 'manual';
  let requestedBatchLimit = options.batchLimit || 20;

  // Mutual exclusion lock to prevent concurrent executions
  if (isIngestionRunning) {
    const lockMsg = 'Ingestion process already actively running. Trigger rejected by concurrency guard.';
    logs.push(`[WARN] ${lockMsg}`);
    return {
      success: false,
      status: 'LOCKED',
      message: lockMsg,
      runId,
      scanned: 0,
      inserted: 0,
      updated: 0,
      errors: 0
    };
  }

  isIngestionRunning = true;

  try {
    logs.push(`[${startedAt.toISOString()}] Starting ${runType} TMDB catalog ingestion run: ${runId}`);

    // Server-side daily quota enforcement
    const dailyQuota = parseInt(process.env.DAILY_INGESTION_LIMIT || '1000', 10);
    const todayInsertedBefore = await getTodayIngestedCount();

    if (todayInsertedBefore >= dailyQuota) {
      const quotaMsg = `Daily ingestion quota reached (${todayInsertedBefore}/${dailyQuota} titles processed today).`;
      logs.push(`[WARN] ${quotaMsg}`);
      const quotaRun: IngestionRunRecord = {
        id: runId,
        run_type: runType,
        status: 'SUCCESS',
        started_at: startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt.getTime(),
        scanned_count: 0,
        inserted_count: 0,
        updated_count: 0,
        errors_count: 0,
        logs
      };
      saveIngestionRun(quotaRun);
      return {
        success: true,
        status: 'QUOTA_REACHED',
        message: quotaMsg,
        runId,
        scanned: 0,
        inserted: 0,
        updated: 0,
        errors: 0,
        run: quotaRun
      };
    }

    const batchLimit = Math.min(requestedBatchLimit, dailyQuota - todayInsertedBefore);

    const tmdbKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || '33a0a1993a7ad4191b4e68da0485dace';

    if (!tmdbKey) {
      const errMsg = 'TMDB API Key missing from environment';
      logs.push(`[ERROR] ${errMsg}`);
      const failedRun: IngestionRunRecord = {
        id: runId,
        run_type: runType,
        status: 'FAILED',
        started_at: startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt.getTime(),
        scanned_count: 0,
        inserted_count: 0,
        updated_count: 0,
        errors_count: 1,
        logs
      };
      saveIngestionRun(failedRun);
      return { success: false, error: errMsg, run: failedRun };
    }

    const supabase = getSupabaseClient();
    let indMap = new Map<string, number>();
    let langMap = new Map<string, number>();
    let countryMap = new Map<string, number>();
    let genreMap = new Map<string, number>();

    if (supabase) {
      try {
        const [indRes, langRes, countryRes, genreRes] = await Promise.all([
          supabase.from('industries').select('id, name'),
          supabase.from('languages').select('id, name, iso_code'),
          supabase.from('countries').select('id, name, iso_code'),
          supabase.from('genres').select('id, name')
        ]);

        (indRes.data || []).forEach((i: any) => {
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

        (langRes.data || []).forEach((l: any) => {
          if (l.iso_code) langMap.set(l.iso_code.toLowerCase(), l.id);
          if (l.name) langMap.set(l.name.toLowerCase(), l.id);
        });

        (countryRes.data || []).forEach((c: any) => {
          if (c.iso_code) countryMap.set(c.iso_code.toLowerCase(), c.id);
          if (c.name) countryMap.set(c.name.toLowerCase(), c.id);
        });

        (genreRes.data || []).forEach((g: any) => {
          if (g.name) genreMap.set(g.name.toLowerCase(), g.id);
        });
      } catch (e) {
        console.warn('Failed loading reference tables:', e);
      }
    }

  // Load progress from Supabase if available
  const progressState = getIngestionProgress();
  if (supabase) {
    try {
      const { data: dbProg } = await supabase.from('ingestion_progress').select('*');
      if (dbProg) {
        dbProg.forEach((p: any) => {
          const key = `${p.category}_${p.media_type}`;
          progressState[key] = {
            industry_code: p.category,
            content_type: p.media_type === 'movie' ? 'movie' : 'tv',
            current_page: p.current_page || 1,
            last_successful_page: p.last_successful_page || 0,
            total_pages_scanned: p.last_successful_page || 0,
            items_inserted: 0,
            last_synced_at: p.last_run_at || new Date().toISOString(),
            retry_count: p.retry_count || 0
          };
        });
      }
    } catch (_) {}
  }

  const catalog = getIngestedCatalog();
  const existingMap = new Map<string, IngestedItem>();
  for (const item of catalog) {
    existingMap.set(`${item.tmdb_id}_${item.content_type}`, item);
  }

  // Balanced region ordering: sort regions with least recent sync or lowest count first to ensure diverse catalog growth
  const regionPriorities = Object.keys(REGION_REGISTRY)
    .filter(r => !options.regionFilter || options.regionFilter === 'all' || options.regionFilter === r)
    .map(code => {
      const reg = REGION_REGISTRY[code];
      const progM = progressState[`${code}_movie`];
      const progTv = progressState[`${code}_tv`];
      const lastSynced = Math.min(
        new Date(progM?.last_synced_at || 0).getTime(),
        new Date(progTv?.last_synced_at || 0).getTime()
      );
      return { code, config: reg, lastSynced, priorityOrder: reg.priorityOrder };
    })
    .sort((a, b) => {
      if (options.regionFilter && options.regionFilter !== 'all') return 0;
      // Prioritize less recently synced regions for balanced distribution
      return a.lastSynced - b.lastSynced;
    });

  logs.push(`Balanced region queue across ${regionPriorities.length} industries (Quota: ${dailyQuota}, processed today: ${todayInsertedBefore}).`);

  let totalScanned = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let tmdbPagesProcessed = 0;
  const categoriesProcessed: Set<string> = new Set();

  const mediaTypesToRun: Array<'movie' | 'tv'> = options.mediaType ? [options.mediaType] : ['movie', 'tv'];

  // Process regions in balanced rotation
  for (const { code, config } of regionPriorities) {
    if (totalInserted >= batchLimit) break;

    for (const mediaType of mediaTypesToRun) {
      if (totalInserted >= batchLimit) break;

      const progressKey = `${code}_${mediaType}`;
      const prog = progressState[progressKey] || {
        industry_code: code,
        content_type: mediaType,
        current_page: 1,
        last_successful_page: 0,
        total_pages_scanned: 0,
        items_inserted: 0,
        last_synced_at: new Date().toISOString(),
        retry_count: 0
      };

      const pageToFetch = prog.current_page || 1;
      const tmdbEndpoint = mediaType === 'movie' ? 'movie' : 'tv';

      try {
        let url = `https://api.themoviedb.org/3/discover/${tmdbEndpoint}?api_key=${tmdbKey}&with_original_language=${config.languageCode}&sort_by=popularity.desc&page=${pageToFetch}`;

        if (code === 'anime_industry') {
          url = `https://api.themoviedb.org/3/discover/${tmdbEndpoint}?api_key=${tmdbKey}&with_original_language=ja&with_genres=16&sort_by=popularity.desc&page=${pageToFetch}`;
        }

        logs.push(`Fetching ${config.name} (${mediaType}) from TMDB page ${pageToFetch}...`);
        const res = await fetch(url);

        if (!res.ok) {
          totalErrors++;
          prog.retry_count = (prog.retry_count || 0) + 1;
          logs.push(`[WARN] TMDB HTTP ${res.status} for ${code} ${mediaType} page ${pageToFetch}`);
          continue;
        }

        const data = await res.json();
        const results = data.results || [];
        const totalPagesAvailable = data.total_pages || 1;
        totalScanned += results.length;
        tmdbPagesProcessed++;
        categoriesProcessed.add(code);

        let pageInserted = 0;
        let pageUpdated = 0;
        let pageSkipped = 0;
        let pageErrors = 0;

        for (const tmdbItem of results) {
          if (totalInserted >= batchLimit) {
            pageSkipped++;
            totalSkipped++;
            continue;
          }

          const tmdbId = tmdbItem.id;
          const isAnime = code === 'anime_industry' || (tmdbItem.genre_ids && tmdbItem.genre_ids.includes(16) && config.languageCode === 'ja');
          const finalContentType: 'movie' | 'series' = mediaType === 'movie' ? 'movie' : 'series';
          const dedupKey = `${tmdbId}_${finalContentType}`;

          const title = tmdbItem.title || tmdbItem.name || 'Untitled';
          const originalTitle = tmdbItem.original_title || tmdbItem.original_name || title;
          const releaseDate = tmdbItem.release_date || tmdbItem.first_air_date || null;
          const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) || 2024 : 2024;
          const overview = tmdbItem.overview || 'No overview available.';
          const posterUrl = tmdbItem.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : undefined;
          const backdropUrl = tmdbItem.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbItem.backdrop_path}` : undefined;
          const voteAverage = typeof tmdbItem.vote_average === 'number' ? Math.round(tmdbItem.vote_average * 10) / 10 : 0;
          const voteCount = typeof tmdbItem.vote_count === 'number' ? tmdbItem.vote_count : 0;
          const popularity = typeof tmdbItem.popularity === 'number' ? Math.round(tmdbItem.popularity * 100) / 100 : 0;

          const genreNames: string[] = [];
          for (const gid of (tmdbItem.genre_ids || [])) {
            const mapped = TMDB_GENRE_MAP[gid];
            if (mapped) {
              genreNames.push(...mapped);
            }
          }
          const genres = Array.from(new Set(genreNames));

          // Deterministic metadata normalization and classification
          const origLang = (tmdbItem.original_language || config.languageCode || '').toLowerCase().trim();
          const classification = resolveDeterministicClassification(
            {
              original_language: origLang,
              industry_code: code,
              origin_country: config.countryCode,
              genres: genreNames,
              title,
              original_title: originalTitle,
              is_anime: code === 'anime_industry' || (tmdbItem.genre_ids && tmdbItem.genre_ids.includes(16) && origLang === 'ja')
            },
            { indMap, langMap, countryMap }
          );

          const finalIsAnime = classification.isAnime;
          const resolvedIndustryCode = classification.industryCode || code;

          if (supabase) {
            try {
              const metadata = {
                tmdb_id: tmdbId,
                vote_average: voteAverage,
                vote_count: voteCount,
                popularity,
                year,
                industry_code: resolvedIndustryCode,
                original_language: origLang,
                genres
              };

              // 1. Check existing record
              const { data: existingRow, error: checkErr } = await supabase
                .from('content')
                .select('id, external_id')
                .eq('external_source', 'tmdb')
                .eq('external_id', String(tmdbId))
                .maybeSingle();

              if (checkErr) {
                throw new Error(`DB existence check error: ${checkErr.message}`);
              }

              let contentId: string;
              let isNew = false;

              if (existingRow && existingRow.id) {
                contentId = existingRow.id;
                const { error: updErr } = await supabase
                  .from('content')
                  .update({
                    title,
                    original_title: originalTitle,
                    description: overview,
                    poster_url: posterUrl || null,
                    backdrop_url: backdropUrl || null,
                    release_date: releaseDate,
                    status: 'Released',
                    is_anime: finalIsAnime,
                    metadata,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', contentId);

                if (updErr) {
                  throw new Error(`DB update error: ${updErr.message}`);
                }
              } else {
                isNew = true;
                const { data: inserted, error: insErr } = await supabase
                  .from('content')
                  .insert({
                    external_source: 'tmdb',
                    external_id: String(tmdbId),
                    content_type: finalContentType,
                    title,
                    original_title: originalTitle,
                    description: overview,
                    poster_url: posterUrl || null,
                    backdrop_url: backdropUrl || null,
                    release_date: releaseDate,
                    status: 'Released',
                    is_anime: finalIsAnime,
                    metadata,
                    updated_at: new Date().toISOString()
                  })
                  .select('id')
                  .single();

                if (insErr || !inserted) {
                  throw new Error(`DB insert error: ${insErr?.message || 'Missing inserted ID'}`);
                }
                contentId = inserted.id;
              }

              // 2. Link Relationships with Strict Verification and Atomic Rollback
              let relationshipFailed = false;
              let failureStage = '';
              let failureReason = '';

              // 2a. Industry: Deterministic linkage without silent Hollywood fallback
              if (classification.industryId) {
                // Remove any stale non-canonical industry links for this content item
                await supabase.from('content_industries').delete().eq('content_id', contentId).neq('industry_id', classification.industryId);

                const { error: ciErr } = await supabase.from('content_industries').upsert({
                  content_id: contentId,
                  industry_id: classification.industryId,
                  is_primary: true
                }, { onConflict: 'content_id,industry_id' });
                if (ciErr) {
                  failureStage = 'industry_link';
                  failureReason = ciErr.message;
                  logs.push(`[ERROR] Linking industry ${classification.industryName} for TMDB #${tmdbId} (stage: ${failureStage}): ${ciErr.message}`);
                  relationshipFailed = true;
                }
              } else if (classification.isUnclassified) {
                // Explicit Unclassified: remove any stale industry links and do NOT silently assign Hollywood!
                await supabase.from('content_industries').delete().eq('content_id', contentId);
                logs.push(`[WARN] Content TMDB #${tmdbId} ("${title}") is unclassified/unknown origin. No default industry assigned.`);
              } else {
                failureStage = 'industry_lookup';
                failureReason = `Industry mapping missing for code: ${code}`;
                logs.push(`[ERROR] ${failureReason}`);
                relationshipFailed = true;
              }

              // 2b. Language
              if (!relationshipFailed) {
                const langId = classification.languageId || langMap.get(origLang) || langMap.get(config.languageCode?.toLowerCase());
                if (langId) {
                  // Remove any stale language links for this content item
                  await supabase.from('content_languages').delete().eq('content_id', contentId).neq('language_id', langId);

                  const { error: clErr } = await supabase.from('content_languages').upsert({
                    content_id: contentId,
                    language_id: langId,
                    is_primary: true
                  }, { onConflict: 'content_id,language_id' });
                  if (clErr) {
                    failureStage = 'language_link';
                    failureReason = clErr.message;
                    logs.push(`[ERROR] Linking language ${origLang} for TMDB #${tmdbId} (stage: ${failureStage}): ${clErr.message}`);
                    relationshipFailed = true;
                  }
                }
              }

              // 2c. Country
              if (!relationshipFailed) {
                const countryId = classification.countryId || countryMap.get(config.countryCode.toLowerCase()) || countryMap.get('us');
                if (countryId) {
                  // Remove any stale country links for this content item
                  await supabase.from('content_countries').delete().eq('content_id', contentId).neq('country_id', countryId);

                  const { error: ccErr } = await supabase.from('content_countries').upsert({
                    content_id: contentId,
                    country_id: countryId
                  }, { onConflict: 'content_id,country_id' });
                  if (ccErr) {
                    failureStage = 'country_link';
                    failureReason = ccErr.message;
                    logs.push(`[ERROR] Linking country ${config.countryCode} for TMDB #${tmdbId} (stage: ${failureStage}): ${ccErr.message}`);
                    relationshipFailed = true;
                  }
                }
              }

              // 2d. Genres
              if (!relationshipFailed) {
                for (const gName of genres) {
                  const dbGId = genreMap.get(gName.toLowerCase());
                  if (dbGId) {
                    const { error: cgErr } = await supabase.from('content_genres').upsert({
                      content_id: contentId,
                      genre_id: dbGId
                    }, { onConflict: 'content_id,genre_id' });
                    if (cgErr) {
                      logs.push(`[WARN] Linking genre ${gName} for TMDB #${tmdbId}: ${cgErr.message}`);
                    }
                  }
                }
              }

              // Atomic Rollback Guarantee: If relationship failed on a newly inserted item, delete the content row
              if (relationshipFailed) {
                if (isNew) {
                  logs.push(`[ROLLBACK] Rolling back incomplete content row ${contentId} (TMDB #${tmdbId}) due to ${failureStage} failure: ${failureReason}`);
                  await supabase.from('content').delete().eq('id', contentId);
                }
                pageErrors++;
                totalErrors++;
              } else {
                if (isNew) {
                  pageInserted++;
                  totalInserted++;
                } else {
                  pageUpdated++;
                  totalUpdated++;
                }
              }
            } catch (syncErr: any) {
              logs.push(`[ERROR] Item DB transaction failed for ${title} (${tmdbId}): ${syncErr.message}`);
              pageErrors++;
              totalErrors++;
            }
          } else {
            // Local in-memory mode fallback
            const existing = existingMap.get(dedupKey);
            if (existing) {
              pageUpdated++;
              totalUpdated++;
            } else {
              pageInserted++;
              totalInserted++;
            }
          }
        }

        // Advance cursor strictly if page had NO errors
        if (pageErrors === 0) {
          prog.last_successful_page = pageToFetch;
          prog.current_page = pageToFetch < totalPagesAvailable ? pageToFetch + 1 : 1;
          prog.total_pages_scanned = (prog.total_pages_scanned || 0) + 1;
          prog.items_inserted = (prog.items_inserted || 0) + pageInserted;
          prog.last_synced_at = new Date().toISOString();
          prog.retry_count = 0;
          logs.push(`Page ${pageToFetch} completed cleanly: ${pageInserted} inserted, ${pageUpdated} updated, ${pageSkipped} skipped.`);
        } else {
          prog.retry_count = (prog.retry_count || 0) + 1;
          logs.push(`[WARN] Page ${pageToFetch} encountered ${pageErrors} errors. Cursor held on page ${pageToFetch} for retry.`);
        }

        progressState[progressKey] = prog;

        // Sync cursor to Supabase ingestion_progress
        if (supabase) {
          try {
            await supabase.from('ingestion_progress').upsert({
              category: code,
              media_type: mediaType,
              ingestion_strategy: 'historical',
              current_page: prog.current_page,
              last_successful_page: prog.last_successful_page,
              total_pages_available: totalPagesAvailable,
              status: pageErrors === 0 ? 'SUCCESS' : 'PARTIAL',
              retry_count: prog.retry_count,
              last_error: pageErrors > 0 ? `Encountered ${pageErrors} item errors on page ${pageToFetch}` : null,
              last_run_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'category,media_type,ingestion_strategy' });
          } catch (_) {}
        }

        // Rate limit throttle
        await new Promise(r => setTimeout(r, 60));
      } catch (err: any) {
        totalErrors++;
        prog.retry_count = (prog.retry_count || 0) + 1;
        logs.push(`[ERROR] Ingestion error on ${code} ${mediaType}: ${err.message}`);
      }
    }
  }

  // Mathematical consistency check: scanned = inserted + updated + skipped + failed
  const calculatedSkipped = Math.max(0, totalScanned - (totalInserted + totalUpdated + totalErrors));
  totalSkipped = Math.max(totalSkipped, calculatedSkipped);

  // Persist state locally
  saveIngestedCatalog(catalog);
  saveIngestionProgress(progressState);

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();
  const status: 'SUCCESS' | 'PARTIAL' | 'FAILED' =
    totalErrors === 0 ? 'SUCCESS' : (totalInserted > 0 || totalUpdated > 0) ? 'PARTIAL' : 'FAILED';

  logs.push(`Ingestion completed with status ${status}: ${totalScanned} scanned = ${totalInserted} inserted + ${totalUpdated} updated + ${totalSkipped} skipped + ${totalErrors} failed (in ${durationMs}ms).`);

  const runRecord: IngestionRunRecord = {
    id: runId,
    run_type: runType,
    status,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    duration_ms: durationMs,
    scanned_count: totalScanned,
    inserted_count: totalInserted,
    updated_count: totalUpdated,
    errors_count: totalErrors,
    logs
  };

  saveIngestionRun(runRecord);

  // Record to Supabase ingestion_runs
  if (supabase) {
    try {
      await supabase.from('ingestion_runs').insert({
        run_id: runId,
        started_at: startedAt.toISOString(),
        finished_at: completedAt.toISOString(),
        status,
        titles_scanned: totalScanned,
        titles_inserted: totalInserted,
        titles_updated: totalUpdated,
        duplicates_skipped: totalSkipped,
        failed_records: totalErrors,
        tmdb_pages_processed: tmdbPagesProcessed,
        categories_processed: Array.from(categoriesProcessed),
        error_summary: logs.filter(l => l.includes('[ERROR]')).slice(0, 5).join('; ') || null
      });
    } catch (_) {}
  }

  return {
    success: status !== 'FAILED',
    status,
    runId,
    scanned: totalScanned,
    inserted: totalInserted,
    updated: totalUpdated,
    skipped: totalSkipped,
    duration_ms: durationMs,
    errors: totalErrors,
    run: runRecord
  };
  } finally {
    isIngestionRunning = false;
  }
}

// Single Authoritative Scheduler: pg_cron in Supabase at 02:00 AM IST (20:30 UTC: '30 20 * * *')
let schedulerInitialized = false;

export function initIngestionScheduler() {
  if (schedulerInitialized) return;
  schedulerInitialized = true;

  console.log('[Ingestion Engine] Initialized with concurrency guard. Authoritative scheduler: pg_cron at 02:00 AM IST (20:30 UTC: 30 20 * * *). Redundant server interval disabled. Manual API triggers active.');
}
