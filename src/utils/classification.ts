// ==========================================================
// Classification & Regional Taxonomy Utilities
// Deterministic regional & industry mapping for TMDB metadata
// ==========================================================

export interface RegionConfig {
  code: string;
  name: string;
  languageCode: string;
  countryCode: string;
  priorityOrder: number;
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
