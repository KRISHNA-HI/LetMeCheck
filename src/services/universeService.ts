// ==========================================================
// LetMeCheck Universe & Watch Order Service
// Aggregates universe models, watch orders, dynamic counts,
// and provides search and connection capabilities for all media types.
// ==========================================================

import { Universe, WatchOrder, WatchOrderEntry, ContentItem } from '../types/content';
import { UNIVERSE_REGISTRY } from '../data/universeData';
import { resolveUniversePoster, resolveUniverseBackdrop, resolveEntryPoster } from './universeImageResolver';
import { supabase, isSupabaseConfigured } from './supabase';

class UniverseService {
  private memoryRegistry: Universe[] = [...UNIVERSE_REGISTRY];

  /**
   * Helper to normalize a universe object with dynamic counts and resolved imagery
   */
  private enrichUniverse(raw: Universe): Universe {
    const orders = raw.available_orders || raw.watch_orders || raw.watchOrders || [];
    
    // Find all distinct titles connected to this universe across orders
    const titleIds = new Set<string>();
    orders.forEach((order) => {
      const entries = order.ordered_entries || order.items || [];
      entries.forEach((entry) => {
        const id = entry.content_id || entry.contentId || entry.title;
        if (id) titleIds.add(id);
      });
    });

    const defaultOrder = orders.find((o) => o.is_default) || orders[0];
    const defaultOrderEntriesCount = defaultOrder ? (defaultOrder.ordered_entries?.length || defaultOrder.items?.length || 0) : 0;
    const computedTitlesCount = titleIds.size > 0 ? titleIds.size : (raw.total_titles || defaultOrderEntriesCount);

    const enrichedOrders: WatchOrder[] = orders.map((o) => ({
      ...o,
      ordered_entries: (o.ordered_entries || o.items || []).map((e) => ({
        ...e,
        content_id: e.content_id || e.contentId || '',
        contentId: e.contentId || e.content_id || '',
        poster_url: resolveEntryPoster(e, raw)
      }))
    }));

    return {
      ...raw,
      poster_url: resolveUniversePoster(raw),
      backdrop_url: resolveUniverseBackdrop(raw),
      total_titles: computedTitlesCount,
      items_count: computedTitlesCount,
      available_orders: enrichedOrders,
      watch_orders: enrichedOrders,
      watchOrders: enrichedOrders
    };
  }

  /**
   * Get all registered universes/franchises
   */
  async getAllUniverses(): Promise<Universe[]> {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('franchises')
          .select(`
            *,
            watch_orders:watch_orders(
              *,
              items:watch_order_items(*)
            )
          `)
          .order('name');

        if (!error && data && data.length > 0) {
          const dbUniverses: Universe[] = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            original_name: f.original_name,
            slug: f.slug,
            description: f.description || '',
            poster_url: f.poster_url || '',
            backdrop_url: f.backdrop_url,
            category: f.type || 'franchise',
            type: f.type || 'franchise',
            total_titles: f.items_count || 0,
            available_orders: (f.watch_orders || []).map((wo: any) => ({
              id: wo.id,
              universe_id: f.id,
              name: wo.title,
              title: wo.title,
              description: wo.description,
              order_type: wo.order_type || 'release_order',
              is_default: wo.is_default,
              ordered_entries: (wo.items || []).map((it: any) => ({
                id: it.id,
                position: it.order_number,
                order_number: it.order_number,
                content_id: it.content_id,
                contentId: it.content_id,
                title: it.title,
                notes: it.notes,
                explanation: it.notes
              }))
            }))
          }));

          const mergedMap = new Map<string, Universe>();
          this.memoryRegistry.forEach((u) => mergedMap.set(u.id, this.enrichUniverse(u)));
          dbUniverses.forEach((u) => mergedMap.set(u.id, this.enrichUniverse(u)));
          return Array.from(mergedMap.values());
        }
      }
    } catch (e) {
      console.warn('Could not fetch franchises from Supabase, using local registry:', e);
    }

    return this.memoryRegistry.map((u) => this.enrichUniverse(u));
  }

  /**
   * Get prominent featured universes for the Discover hub with dynamic relevance scoring
   * Guarantees MCU as a permanent fixture, boosted with user affinity and multi-regional representation.
   */
  async getFeaturedUniverses(): Promise<Universe[]> {
    const all = await this.getAllUniverses();
    if (!all.length) return [];

    // Parse any client-side user preferences or library tracked entries if available
    const userTrackedIds = new Set<string>();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawLib = window.localStorage.getItem('letmecheck_library_entries');
        if (rawLib) {
          const parsed = JSON.parse(rawLib);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.manga_id) userTrackedIds.add(String(item.manga_id).toLowerCase());
              if (item.title) userTrackedIds.add(String(item.title).toLowerCase());
            });
          }
        }
      }
    } catch {
      // Graceful fallback if storage not accessible
    }

    // Dynamic Scoring Engine
    const scoredUniverses = all.map((universe) => {
      let score = 0;

      // 1. MCU Permanent Anchor
      if (universe.id === 'mcu') {
        score += 10000;
      }

      // 2. Base weight by completeness & title count
      const totalTitles = universe.total_titles || 0;
      score += Math.min(totalTitles * 2, 50);

      // 3. Watch Order richness bonus
      const orderCount = (universe.available_orders || []).length;
      score += orderCount * 15;

      // 4. User Affinity Bonus (if user has titles in library matching this universe)
      if (userTrackedIds.size > 0) {
        let affinityMatches = 0;
        const orders = universe.available_orders || [];
        orders.forEach((o) => {
          (o.ordered_entries || []).forEach((e) => {
            const cId = String(e.content_id || '').toLowerCase();
            const title = String(e.title || '').toLowerCase();
            if (userTrackedIds.has(cId) || userTrackedIds.has(title)) {
              affinityMatches++;
            }
          });
        });
        score += affinityMatches * 40;
      }

      // 5. Tiered regional and flagship weight
      const flagshipTiers: Record<string, number> = {
        'dceu': 900,
        'dcu': 880,
        'spider-man-franchise': 850,
        'star-wars': 820,
        'wizarding-world': 800,
        'batman-epic-crime-saga': 780,
        'middle-earth': 760,
        'jujutsu-kaisen': 740,
        'demon-slayer': 720,
        'dragon-ball': 700,
        'one-piece-saga': 690,
        'lcu': 680,
        'yrf-spy-universe': 660,
        'monsterverse': 640,
        'the-conjuring-universe': 620,
        'john-wick': 600,
        'fast-and-furious': 580,
        'cop-universe': 560,
        'maddock-horror-comedy': 540
      };

      if (flagshipTiers[universe.id]) {
        score += flagshipTiers[universe.id];
      }

      return { universe, score };
    });

    // Sort descending by score
    scoredUniverses.sort((a, b) => b.score - a.score);

    // Return the top featured universes (top 8)
    return scoredUniverses.slice(0, 8).map((s) => s.universe);
  }

  /**
   * Get specific universe by ID or slug
   */
  async getUniverseById(idOrSlug: string): Promise<Universe | null> {
    const all = await this.getAllUniverses();
    const found = all.find((u) => u.id === idOrSlug || u.slug === idOrSlug);
    return found || null;
  }

  /**
   * Search universes by name, description, slug, or entry title
   */
  async searchUniverses(query: string): Promise<Universe[]> {
    if (!query.trim()) return this.getAllUniverses();
    const q = query.toLowerCase().trim();
    const all = await this.getAllUniverses();
    
    return all.filter((u) => {
      if (u.name.toLowerCase().includes(q)) return true;
      if (u.description.toLowerCase().includes(q)) return true;
      if (u.slug?.toLowerCase().includes(q)) return true;
      const matchesEntry = (u.available_orders || []).some((o) =>
        (o.ordered_entries || []).some((e) => e.title?.toLowerCase().includes(q))
      );
      return matchesEntry;
    });
  }

  /**
   * Find if a given content item or title belongs to a Universe
   */
  async findUniverseForContent(contentId?: string | number, title?: string): Promise<{
    universe: Universe;
    entry?: WatchOrderEntry;
    order?: WatchOrder;
  } | null> {
    const all = await this.getAllUniverses();
    const strId = contentId ? String(contentId).toLowerCase() : '';
    const cleanTitle = title ? title.toLowerCase().trim() : '';

    for (const universe of all) {
      for (const order of (universe.available_orders || [])) {
        for (const entry of (order.ordered_entries || [])) {
          const entryId = String(entry.content_id || entry.contentId || '').toLowerCase();
          const entryTitle = entry.title?.toLowerCase().trim() || '';

          if (strId && entryId && (entryId === strId || entryId.includes(strId) || strId.includes(entryId))) {
            return { universe, entry, order };
          }

          if (cleanTitle && entryTitle) {
            if (cleanTitle === entryTitle || cleanTitle.includes(entryTitle) || entryTitle.includes(cleanTitle)) {
              return { universe, entry, order };
            }
          }
        }
      }
    }

    // Heuristic fallback matching
    if (cleanTitle) {
      if (cleanTitle.includes('avengers') || cleanTitle.includes('iron man') || cleanTitle.includes('captain america') || cleanTitle.includes('thor') || cleanTitle.includes('spider-man') || cleanTitle.includes('black panther')) {
        const mcu = all.find((u) => u.id === 'mcu');
        if (mcu) return { universe: mcu, order: mcu.available_orders?.[0] };
      }
      if (cleanTitle.includes('star wars') || cleanTitle.includes('mandalorian')) {
        const sw = all.find((u) => u.id === 'star-wars');
        if (sw) return { universe: sw, order: sw.available_orders?.[0] };
      }
      if (cleanTitle.includes('man of steel') || cleanTitle.includes('batman v superman') || cleanTitle.includes('justice league') || cleanTitle.includes('aquaman') || cleanTitle.includes('peacemaker') || cleanTitle.includes('shazam')) {
        const dceu = all.find((u) => u.id === 'dceu');
        if (dceu) return { universe: dceu, order: dceu.available_orders?.[0] };
      }
      if (cleanTitle.includes('creature commandos') || cleanTitle.includes('superman') || cleanTitle.includes('supergirl')) {
        const dcu = all.find((u) => u.id === 'dcu');
        if (dcu) return { universe: dcu, order: dcu.available_orders?.[0] };
      }
      if (cleanTitle.includes('the batman') || cleanTitle.includes('the penguin')) {
        const bm = all.find((u) => u.id === 'batman-epic-crime-saga');
        if (bm) return { universe: bm, order: bm.available_orders?.[0] };
      }
      if (cleanTitle.includes('harry potter') || cleanTitle.includes('fantastic beasts')) {
        const hp = all.find((u) => u.id === 'wizarding-world');
        if (hp) return { universe: hp, order: hp.available_orders?.[0] };
      }
      if (cleanTitle.includes('conjuring') || cleanTitle.includes('annabelle') || cleanTitle.includes('the nun')) {
        const c = all.find((u) => u.id === 'the-conjuring-universe');
        if (c) return { universe: c, order: c.available_orders?.[0] };
      }
      if (cleanTitle.includes('vikram') || cleanTitle.includes('kaithi') || cleanTitle.includes('leo')) {
        const lcu = all.find((u) => u.id === 'lcu');
        if (lcu) return { universe: lcu, order: lcu.available_orders?.[0] };
      }
      if (cleanTitle.includes('dragon ball')) {
        const db = all.find((u) => u.id === 'dragon-ball');
        if (db) return { universe: db, order: db.available_orders?.[0] };
      }
      if (cleanTitle.includes('demon slayer') || cleanTitle.includes('kimetsu no yaiba')) {
        const ds = all.find((u) => u.id === 'demon-slayer');
        if (ds) return { universe: ds, order: ds.available_orders?.[0] };
      }
      if (cleanTitle.includes('jujutsu kaisen')) {
        const jjk = all.find((u) => u.id === 'jujutsu-kaisen');
        if (jjk) return { universe: jjk, order: jjk.available_orders?.[0] };
      }
    }

    return null;
  }
}

export const universeService = new UniverseService();
