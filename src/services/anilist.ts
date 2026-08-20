import { Manga, MangaMaterial, MangaTitleVariants, SearchFilters } from '../types';
import { SAMPLE_MANGA } from '../data/sampleManga';
import { matchesMangaTitle } from '../utils/titles';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function normalizeType(countryOfOrigin?: string, format?: string, mediaType?: string): Manga['type'] {
  if (mediaType === 'ANIME') {
    if (format === 'MOVIE') return 'Movie';
    if (format === 'OVA' || format === 'ONA') return 'OVA';
    if (format === 'SPECIAL') return 'Special';
    return 'Anime';
  }
  if (countryOfOrigin === 'KR') return 'Manhwa';
  if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'Manhua';
  if (format === 'NOVEL') return 'Light Novel';
  if (format === 'ONE_SHOT') return 'One-shot';
  return 'Manga';
}

function normalizeStatus(status?: string): Manga['status'] {
  switch (status) {
    case 'FINISHED':
      return 'Completed';
    case 'RELEASING':
      return 'Ongoing';
    case 'HIATUS':
      return 'Hiatus';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Ongoing';
  }
}

// Transform AniList raw media node to our standard Manga schema
const catalogMemoryCache = new Map<string, Manga>();
const inFlightDetailRequests = new Map<
  string,
  Promise<{ data: Manga | null; errorType: 'NOT_FOUND' | 'TEMPORARY_ERROR' | null; errorMessage?: string }>
>();

export class TemporaryApiError extends Error {
  isTemporary = true;
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'TemporaryApiError';
    this.statusCode = statusCode;
  }
}

export class CatalogNotFoundError extends Error {
  isNotFound = true;
  constructor(message: string) {
    super(message);
    this.name = 'CatalogNotFoundError';
  }
}

function transformAniListMedia(media: any): Manga {
  const englishTitle = media.title?.english?.trim() || null;
  const romajiTitle = media.title?.romaji?.trim() || null;
  const nativeTitle = media.title?.native?.trim() || null;

  const titleDetails: MangaTitleVariants = {
    english: englishTitle,
    romaji: romajiTitle,
    native: nativeTitle
  };

  // Primary display title priority: English -> Romaji -> Native -> 'Untitled Manga'
  const primaryTitle = englishTitle || romajiTitle || nativeTitle || 'Untitled Manga';

  const altTitles: string[] = [];

  // Add all other non-primary title variants so they are preserved and searchable
  if (romajiTitle && romajiTitle !== primaryTitle && !altTitles.includes(romajiTitle)) {
    altTitles.push(romajiTitle);
  }
  if (nativeTitle && nativeTitle !== primaryTitle && !altTitles.includes(nativeTitle)) {
    altTitles.push(nativeTitle);
  }
  if (englishTitle && englishTitle !== primaryTitle && !altTitles.includes(englishTitle)) {
    altTitles.push(englishTitle);
  }

  if (Array.isArray(media.synonyms)) {
    for (const syn of media.synonyms) {
      if (
        syn &&
        typeof syn === 'string' &&
        syn.trim().length > 0 &&
        syn.trim() !== primaryTitle &&
        !altTitles.includes(syn.trim())
      ) {
        altTitles.push(syn.trim());
      }
    }
  }

  // Find author and artist from staff
  let author: string | undefined;
  let artist: string | undefined;
  if (media.staff?.edges) {
    for (const edge of media.staff.edges) {
      const role = (edge.role || '').toLowerCase();
      if (role.includes('story') || role.includes('original creator') || role.includes('author')) {
        if (!author) author = edge.node?.name?.full;
      }
      if (role.includes('art') || role.includes('illustration') || role.includes('illustrator')) {
        if (!artist) artist = edge.node?.name?.full;
      }
    }
  }

  // Derive Material Guide items from relations
  const materials: MangaMaterial[] = [];

  // Main primary serialization
  materials.push({
    id: `mat-main-${media.id}`,
    external_id: `main-${media.id}`,
    type: normalizeType(media.countryOfOrigin, media.format, media.type),
    title: `${englishTitle || romajiTitle || 'Original Work'} (${media.type === 'ANIME' ? 'Anime Adaptation' : 'Main Serialization'})`,
    number: media.episodes ? `${media.episodes} Episodes` : media.chapters ? `${media.chapters} Chapters` : media.volumes ? `${media.volumes} Volumes` : 'Ongoing serialization',
    release_date: media.startDate?.year ? `${media.startDate.year}` : undefined
  });

  if (media.relations?.edges) {
    media.relations.edges.forEach((edge: any, index: number) => {
      const node = edge.node;
      const relationType = edge.relationType;
      if (!node) return;

      let matType: MangaMaterial['type'] = 'Other';
      if (node.type === 'ANIME') {
        if (node.format === 'MOVIE') matType = 'Movie';
        else if (node.format === 'OVA' || node.format === 'ONA') matType = 'OVA';
        else if (node.format === 'SPECIAL') matType = 'Special';
        else matType = 'Anime';
      } else if (node.type === 'MANGA') {
        if (node.format === 'NOVEL') matType = 'Light Novel';
        else if (node.countryOfOrigin === 'KR') matType = 'Manhwa';
        else if (node.countryOfOrigin === 'CN') matType = 'Manhua';
        else if (node.format === 'ONE_SHOT') matType = 'One-shot';
        else matType = 'Manga';
      }

      materials.push({
        id: `mat-rel-${node.id || index}`,
        external_id: `rel-${node.id || index}`,
        type: matType,
        title: `${node.title?.english || node.title?.romaji || 'Related Adaptation'} (${relationType?.replace(/_/g, ' ') || 'Adaptation'})`,
        number: node.episodes ? `${node.episodes} Episodes` : node.chapters ? `${node.chapters} Chapters` : node.format || undefined,
        release_date: node.startDate?.year ? `${node.startDate.year}` : undefined,
        external_url: node.siteUrl
      });
    });
  }

  const mangaObj: Manga = {
    id: String(media.id),
    anilist_id: media.id,
    title: primaryTitle,
    title_details: titleDetails,
    alternative_titles: altTitles,
    description: stripHtml(media.description) || 'No synopsis available for this title.',
    type: normalizeType(media.countryOfOrigin, media.format, media.type),
    status: normalizeStatus(media.status),
    author: author || 'Unknown Author',
    artist: artist || author || 'Unknown Artist',
    genres: media.genres || [],
    chapters: media.episodes || media.chapters || null,
    volumes: media.volumes || null,
    cover_url: media.coverImage?.large || media.coverImage?.extraLarge || media.coverImage?.medium || '/placeholder-cover.svg',
    banner_url: media.bannerImage || null,
    score: media.averageScore || 0,
    popularity: media.popularity || 0,
    release_year: media.startDate?.year || undefined,
    source: 'AniList',
    materials
  };

  // Cache in memory for instant lookups
  catalogMemoryCache.set(mangaObj.id.toString(), mangaObj);
  if (mangaObj.anilist_id) {
    catalogMemoryCache.set(mangaObj.anilist_id.toString(), mangaObj);
  }

  return mangaObj;
}

const MANGA_FIELDS_FRAGMENT = `
  id
  type
  title {
    romaji
    english
    native
  }
  synonyms
  description
  format
  countryOfOrigin
  status
  genres
  chapters
  volumes
  episodes
  averageScore
  popularity
  startDate {
    year
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  staff(perPage: 6) {
    edges {
      role
      node {
        name {
          full
        }
      }
    }
  }
  relations {
    edges {
      relationType
      node {
        id
        type
        format
        countryOfOrigin
        episodes
        chapters
        siteUrl
        startDate {
          year
        }
        title {
          romaji
          english
        }
      }
    }
  }
`;

async function executeAniListQuery(query: string, variables: Record<string, any>, maxRetries = 2) {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new TemporaryApiError('AniList API rate limit reached. Please wait a moment.', 429);
        }
        if (response.status >= 500) {
          throw new TemporaryApiError(`AniList server temporarily unavailable (${response.status})`, response.status);
        }
        if (response.status === 404) {
          throw new CatalogNotFoundError('Resource not found on AniList.');
        }
        throw new TemporaryApiError(`AniList API returned status ${response.status}: ${response.statusText}`, response.status);
      }

      const json = await response.json();
      if (json.errors && json.errors.length > 0) {
        const errMsg = json.errors[0]?.message || 'AniList GraphQL Query Error';
        if (errMsg.toLowerCase().includes('not found') || errMsg.includes('404')) {
          throw new CatalogNotFoundError('Title not found in AniList catalog.');
        }
        throw new TemporaryApiError(errMsg);
      }

      return json.data;
    } catch (err: any) {
      lastError = err;

      // Do not retry genuine 404 / not found errors
      if (err instanceof CatalogNotFoundError) {
        throw err;
      }

      attempt++;
      if (attempt <= maxRetries) {
        const backoffDelay = Math.min(500 * Math.pow(2, attempt - 1), 2000) + Math.random() * 150;
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  if (lastError instanceof TemporaryApiError || lastError instanceof CatalogNotFoundError) {
    throw lastError;
  }
  throw new TemporaryApiError(lastError?.message || 'Network error connecting to AniList.');
}

export const anilistService = {
  async getTrendingManga(page = 1, perPage = 12): Promise<Manga[]> {
    try {
      const query = `
        query GetTrendingManga($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { page, perPage });
      return (data.Page.media || []).map(transformAniListMedia);
    } catch (err) {
      console.warn('AniList Trending fetch failed, using fallback:', err);
      return SAMPLE_MANGA;
    }
  },

  async getPopularManga(page = 1, perPage = 12): Promise<Manga[]> {
    try {
      const query = `
        query GetPopularManga($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { page, perPage });
      return (data.Page.media || []).map(transformAniListMedia);
    } catch (err) {
      console.warn('AniList Popular fetch failed, using fallback:', err);
      return SAMPLE_MANGA;
    }
  },

  async getTrendingAnime(page = 1, perPage = 12): Promise<Manga[]> {
    try {
      const query = `
        query GetTrendingAnime($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { page, perPage });
      return (data.Page?.media || []).map(transformAniListMedia);
    } catch (err) {
      console.warn('AniList Trending Anime fetch failed:', err);
      return [];
    }
  },

  async getPopularAnime(page = 1, perPage = 12): Promise<Manga[]> {
    try {
      const query = `
        query GetPopularAnime($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { page, perPage });
      return (data.Page?.media || []).map(transformAniListMedia);
    } catch (err) {
      console.warn('AniList Popular Anime fetch failed:', err);
      return [];
    }
  },

  async getRecentlyUpdated(page = 1, perPage = 12): Promise<Manga[]> {
    try {
      const query = `
        query GetRecentlyUpdatedManga($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: UPDATED_AT_DESC, isAdult: false) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { page, perPage });
      return (data.Page.media || []).map(transformAniListMedia);
    } catch (err) {
      console.warn('AniList Recent fetch failed, using fallback:', err);
      return SAMPLE_MANGA;
    }
  },

  async searchManga(queryText: string, page = 1, perPage = 20): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    const rawQuery = queryText.trim();
    if (!rawQuery) {
      return { items: [], hasNextPage: false };
    }

    try {
      const query = `
        query SearchManga($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
            }
            media(type: MANGA, search: $search, isAdult: false, sort: SEARCH_MATCH) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      // Pass raw query directly to AniList API without unnatural transformations
      const data = await executeAniListQuery(query, { search: rawQuery, page, perPage });
      return {
        items: (data.Page.media || []).map(transformAniListMedia),
        hasNextPage: Boolean(data.Page.pageInfo?.hasNextPage)
      };
    } catch (err) {
      console.warn('AniList Search failed, fallback search applied:', err);
      const filtered = SAMPLE_MANGA.filter((m) => matchesMangaTitle(m, rawQuery));
      return { items: filtered, hasNextPage: false };
    }
  },

  async searchAnime(queryText: string, page = 1, perPage = 20): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    const rawQuery = queryText.trim();
    if (!rawQuery) {
      return { items: [], hasNextPage: false };
    }

    try {
      const query = `
        query SearchAnime($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
            }
            media(type: ANIME, search: $search, isAdult: false, sort: SEARCH_MATCH) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;
      const data = await executeAniListQuery(query, { search: rawQuery, page, perPage });
      return {
        items: (data.Page.media || []).map(transformAniListMedia),
        hasNextPage: Boolean(data.Page.pageInfo?.hasNextPage)
      };
    } catch (err) {
      console.warn('AniList Anime Search failed:', err);
      return { items: [], hasNextPage: false };
    }
  },

  async searchAll(queryText: string, page = 1, perPage = 20): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    const rawQuery = queryText.trim();
    if (!rawQuery) {
      return { items: [], hasNextPage: false };
    }

    const halfPerPage = Math.max(5, Math.ceil(perPage / 2));
    const [animeRes, mangaRes] = await Promise.allSettled([
      this.searchAnime(rawQuery, page, halfPerPage),
      this.searchManga(rawQuery, page, halfPerPage)
    ]);

    const animeItems = animeRes.status === 'fulfilled' ? animeRes.value.items : [];
    const mangaItems = mangaRes.status === 'fulfilled' ? mangaRes.value.items : [];
    const hasNext =
      (animeRes.status === 'fulfilled' && animeRes.value.hasNextPage) ||
      (mangaRes.status === 'fulfilled' && mangaRes.value.hasNextPage);

    return {
      items: [...animeItems, ...mangaItems],
      hasNextPage: hasNext
    };
  },

  async getMangaById(id: number | string): Promise<Manga | null> {
    const result = await this.getMangaByIdDetailed(id);
    return result.data;
  },

  async getMangaByIdDetailed(
    id: number | string
  ): Promise<{ data: Manga | null; errorType: 'NOT_FOUND' | 'TEMPORARY_ERROR' | null; errorMessage?: string }> {
    const idKey = id ? id.toString() : '';
    if (!idKey) {
      return { data: null, errorType: 'NOT_FOUND', errorMessage: 'Invalid title ID.' };
    }

    // 1. Check in-memory cache first
    if (catalogMemoryCache.has(idKey)) {
      return { data: catalogMemoryCache.get(idKey)!, errorType: null };
    }

    // 2. Check local sample manga
    const sample = SAMPLE_MANGA.find(
      (m) => m.id.toString() === idKey || (m.anilist_id && m.anilist_id.toString() === idKey)
    );
    if (sample) {
      catalogMemoryCache.set(idKey, sample);
      return { data: sample, errorType: null };
    }

    // 3. Deduplicate in-flight requests for the exact same ID
    if (inFlightDetailRequests.has(idKey)) {
      return inFlightDetailRequests.get(idKey)!;
    }

    const requestPromise = (async () => {
      try {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(numericId)) {
          // If non-numeric and not in cache/sample, mark not found
          return { data: null, errorType: 'NOT_FOUND' as const, errorMessage: 'Title not found in catalog.' };
        }

        const query = `
          query GetMangaById($id: Int) {
            Media(id: $id, type: MANGA) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        `;
        const data = await executeAniListQuery(query, { id: numericId });
        if (!data || !data.Media) {
          return { data: null, errorType: 'NOT_FOUND' as const, errorMessage: 'Title not found in AniList catalog.' };
        }

        const transformed = transformAniListMedia(data.Media);
        return { data: transformed, errorType: null };
      } catch (err: any) {
        if (err instanceof CatalogNotFoundError) {
          return { data: null, errorType: 'NOT_FOUND' as const, errorMessage: 'Title not found in AniList catalog.' };
        }

        console.warn(`AniList getMangaById(${id}) encountered temporary error:`, err);
        return {
          data: null,
          errorType: 'TEMPORARY_ERROR' as const,
          errorMessage: err?.message || 'Temporary connection issue with catalog.'
        };
      } finally {
        inFlightDetailRequests.delete(idKey);
      }
    })();

    inFlightDetailRequests.set(idKey, requestPromise);
    return requestPromise;
  },

  async discoverManga(filters: SearchFilters): Promise<{ items: Manga[]; hasNextPage: boolean }> {
    try {
      const variables: Record<string, any> = {
        page: filters.page || 1,
        perPage: filters.perPage || 24,
        sort: filters.sort || 'POPULARITY_DESC'
      };

      if (filters.query?.trim()) {
        variables.search = filters.query.trim();
      }

      if (filters.genre && filters.genre !== 'All') {
        variables.genre = filters.genre;
      }

      if (filters.status && filters.status !== 'All') {
        if (filters.status === 'Ongoing') variables.status = 'RELEASING';
        else if (filters.status === 'Completed') variables.status = 'FINISHED';
        else if (filters.status === 'Hiatus') variables.status = 'HIATUS';
        else if (filters.status === 'Cancelled') variables.status = 'CANCELLED';
      }

      if (filters.type && filters.type !== 'All') {
        if (filters.type === 'Manhwa') variables.countryOfOrigin = 'KR';
        else if (filters.type === 'Manhua') variables.countryOfOrigin = 'CN';
        else if (filters.type === 'Light Novel') variables.format = 'NOVEL';
        else if (filters.type === 'One-shot') variables.format = 'ONE_SHOT';
        else if (filters.type === 'Manga') variables.countryOfOrigin = 'JP';
      }

      const query = `
        query DiscoverManga($page: Int, $perPage: Int, $search: String, $genre: String, $status: MediaStatus, $countryOfOrigin: CountryCode, $format: MediaFormat, $sort: [MediaSort]) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
            }
            media(
              type: MANGA,
              search: $search,
              genre: $genre,
              status: $status,
              countryOfOrigin: $countryOfOrigin,
              format: $format,
              sort: $sort,
              isAdult: false
            ) {
              ${MANGA_FIELDS_FRAGMENT}
            }
          }
        }
      `;

      const data = await executeAniListQuery(query, variables);
      return {
        items: (data.Page.media || []).map(transformAniListMedia),
        hasNextPage: Boolean(data.Page.pageInfo?.hasNextPage)
      };
    } catch (err) {
      console.warn('AniList Discover failed, using fallback filters:', err);
      let items = [...SAMPLE_MANGA];
      if (filters.query && filters.query.trim()) {
        items = items.filter((m) => matchesMangaTitle(m, filters.query!));
      }
      if (filters.genre && filters.genre !== 'All') {
        items = items.filter((m) => m.genres.includes(filters.genre!));
      }
      if (filters.type && filters.type !== 'All') {
        items = items.filter((m) => m.type === filters.type);
      }
      if (filters.status && filters.status !== 'All') {
        items = items.filter((m) => m.status === filters.status);
      }
      return { items, hasNextPage: false };
    }
  },

  async getDefaultNarutoManga(): Promise<Manga> {
    try {
      // Fetch dynamic Naruto data directly from AniList by ID (30011)
      const naruto = await this.getMangaById(30011);
      if (naruto) return naruto;

      // Fallback search
      const searchRes = await this.searchManga('Naruto', 1, 1);
      if (searchRes.items.length > 0) return searchRes.items[0];
    } catch (err) {
      console.warn('Failed to load Naruto from AniList, using fallback:', err);
    }
    const sample = SAMPLE_MANGA.find((m) => m.anilist_id === 30011 || m.title.toLowerCase() === 'naruto');
    return sample || SAMPLE_MANGA[0];
  }
};
