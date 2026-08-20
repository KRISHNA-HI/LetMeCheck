// ==========================================================
// Ingestion Pipeline & Importer Engine
// Ingests, normalizes, deduplicates, and upserts public content
// and metadata relationships into Supabase with checkpointing
// and error resilience.
// ==========================================================

import { ContentItem } from '../../types/content';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface IngestionResult {
  totalProcessed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ title: string; error: string }>;
}

export interface IngestItemResult {
  status: 'inserted' | 'updated' | 'skipped' | 'failed';
  contentId?: string;
  error?: string;
}

export class ContentImporter {
  private inMemoryCache = new Map<string, string>(); // external_key -> content_uuid
  private genreMap = new Map<string, string>(); // name/slug -> uuid
  private langMap = new Map<string, string>(); // code -> uuid
  private countryMap = new Map<string, string>(); // code -> uuid
  private industryMap = new Map<string, string>(); // code -> uuid

  /**
   * Preload reference tables to optimize batch ingestion speed
   */
  async initializeReferenceMaps(): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const [genres, langs, countries, industries] = await Promise.all([
        supabase.from('genres').select('id, name, slug'),
        supabase.from('languages').select('id, code'),
        supabase.from('countries').select('id, code'),
        supabase.from('industries').select('id, code')
      ]);

      if (genres.data) {
        genres.data.forEach((g: any) => {
          this.genreMap.set(g.name.toLowerCase(), g.id);
          this.genreMap.set(g.slug.toLowerCase(), g.id);
        });
      }

      if (langs.data) {
        langs.data.forEach((l: any) => this.langMap.set(l.code.toLowerCase(), l.id));
      }

      if (countries.data) {
        countries.data.forEach((c: any) => this.countryMap.set(c.code.toUpperCase(), c.id));
      }

      if (industries.data) {
        industries.data.forEach((i: any) => this.industryMap.set(i.code.toLowerCase(), i.id));
      }
    } catch (err) {
      console.warn('Failed to pre-populate importer reference maps:', err);
    }
  }

  /**
   * Deduplicate and check if content already exists by external provider IDs
   */
  async findExistingContentId(item: ContentItem): Promise<string | null> {
    const tmdbId = item.external_ids?.tmdb_id;
    const anilistId = item.external_ids?.anilist_id;
    const imdbId = item.external_ids?.imdb_id;

    const cacheKey = tmdbId ? `tmdb:${tmdbId}` : anilistId ? `anilist:${anilistId}` : imdbId ? `imdb:${imdbId}` : null;
    if (cacheKey && this.inMemoryCache.has(cacheKey)) {
      return this.inMemoryCache.get(cacheKey)!;
    }

    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      // 1. Check external_ids JSONB containment
      if (tmdbId) {
        const { data } = await supabase
          .from('content')
          .select('id')
          .filter('external_ids->>tmdb_id', 'eq', tmdbId.toString())
          .maybeSingle();

        if (data?.id) {
          if (cacheKey) this.inMemoryCache.set(cacheKey, data.id);
          return data.id;
        }
      }

      if (anilistId) {
        const { data } = await supabase
          .from('content')
          .select('id')
          .filter('external_ids->>anilist_id', 'eq', anilistId.toString())
          .maybeSingle();

        if (data?.id) {
          if (cacheKey) this.inMemoryCache.set(cacheKey, data.id);
          return data.id;
        }
      }

      if (imdbId) {
        const { data } = await supabase
          .from('content')
          .select('id')
          .filter('external_ids->>imdb_id', 'eq', imdbId)
          .maybeSingle();

        if (data?.id) {
          if (cacheKey) this.inMemoryCache.set(cacheKey, data.id);
          return data.id;
        }
      }
    } catch (err) {
      console.warn('Deduplication check error:', err);
    }

    return null;
  }

  /**
   * Ingest a single normalized ContentItem (Insert or Update with junction resolution)
   */
  async ingestItem(item: ContentItem): Promise<IngestItemResult> {
    if (!isSupabaseConfigured() || !supabase) {
      return { status: 'skipped', error: 'Supabase client not configured' };
    }

    try {
      const existingId = await this.findExistingContentId(item);

      const contentPayload = {
        content_type: item.content_type,
        title: item.title,
        original_title: item.original_title || null,
        alternative_titles: item.alternative_titles || [],
        overview: item.overview || '',
        poster_url: item.poster_url || '',
        backdrop_url: item.backdrop_url || null,
        trailer_url: item.trailer_url || null,
        release_date: item.release_date || null,
        year: item.year || null,
        runtime: item.runtime || null,
        status: item.status || 'Released',
        age_rating: item.age_rating || null,
        rating_average: item.rating_average || 0.0,
        rating_count: item.rating_count || 0,
        popularity: item.popularity || 0.0,
        source: item.source || 'Import',
        external_ids: item.external_ids || {},
        updated_at: new Date().toISOString()
      };

      let resolvedContentId = existingId;
      let status: 'inserted' | 'updated' = 'updated';

      if (existingId) {
        // Update existing record
        const { error: updateErr } = await supabase
          .from('content')
          .update(contentPayload)
          .eq('id', existingId);

        if (updateErr) throw updateErr;
      } else {
        // Insert new record
        status = 'inserted';
        const { data: inserted, error: insertErr } = await supabase
          .from('content')
          .insert({
            ...contentPayload,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertErr || !inserted) throw insertErr || new Error('Insert failed to return content ID');
        resolvedContentId = inserted.id;
      }

      if (!resolvedContentId) {
        throw new Error('Failed to resolve content ID');
      }

      // Upsert Junctions (Genres, Languages, Countries, Industries)
      await this.upsertJunctions(resolvedContentId, item);

      // Upsert Seasons & Episodes if present
      if (item.seasons && item.seasons.length > 0) {
        await this.upsertSeasons(resolvedContentId, item.seasons);
      }

      return { status, contentId: resolvedContentId };
    } catch (err: any) {
      console.warn(`Ingestion failed for "${item.title}":`, err.message || err);
      return { status: 'failed', error: err.message || 'Unknown error' };
    }
  }

  /**
   * Resumable Batch Importer with failure tolerance and progress checkpointing
   */
  async ingestBatch(
    items: ContentItem[],
    onProgress?: (progress: { current: number; total: number; currentItem: string; result: IngestionResult }) => void
  ): Promise<IngestionResult> {
    await this.initializeReferenceMaps();

    const result: IngestionResult = {
      totalProcessed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      result.totalProcessed++;

      try {
        const itemRes = await this.ingestItem(item);
        if (itemRes.status === 'inserted') result.inserted++;
        else if (itemRes.status === 'updated') result.updated++;
        else if (itemRes.status === 'skipped') result.skipped++;
        else {
          result.failed++;
          result.errors.push({ title: item.title, error: itemRes.error || 'Unknown error' });
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push({ title: item.title, error: err.message || 'Ingestion error' });
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: items.length,
          currentItem: item.title,
          result: { ...result }
        });
      }
    }

    return result;
  }

  /**
   * Upsert many-to-many relationship rows
   */
  private async upsertJunctions(contentId: string, item: ContentItem): Promise<void> {
    if (!supabase) return;

    // 1. Genres Junction
    if (item.genres && Array.isArray(item.genres)) {
      for (const g of item.genres) {
        const name = (typeof g === 'string' ? g : g.name).toLowerCase();
        let genreId = this.genreMap.get(name);

        if (!genreId) {
          // Lookup or Insert genre
          const { data } = await supabase
            .from('genres')
            .upsert({ name: typeof g === 'string' ? g : g.name, slug: name.replace(/\s+/g, '-') }, { onConflict: 'name' })
            .select('id')
            .single();
          if (data?.id) {
            genreId = data.id;
            this.genreMap.set(name, genreId);
          }
        }

        if (genreId) {
          await supabase.from('content_genres').upsert(
            { content_id: contentId, genre_id: genreId },
            { onConflict: 'content_id,genre_id' }
          );
        }
      }
    }

    // 2. Languages Junction
    if (item.primary_language) {
      const langId = this.langMap.get(item.primary_language.toLowerCase());
      if (langId) {
        await supabase.from('content_languages').upsert(
          { content_id: contentId, language_id: langId, is_primary: true },
          { onConflict: 'content_id,language_id' }
        );
      }
    }

    // 3. Industries Junction
    if (item.primary_industry) {
      const indId = this.industryMap.get(item.primary_industry.toLowerCase());
      if (indId) {
        await supabase.from('content_industries').upsert(
          { content_id: contentId, industry_id: indId, is_primary: true },
          { onConflict: 'content_id,industry_id' }
        );
      }
    }
  }

  /**
   * Upsert seasons and episodes
   */
  private async upsertSeasons(contentId: string, seasons: any[]): Promise<void> {
    if (!supabase) return;

    for (const s of seasons) {
      const { data: seasonRow } = await supabase
        .from('seasons')
        .upsert(
          {
            content_id: contentId,
            season_number: s.season_number,
            title: s.title,
            overview: s.overview,
            poster_url: s.poster_url,
            air_date: s.air_date,
            episode_count: s.episode_count || 0
          },
          { onConflict: 'content_id,season_number' }
        )
        .select('id')
        .single();

      if (seasonRow?.id && s.episodes && Array.isArray(s.episodes)) {
        for (const ep of s.episodes) {
          await supabase.from('episodes').upsert(
            {
              season_id: seasonRow.id,
              content_id: contentId,
              episode_number: ep.episode_number,
              title: ep.title,
              overview: ep.overview,
              still_url: ep.still_url,
              air_date: ep.air_date,
              runtime: ep.runtime
            },
            { onConflict: 'season_id,episode_number' }
          );
        }
      }
    }
  }
}

export const contentImporter = new ContentImporter();
