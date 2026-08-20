import { createClient } from '@supabase/supabase-js';
import { getUnifiedMasterContent } from '../src/data/unifiedContentData';

export async function seedMasterCatalog() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('--- Fetching reference dictionaries from Supabase ---');
  const [indRes, langRes, countryRes, genreRes] = await Promise.all([
    client.from('industries').select('id, name'),
    client.from('languages').select('id, name, iso_code'),
    client.from('countries').select('id, name, iso_code'),
    client.from('genres').select('id, name')
  ]);

  const industries = indRes.data || [];
  const languages = langRes.data || [];
  const countries = countryRes.data || [];
  const genres = genreRes.data || [];

  const indMap = new Map<string, number>();
  industries.forEach((i: any) => {
    indMap.set(i.name.toLowerCase(), i.id);
  });
  indMap.set('hollywood', indMap.get('hollywood') || 3);
  indMap.set('bollywood', indMap.get('bollywood') || 4);
  indMap.set('tollywood', indMap.get('tollywood') || 5);
  indMap.set('kollywood', indMap.get('kollywood') || 6);
  indMap.set('mollywood', indMap.get('mollywood') || 7);
  indMap.set('sandalwood', indMap.get('sandalwood') || 8);
  indMap.set('korean_cinema', indMap.get('korean cinema & k-drama') || 9);
  indMap.set('korean cinema', indMap.get('korean cinema & k-drama') || 9);
  indMap.set('japanese_cinema', indMap.get('japanese cinema & j-drama') || 10);
  indMap.set('japanese cinema', indMap.get('japanese cinema & j-drama') || 10);
  indMap.set('anime_industry', indMap.get('anime industry') || 11);
  indMap.set('anime', indMap.get('anime industry') || 11);

  const langMap = new Map<string, number>();
  languages.forEach((l: any) => {
    if (l.iso_code) langMap.set(l.iso_code.toLowerCase(), l.id);
    if (l.name) langMap.set(l.name.toLowerCase(), l.id);
  });
  // Common aliases
  langMap.set('en', langMap.get('english') || 1);
  langMap.set('hi', langMap.get('hindi') || 2);
  langMap.set('te', langMap.get('telugu') || 3);
  langMap.set('ta', langMap.get('tamil') || 4);
  langMap.set('ml', langMap.get('malayalam') || 5);
  langMap.set('kn', langMap.get('kannada') || 6);
  langMap.set('ko', langMap.get('korean') || 7);
  langMap.set('ja', langMap.get('japanese') || 8);
  langMap.set('zh', langMap.get('mandarin') || 9);
  langMap.set('es', langMap.get('spanish') || 10);
  langMap.set('fr', langMap.get('french') || 11);

  const countryMap = new Map<string, number>();
  countries.forEach((c: any) => {
    if (c.iso_code) countryMap.set(c.iso_code.toLowerCase(), c.id);
    if (c.name) countryMap.set(c.name.toLowerCase(), c.id);
  });
  countryMap.set('us', countryMap.get('united states') || 3);
  countryMap.set('in', countryMap.get('india') || 4);
  countryMap.set('jp', countryMap.get('japan') || 5);
  countryMap.set('kr', countryMap.get('south korea') || 6);
  countryMap.set('gb', countryMap.get('united kingdom') || 7);
  countryMap.set('uk', countryMap.get('united kingdom') || 7);
  countryMap.set('cn', countryMap.get('china') || 8);
  countryMap.set('fr', countryMap.get('france') || 9);

  const genreMap = new Map<string, number>();
  genres.forEach((g: any) => {
    genreMap.set(g.name.toLowerCase(), g.id);
  });
  // Extra genre alias mapping
  genreMap.set('sci-fi', genreMap.get('science fiction') || 15);
  genreMap.set('scifi', genreMap.get('science fiction') || 15);
  genreMap.set('anime', genreMap.get('animation') || 3);

  const masterList = getUnifiedMasterContent();
  console.log(`Starting idempotent seed of ${masterList.length} master baseline records...`);

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const item of masterList) {
    try {
      const tmdbId = item.external_ids?.tmdb_id;
      const anilistId = item.external_ids?.anilist_id;
      const extSource = tmdbId ? 'tmdb' : anilistId ? 'anilist' : 'master_baseline';
      const extId = tmdbId ? String(tmdbId) : anilistId ? String(anilistId) : String(item.id);

      const isAnime = item.content_type === 'anime' ||
        item.primary_industry === 'anime_industry' ||
        (item.industries && item.industries.some((i: string) => i.toLowerCase().includes('anime')));

      let standardContentType: 'movie' | 'series' = 'movie';
      if (item.content_type === 'tv_series' || item.content_type === 'series' || item.content_type === 'tv') {
        standardContentType = 'series';
      } else if (item.content_type === 'movie') {
        standardContentType = 'movie';
      } else if (item.content_type === 'anime') {
        // Distinguish movie anime vs series anime
        standardContentType = item.runtime && item.runtime > 40 && !item.overview?.toLowerCase().includes('season') ? 'movie' : 'series';
      }

      const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : null);
      const ratingAvg = typeof item.rating_average === 'number' ? item.rating_average : item.score ? item.score / 10 : null;

      // Determine accurate regional industry code
      let industryCode = item.primary_industry?.toLowerCase() || '';
      if (!industryCode) {
        if (isAnime) {
          industryCode = 'anime_industry';
        } else if (item.industries && item.industries.length > 0) {
          const firstInd = item.industries[0].toLowerCase();
          if (firstInd.includes('hollywood')) industryCode = 'hollywood';
          else if (firstInd.includes('bollywood')) industryCode = 'bollywood';
          else if (firstInd.includes('tollywood')) industryCode = 'tollywood';
          else if (firstInd.includes('kollywood')) industryCode = 'kollywood';
          else if (firstInd.includes('mollywood')) industryCode = 'mollywood';
          else if (firstInd.includes('sandalwood')) industryCode = 'sandalwood';
          else if (firstInd.includes('korean')) industryCode = 'korean_cinema';
          else if (firstInd.includes('japanese')) industryCode = 'japanese_cinema';
          else if (firstInd.includes('anime')) industryCode = 'anime_industry';
        } else if (item.primary_language) {
          const lang = item.primary_language.toLowerCase();
          if (lang === 'en' || lang === 'english') industryCode = 'hollywood';
          else if (lang === 'hi' || lang === 'hindi') industryCode = 'bollywood';
          else if (lang === 'te' || lang === 'telugu') industryCode = 'tollywood';
          else if (lang === 'ta' || lang === 'tamil') industryCode = 'kollywood';
          else if (lang === 'ml' || lang === 'malayalam') industryCode = 'mollywood';
          else if (lang === 'kn' || lang === 'kannada') industryCode = 'sandalwood';
          else if (lang === 'ko' || lang === 'korean') industryCode = 'korean_cinema';
          else if (lang === 'ja' || lang === 'japanese') industryCode = isAnime ? 'anime_industry' : 'japanese_cinema';
        }
      }
      if (!industryCode) {
        industryCode = 'hollywood';
      }

      const primaryLang = item.primary_language?.toLowerCase() || (
        industryCode === 'hollywood' ? 'en' :
        industryCode === 'bollywood' ? 'hi' :
        industryCode === 'tollywood' ? 'te' :
        industryCode === 'kollywood' ? 'ta' :
        industryCode === 'mollywood' ? 'ml' :
        industryCode === 'sandalwood' ? 'kn' :
        industryCode === 'korean_cinema' ? 'ko' :
        industryCode === 'japanese_cinema' || industryCode === 'anime_industry' ? 'ja' : 'en'
      );

      const metadata = {
        tmdb_id: tmdbId || null,
        anilist_id: anilistId || null,
        imdb_id: item.external_ids?.imdb_id || null,
        year: item.year || (releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : null),
        vote_average: ratingAvg,
        vote_count: item.rating_count || 0,
        popularity: item.popularity || 0,
        industry_code: industryCode,
        original_language: primaryLang,
        genres: item.genres || [],
        franchise_id: item.franchise_id || null,
        franchise_name: (item as any).franchise_name || null,
        source: item.source || 'master_baseline'
      };

      const { data: upserted, error: upsertErr } = await client
        .from('content')
        .upsert({
          external_source: extSource,
          external_id: extId,
          content_type: standardContentType,
          title: item.title,
          original_title: item.original_title || item.title,
          description: item.overview || item.description || '',
          release_date: releaseDate,
          status: item.status || 'Released',
          runtime_minutes: item.runtime || null,
          poster_url: item.poster_url || (item as any).cover_url || null,
          backdrop_url: item.backdrop_url || (item as any).banner_url || null,
          trailer_url: (item as any).trailer_url || null,
          is_anime: isAnime,
          metadata,
          updated_at: new Date().toISOString()
        }, { onConflict: 'external_source,external_id' })
        .select('id, created_at, updated_at')
        .single();

      if (upsertErr || !upserted) {
        console.error(`Error upserting ${item.title} (${extId}):`, upsertErr?.message);
        errorCount++;
        continue;
      }

      const contentId = upserted.id;
      if (new Date(upserted.created_at).getTime() === new Date(upserted.updated_at).getTime()) {
        insertedCount++;
      } else {
        updatedCount++;
      }

      // Link Industry
      const targetIndId = indMap.get(industryCode);
      if (targetIndId) {
        try {
          await client.from('content_industries').upsert({
            content_id: contentId,
            industry_id: targetIndId,
            is_primary: true
          }, { onConflict: 'content_id,industry_id' });
        } catch (indErr: any) {
          console.warn(`Error linking industry for ${item.title}:`, indErr.message);
        }
      }

      // Link Language
      const langId = langMap.get(primaryLang);
      if (langId) {
        try {
          await client.from('content_languages').upsert({
            content_id: contentId,
            language_id: langId,
            is_primary: true
          }, { onConflict: 'content_id,language_id' });
        } catch (lErr: any) {
          console.warn(`Error linking language for ${item.title}:`, lErr.message);
        }
      }

      // Link Countries
      if (item.countries && Array.isArray(item.countries)) {
        for (const cCode of item.countries) {
          const cId = countryMap.get(cCode.toLowerCase());
          if (cId) {
            try {
              await client.from('content_countries').upsert({
                content_id: contentId,
                country_id: cId
              }, { onConflict: 'content_id,country_id' });
            } catch (_) {}
          }
        }
      }

      // Link Genres
      if (item.genres && Array.isArray(item.genres)) {
        for (const gName of item.genres) {
          const gId = genreMap.get(gName.toLowerCase());
          if (gId) {
            try {
              await client.from('content_genres').upsert({
                content_id: contentId,
                genre_id: gId
              }, { onConflict: 'content_id,genre_id' });
            } catch (_) {}
          }
        }
      }
    } catch (e: any) {
      console.error(`Error processing item ${item.title}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\n=== Master Baseline Seeding Completed ===`);
  console.log(`Total Scanned: ${masterList.length}`);
  console.log(`Inserted / Updated Successfully: ${insertedCount + updatedCount} (New: ${insertedCount}, Updated: ${updatedCount})`);
  console.log(`Errors: ${errorCount}`);
}

seedMasterCatalog().catch(console.error);
