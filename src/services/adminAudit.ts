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

export async function runCatalogSemanticAudit(client = supabase): Promise<AuditResult | null> {
  if (!client || !isSupabaseConfigured()) return null;

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
  auditBefore?: { discrepancies: number; score: number };
  auditAfter?: { discrepancies: number; score: number };
}> {
  if (!client || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase client unavailable', healedCount: 0 };
  }

  const auditBefore = await runCatalogSemanticAudit(client);
  if (!auditBefore) {
    return { success: false, message: 'Failed to run pre-reconcile audit', healedCount: 0 };
  }

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

  const auditAfter = await runCatalogSemanticAudit(client);

  return {
    success: true,
    message: `Reconciled catalog relationships. ${healedCount} records corrected.`,
    healedCount,
    auditBefore: {
      discrepancies: auditBefore.semanticQuality.semanticDiscrepanciesCount,
      score: auditBefore.semanticQuality.semanticQualityScore
    },
    auditAfter: {
      discrepancies: auditAfter?.semanticQuality.semanticDiscrepanciesCount || 0,
      score: auditAfter?.semanticQuality.semanticQualityScore || 0
    }
  };
}
