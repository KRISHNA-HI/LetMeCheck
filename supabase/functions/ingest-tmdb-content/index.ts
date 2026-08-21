import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingestion-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

interface RegionConfig {
  name: string;
  languageCode: string;
  countryCode: string;
  defaultTimezone: string;
  priorityOrder: number;
}

// Open-ended regional registry with priority sequence (no artificial catalog caps)
const REGION_REGISTRY: Record<string, RegionConfig> = {
  hollywood: { name: 'Hollywood (English)', languageCode: 'en', countryCode: 'US', defaultTimezone: 'America/New_York', priorityOrder: 1 },
  bollywood: { name: 'Bollywood (Hindi)', languageCode: 'hi', countryCode: 'IN', defaultTimezone: 'Asia/Kolkata', priorityOrder: 2 },
  tollywood: { name: 'Tollywood (Telugu)', languageCode: 'te', countryCode: 'IN', defaultTimezone: 'Asia/Kolkata', priorityOrder: 3 },
  kollywood: { name: 'Kollywood (Tamil)', languageCode: 'ta', countryCode: 'IN', defaultTimezone: 'Asia/Kolkata', priorityOrder: 4 },
  mollywood: { name: 'Mollywood (Malayalam)', languageCode: 'ml', countryCode: 'IN', defaultTimezone: 'Asia/Kolkata', priorityOrder: 5 },
  sandalwood: { name: 'Sandalwood (Kannada)', languageCode: 'kn', countryCode: 'IN', defaultTimezone: 'Asia/Kolkata', priorityOrder: 6 },
  korean_cinema: { name: 'Korean Cinema (K-Drama / Movies)', languageCode: 'ko', countryCode: 'KR', defaultTimezone: 'Asia/Seoul', priorityOrder: 7 },
  japanese_cinema: { name: 'Japanese Cinema (Live Action)', languageCode: 'ja', countryCode: 'JP', defaultTimezone: 'Asia/Tokyo', priorityOrder: 8 },
  anime_industry: { name: 'Anime (Japanese Animation)', languageCode: 'ja', countryCode: 'JP', defaultTimezone: 'Asia/Tokyo', priorityOrder: 9 }
};

const TMDB_GENRE_MAP: Record<number, string[]> = {
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = new Date();
  const runId = `run_${startedAt.getTime()}_${Math.random().toString(36).substring(2, 7)}`;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const tmdbApiKey = Deno.env.get('TMDB_API_KEY') || Deno.env.get('VITE_TMDB_API_KEY') || '';
  const expectedSecret = Deno.env.get('INGESTION_SECRET') || '';

  const ADMIN_EMAIL = 'krishnavasudev099@gmail.com';

  // Auth validation
  const authHeader = req.headers.get('Authorization') || '';
  const customHeader = req.headers.get('x-ingestion-secret') || '';
  const token = authHeader.replace('Bearer ', '').trim() || customHeader;

  let isAuthorized = false;

  // 1. Verify service key or internal ingestion secret
  if (token && (
    (expectedSecret && token === expectedSecret) ||
    (supabaseServiceKey && token === supabaseServiceKey)
  )) {
    isAuthorized = true;
  }

  // 2. If not secret/service key, verify if token is valid Admin user session
  if (!isAuthorized && token && supabaseUrl && supabaseServiceKey) {
    try {
      const verifyClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data: { user } } = await verifyClient.auth.getUser(token);
      if (user?.email && user.email.trim().toLowerCase() === ADMIN_EMAIL) {
        isAuthorized = true;
      }
    } catch (_) {}
  }

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Access denied. Administrator authorization required.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!tmdbApiKey) {
    return new Response(
      JSON.stringify({ error: 'TMDB API key not configured (TMDB_API_KEY)' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Configurable daily limit from environment or request body (no hardcoded cap)
  const defaultEnvLimit = parseInt(Deno.env.get('DAILY_INGESTION_LIMIT') || '1000', 10);
  let dailyLimit = defaultEnvLimit;
  let forceCategory: string | null = null;
  let forceMediaType: 'movie' | 'tv' | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.batch_limit === 'number') {
      dailyLimit = Math.max(1, body.batch_limit);
    } else if (typeof body.batchLimit === 'number') {
      dailyLimit = Math.max(1, body.batchLimit);
    } else if (typeof body.limit === 'number') {
      dailyLimit = Math.max(1, body.limit);
    }
    if (body.category || body.force_category || body.region_filter) {
      forceCategory = body.category || body.force_category || body.region_filter;
    }
    if (body.media_type || body.force_media_type) {
      forceMediaType = body.media_type || body.force_media_type;
    }
  } catch (_) {}

  // 1. Initial Ingestion Run Record
  try {
    await adminClient.from('ingestion_runs').insert({
      run_id: runId,
      started_at: startedAt.toISOString(),
      status: 'RUNNING',
      titles_scanned: 0,
      titles_inserted: 0,
      titles_updated: 0,
      duplicates_skipped: 0,
      failed_records: 0,
      tmdb_pages_processed: 0,
      categories_processed: []
    });
  } catch (_) {}

  let titlesScanned = 0;
  let titlesInserted = 0;
  let titlesUpdated = 0;
  let duplicatesSkipped = 0;
  let failedRecords = 0;
  let tmdbPagesProcessed = 0;
  const categoriesProcessed: Set<string> = new Set();
  const errors: string[] = [];

  try {
  // 2. Fetch Reference Dictionaries safely matching database schema
  const { data: industriesData } = await adminClient.from('industries').select('id, name');
  const { data: languagesData } = await adminClient.from('languages').select('id, name, iso_code');
  const { data: genresData } = await adminClient.from('genres').select('id, name');
  const { data: countriesData } = await adminClient.from('countries').select('id, name, iso_code');

  const INDUSTRY_NAME_MAP: Record<string, string> = {
    hollywood: 'Hollywood',
    bollywood: 'Bollywood',
    tollywood: 'Tollywood',
    kollywood: 'Kollywood',
    mollywood: 'Mollywood',
    sandalwood: 'Sandalwood',
    korean_cinema: 'Korean Cinema & K-Drama',
    japanese_cinema: 'Japanese Cinema & J-Drama',
    anime_industry: 'Anime Industry'
  };

  const industryMap = new Map<string, string | number>();
  (industriesData || []).forEach((i: any) => {
    industryMap.set(i.name.toLowerCase(), i.id);
    // Also map known slug keys
    for (const [key, name] of Object.entries(INDUSTRY_NAME_MAP)) {
      if (name.toLowerCase() === i.name.toLowerCase()) {
        industryMap.set(key, i.id);
      }
    }
  });

  const languageMap = new Map<string, string | number>();
  (languagesData || []).forEach((l: any) => {
    if (l.iso_code) languageMap.set(l.iso_code.toLowerCase(), l.id);
    if (l.name) languageMap.set(l.name.toLowerCase(), l.id);
  });

  const genreMap = new Map<string, string | number>();
  (genresData || []).forEach((g: any) => genreMap.set(g.name.toLowerCase(), g.id));

  const countryMap = new Map<string, string | number>();
  (countriesData || []).forEach((c: any) => {
    if (c.iso_code) countryMap.set(c.iso_code.toLowerCase(), c.id);
    if (c.name) countryMap.set(c.name.toLowerCase(), c.id);
  });

    // 3. Fetch Ingestion Progress Cursors
    let progressRows: any[] = [];
    try {
      const { data } = await adminClient.from('ingestion_progress').select('*');
      if (data) progressRows = data;
    } catch (_) {}

    const progressMap = new Map<string, any>();
    progressRows.forEach((p: any) => {
      progressMap.set(`${p.category}_${p.media_type}_${p.ingestion_strategy || 'historical'}`, p);
    });

    // Categories to process (ordered by priority or user filter)
    const categoryKeys = forceCategory 
      ? [forceCategory] 
      : Object.keys(REGION_REGISTRY).sort((a, b) => REGION_REGISTRY[a].priorityOrder - REGION_REGISTRY[b].priorityOrder);

    // Continue open-ended cursor ingestion across all categories until batch capacity is satisfied
    for (const catCode of categoryKeys) {
      if (titlesScanned >= dailyLimit) break;
      const catConfig = REGION_REGISTRY[catCode];
      if (!catConfig) continue;

      const mediaTypes: Array<'movie' | 'tv'> = forceMediaType ? [forceMediaType] : ['movie', 'tv'];

      for (const mediaType of mediaTypes) {
        if (titlesScanned >= dailyLimit) break;

        const progressKey = `${catCode}_${mediaType}_historical`;
        const currentProgress = progressMap.get(progressKey) || {
          category: catCode,
          media_type: mediaType,
          ingestion_strategy: 'historical',
          current_page: 1,
          last_successful_page: 0,
          total_pages_available: 1,
          retry_count: 0
        };

        const pageToFetch = currentProgress.current_page || 1;
        categoriesProcessed.add(catCode);

        // Fetch page from TMDB with rate limit safety
        const tmdbUrl = new URL(`https://api.themoviedb.org/3/discover/${mediaType}`);
        const isJwt = tmdbApiKey.startsWith('eyJ');
        const standardApiKey = Deno.env.get('VITE_TMDB_API_KEY') || (!isJwt ? tmdbApiKey : '');

        if (standardApiKey) {
          tmdbUrl.searchParams.set('api_key', standardApiKey);
        }
        tmdbUrl.searchParams.set('with_original_language', catConfig.languageCode);
        if (catCode === 'anime_industry') {
          tmdbUrl.searchParams.set('with_genres', '16');
        }
        tmdbUrl.searchParams.set('page', pageToFetch.toString());
        tmdbUrl.searchParams.set('sort_by', 'popularity.desc');
        tmdbUrl.searchParams.set('include_adult', 'false');

        // Throttle request slightly to stay comfortably within rate limits
        await new Promise(r => setTimeout(r, 80));

        let tmdbRes: Response;
        try {
          const fetchHeaders: Record<string, string> = { 'Accept': 'application/json' };
          if (isJwt) {
            fetchHeaders['Authorization'] = `Bearer ${tmdbApiKey}`;
          }
          tmdbRes = await fetch(tmdbUrl.toString(), { headers: fetchHeaders });
        } catch (fetchErr: any) {
          errors.push(`Network error fetching TMDB for ${catCode} ${mediaType} p.${pageToFetch}: ${fetchErr.message}`);
          failedRecords++;
          continue;
        }

        if (!tmdbRes.ok) {
          const errText = await tmdbRes.text();
          errors.push(`TMDB HTTP ${tmdbRes.status} for ${catCode} ${mediaType} p.${pageToFetch}: ${errText.substring(0, 100)}`);
          failedRecords++;
          continue;
        }

        const data = await tmdbRes.json();
        const results: any[] = data.results || [];
        const totalPages = data.total_pages || 1;
        tmdbPagesProcessed++;

        for (const item of results) {
          if (titlesScanned >= dailyLimit) break;
          titlesScanned++;

          try {
            const tmdbId = item.id;
            const title = item.title || item.name || 'Untitled';
            const originalTitle = item.original_title || item.original_name || title;
            const overview = item.overview || '';
            const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
            const backdropPath = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null;
            const releaseDate = item.release_date || item.first_air_date || null;
            const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : null;
            const ratingAvg = typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 0.0;
            const ratingCount = item.vote_count || 0;
            const popularity = typeof item.popularity === 'number' ? Math.round(item.popularity * 100) / 100 : 0.0;

            const standardContentType = mediaType === 'movie' ? 'movie' : 'tv_series';

            // Check if content row already exists by (external_source, external_id)
            const { data: existingRow } = await adminClient
              .from('content')
              .select('id, external_id, content_type')
              .eq('external_source', 'tmdb')
              .eq('external_id', String(tmdbId))
              .maybeSingle();

            let contentId: string;

            let genresList: string[] = [];
            for (const gId of (item.genre_ids || [])) {
              const mapped = TMDB_GENRE_MAP[gId];
              if (mapped) genresList.push(...mapped);
            }
            genresList = Array.from(new Set(genresList));

            const contentMetadata = {
              tmdb_id: tmdbId,
              vote_average: ratingAvg,
              vote_count: ratingCount,
              popularity,
              year,
              industry_code: catCode,
              original_language: item.original_language || catConfig.languageCode,
              genres: genresList
            };

            if (existingRow) {
              contentId = existingRow.id;
              await adminClient.from('content').update({
                title,
                original_title: originalTitle,
                description: overview,
                poster_url: posterPath || undefined,
                backdrop_url: backdropPath || undefined,
                release_date: releaseDate,
                is_anime: catCode === 'anime_industry',
                metadata: contentMetadata,
                updated_at: new Date().toISOString()
              }).eq('id', contentId);

              titlesUpdated++;
            } else {
              const { data: inserted, error: insErr } = await adminClient.from('content').insert({
                external_source: 'tmdb',
                external_id: String(tmdbId),
                content_type: standardContentType,
                title,
                original_title: originalTitle,
                description: overview,
                poster_url: posterPath,
                backdrop_url: backdropPath,
                release_date: releaseDate,
                status: 'Released',
                is_anime: catCode === 'anime_industry',
                metadata: contentMetadata,
                updated_at: new Date().toISOString()
              }).select('id').single();

              if (insErr || !inserted) {
                errors.push(`Failed to insert content TMDB #${tmdbId}: ${insErr?.message}`);
                failedRecords++;
                continue;
              }

              contentId = inserted.id;
              titlesInserted++;
            }

            // Map Industry Relation
            const targetIndustryId = industryMap.get(catCode.toLowerCase()) || industryMap.get(catCode);
            if (targetIndustryId) {
              const { error: ciErr } = await adminClient.from('content_industries').upsert({
                content_id: contentId,
                industry_id: targetIndustryId,
                is_primary: true
              }, { onConflict: 'content_id,industry_id' });
              if (ciErr) {
                errors.push(`Failed linking industry for ${tmdbId}: ${ciErr.message}`);
              }
            } else {
              errors.push(`Industry lookup missing for category ${catCode} on TMDB #${tmdbId}`);
            }

            // Map Language Relation
            const langCode = (item.original_language || catConfig.languageCode || '').toLowerCase();
            const targetLangId = languageMap.get(langCode) || languageMap.get(catConfig.languageCode?.toLowerCase());
            if (targetLangId) {
              const { error: clErr } = await adminClient.from('content_languages').upsert({
                content_id: contentId,
                language_id: targetLangId,
                is_primary: true
              }, { onConflict: 'content_id,language_id' });
              if (clErr) {
                errors.push(`Failed linking language for ${tmdbId}: ${clErr.message}`);
              }
            }

            // Map Country Relation
            const targetCountryId = countryMap.get(catConfig.countryCode.toLowerCase()) || countryMap.get(catConfig.countryCode);
            if (targetCountryId) {
              const { error: ccErr } = await adminClient.from('content_countries').upsert({
                content_id: contentId,
                country_id: targetCountryId
              }, { onConflict: 'content_id,country_id' });
              if (ccErr) {
                errors.push(`Failed linking country for ${tmdbId}: ${ccErr.message}`);
              }
            }

            // Map Genres Relations
            for (const gName of genresList) {
              const dbGenreId = genreMap.get(gName.toLowerCase());
              if (dbGenreId) {
                const { error: cgErr } = await adminClient.from('content_genres').upsert({
                  content_id: contentId,
                  genre_id: dbGenreId
                }, { onConflict: 'content_id,genre_id' });
                if (cgErr) {
                  errors.push(`Failed linking genre ${gName} for ${tmdbId}: ${cgErr.message}`);
                }
              }
            }
          } catch (itemErr: any) {
            errors.push(`Error processing TMDB #${item.id}: ${itemErr.message}`);
            failedRecords++;
          }
        }

        // Advance cursor if page processing succeeded (open-ended pagination)
        const nextPage = pageToFetch < totalPages ? pageToFetch + 1 : 1;
        try {
          await adminClient.from('ingestion_progress').upsert({
            category: catCode,
            media_type: mediaType,
            ingestion_strategy: 'historical',
            current_page: nextPage,
            last_successful_page: pageToFetch,
            total_pages_available: totalPages,
            status: 'SUCCESS',
            retry_count: 0,
            last_error: null,
            last_run_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'category,media_type,ingestion_strategy' });
        } catch (_) {}
      }
    }

    const finishedAt = new Date();
    const finalStatus = failedRecords === 0 ? 'SUCCESS' : (titlesInserted > 0 || titlesUpdated > 0) ? 'PARTIAL' : 'FAILED';

    try {
      await adminClient.from('ingestion_runs').update({
        finished_at: finishedAt.toISOString(),
        status: finalStatus,
        titles_scanned: titlesScanned,
        titles_inserted: titlesInserted,
        titles_updated: titlesUpdated,
        duplicates_skipped: duplicatesSkipped,
        failed_records: failedRecords,
        tmdb_pages_processed: tmdbPagesProcessed,
        categories_processed: Array.from(categoriesProcessed),
        error_summary: errors.length > 0 ? errors.slice(0, 10).join('; ') : null
      }).eq('run_id', runId);
    } catch (_) {}

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        status: finalStatus,
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        stats: {
          scanned: titlesScanned,
          inserted: titlesInserted,
          updated: titlesUpdated,
          failed: failedRecords,
          pages: tmdbPagesProcessed,
          categories: Array.from(categoriesProcessed)
        },
        errors: errors.slice(0, 5)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (globalErr: any) {
    const finishedAt = new Date();
    return new Response(
      JSON.stringify({
        success: false,
        run_id: runId,
        status: 'FAILED',
        error: globalErr.message || 'Internal server error during TMDB ingestion'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
