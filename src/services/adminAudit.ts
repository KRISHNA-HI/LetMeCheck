// ==========================================================
// Admin Semantic & Relational Catalog Audit Service
// Direct-to-Supabase audit & self-healing reconciliation engine
// ==========================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { resolveDeterministicClassification } from '../utils/classification';

export interface AuditResult {
  totalContent: number;
  moviesCount: number;
  tvCount: number;
  relationalIntegrity: {
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
  semanticQuality: {
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
}

async function fetchAllClientRecords(client: any, table: string, selectColumns = '*') {
  const records: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(selectColumns)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error(`Error in fetchAllClientRecords(${table}):`, error);
      break;
    }
    if (data && data.length > 0) {
      records.push(...data);
    }
    if (!data || data.length < pageSize) break;
    page++;
  }
  return records;
}

export async function runCatalogSemanticAudit(client = supabase): Promise<AuditResult | null> {
  if (!client || !isSupabaseConfigured()) return null;

  const [
    allContent,
    allCi,
    allCl,
    allCc,
    allCg,
    indListRes,
    langListRes,
    countryListRes
  ] = await Promise.all([
    fetchAllClientRecords(client, 'content', 'id, title, original_title, content_type, is_anime, external_source, external_id, metadata'),
    fetchAllClientRecords(client, 'content_industries', 'content_id, industry_id, is_primary'),
    fetchAllClientRecords(client, 'content_languages', 'content_id, language_id, is_primary'),
    fetchAllClientRecords(client, 'content_countries', 'content_id, country_id'),
    fetchAllClientRecords(client, 'content_genres', 'content_id, genre_id'),
    client.from('industries').select('id, name'),
    client.from('languages').select('id, name, iso_code'),
    client.from('countries').select('id, name, iso_code')
  ]);

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
  countryList.forEach((c: any) => {
    if (c.iso_code) {
      countryMap.set(c.iso_code.toLowerCase(), c.id);
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

  let multiIndustryCount = 0;
  let missingIndustryCount = 0;
  let exactOneIndustryCount = 0;

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
    tvCount: allContent.filter((c: any) => c.content_type === 'series' || c.content_type === 'tv').length,
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

export async function reconcileCatalogIntegrity(client = supabase): Promise<{
  success: boolean;
  message: string;
  healedCount: number;
  details?: any;
  auditBefore?: any;
  auditAfter?: any;
}> {
  try {
    const supabaseClient = client || supabase;
    const session = (await supabaseClient.auth.getSession()).data.session;
    const token = session?.access_token;

    if (!token) {
      return { success: false, message: 'Authentication required for reconciliation', healedCount: 0 };
    }

    // Invoke Supabase Edge Function 'admin-reconcile'
    const { data, error } = await supabaseClient.functions.invoke('admin-reconcile', {
      body: { action: 'reconcile-integrity' }
    });

    if (error || !data || !data.success) {
      return {
        success: false,
        message: error?.message || data?.error || 'Reconciliation failed via Edge Function',
        healedCount: 0
      };
    }

    return {
      success: true,
      message: data.message || `Reconciled catalog relationships. ${data.healedCount || 0} records corrected.`,
      healedCount: data.healedCount || 0,
      details: data.details,
      auditBefore: data.auditBefore,
      auditAfter: data.auditAfter
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error during reconciliation',
      healedCount: 0
    };
  }
}
