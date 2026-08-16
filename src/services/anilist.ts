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

function normalizeType(countryOfOrigin?: string, format?: string): Manga['type'] {
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
    type: normalizeType(media.countryOfOrigin, media.format),
    title: `${englishTitle || romajiTitle || 'Original Work'} (Main Serialization)`,
    number: media.chapters ? `${media.chapters} Chapters` : media.volumes ? `${media.volumes} Volumes` : 'Ongoing serialization',
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

  return {
    id: String(media.id),
    anilist_id: media.id,
    title: primaryTitle,
    title_details: titleDetails,
    alternative_titles: altTitles,
    description: stripHtml(media.description) || 'No synopsis available for this title.',
    type: normalizeType(media.countryOfOrigin, media.format),
    status: normalizeStatus(media.status),
    author: author || 'Unknown Author',
    artist: artist || author || 'Unknown Artist',
    genres: media.genres || [],
    chapters: media.chapters || null,
    volumes: media.volumes || null,
    cover_url: media.coverImage?.large || media.coverImage?.extraLarge || media.coverImage?.medium || '/placeholder-cover.svg',
    banner_url: media.bannerImage || null,
    score: media.averageScore || 0,
    popularity: media.popularity || 0,
    release_year: media.startDate?.year || undefined,
    source: 'AniList',
    materials
  };
}

const MANGA_FIELDS_FRAGMENT = `
  id
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

async function executeAniListQuery(query: string, variables: Record<string, any>) {
  const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`AniList API returned ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'AniList GraphQL Query Error');
  }

  return json.data;
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

  async getMangaById(id: number | string): Promise<Manga | null> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numericId)) {
        // Find in sample
        return SAMPLE_MANGA.find((m) => m.id.toString() === id.toString()) || null;
      }

      const query = `
        query GetMangaById($id: Int) {
          Media(id: $id, type: MANGA) {
            ${MANGA_FIELDS_FRAGMENT}
          }
        }
      `;
      const data = await executeAniListQuery(query, { id: numericId });
      if (!data.Media) return null;
      return transformAniListMedia(data.Media);
    } catch (err) {
      console.warn(`AniList getMangaById(${id}) failed, checking local samples:`, err);
      return SAMPLE_MANGA.find((m) => m.id.toString() === id.toString() || m.anilist_id?.toString() === id.toString()) || null;
    }
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
