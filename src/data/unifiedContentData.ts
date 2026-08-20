// ==========================================================
// LetMeCheck Unified Multi-Regional & Multi-Format Master Content Catalog
// Unifies Movies, TV/Web Series, Anime, Manga, and Universes across
// Hollywood, Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood,
// Korean Cinema, Japanese Cinema, Anime, and Global franchises.
// ==========================================================

import { ContentItem } from '../types/content';
import { MULTI_REGIONAL_TEST_DATASET } from './multiRegionalTestData';
import { UNIVERSE_REGISTRY } from './universeData';
import { SAMPLE_MANGA } from './sampleManga';
import { mangaToContentItem } from '../services/contentService';
import { resolveContentArtwork } from '../services/contentImageResolver';

/**
 * Extracts and normalizes all individual title entries from registered universes
 */
function extractUniverseTitles(): ContentItem[] {
  const extracted: ContentItem[] = [];
  const seenIds = new Set<string>();

  for (const universe of UNIVERSE_REGISTRY) {
    const orders = universe.available_orders || universe.watch_orders || universe.watchOrders || [];
    
    for (const order of orders) {
      const entries = order.ordered_entries || order.items || [];
      for (const entry of entries) {
        const id = entry.content_id || entry.contentId || `${universe.id}-${entry.position || entry.order_number}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        // Determine content type
        let contentType: ContentItem['content_type'] = 'movie';
        const titleLower = entry.title.toLowerCase();
        const contextLower = (entry.context || '').toLowerCase();
        const explLower = (entry.explanation || '').toLowerCase();

        if (
          universe.category === 'anime_universe' ||
          universe.id.includes('anime') ||
          ['demon-slayer', 'jujutsu-kaisen', 'dragon-ball', 'one-piece-saga', 'attack-on-titan'].includes(universe.id)
        ) {
          contentType = 'anime';
        } else if (
          universe.category === 'manga' ||
          universe.category === 'comic'
        ) {
          contentType = 'manga';
        } else if (
          titleLower.includes('season') ||
          titleLower.includes('series') ||
          contextLower.includes('series') ||
          contextLower.includes('season') ||
          explLower.includes('series') ||
          explLower.includes('disney+ series') ||
          explLower.includes('streaming series') ||
          explLower.includes('episodes') ||
          ['wandavision', 'loki', 'hawkeye', 'moon knight', 'ms. marvel', 'she-hulk', 'secret invasion', 'echo', 'agatha all along', 'peacemaker', 'the continental', 'monarch: legacy of monsters', 'the penguin', 'the mandalorian', 'andor', 'ahsoka', 'obi-wan kenobi', 'the rings of power', 'indian police force'].some((t) => titleLower.includes(t))
        ) {
          contentType = 'tv_series';
        }

        // Determine industries and regions
        let primaryIndustry = universe.region || 'hollywood';
        let industries = [universe.region || 'Hollywood'];
        let countries = ['US'];
        let primaryLanguage = 'en';

        if (universe.id === 'mcu' || universe.id.includes('dc') || universe.id.includes('star-wars') || universe.id.includes('spider-man') || universe.id.includes('wizarding-world') || universe.id.includes('middle-earth') || universe.id.includes('monsterverse') || universe.id.includes('conjuring') || universe.id.includes('john-wick') || universe.id.includes('fast-and-furious') || universe.id.includes('transformers') || universe.id.includes('jurassic')) {
          primaryIndustry = 'hollywood';
          industries = ['Hollywood'];
          countries = ['US'];
          primaryLanguage = 'en';
        } else if (universe.id === 'yrf-spy-universe' || universe.id === 'cop-universe' || universe.id === 'maddock-horror-comedy' || universe.id === 'dhoom' || universe.id === 'dhamaal') {
          primaryIndustry = 'bollywood';
          industries = ['Bollywood'];
          countries = ['IN'];
          primaryLanguage = 'hi';
        } else if (universe.id === 'lcu' || universe.id.includes('tamil') || universe.id.includes('kollywood')) {
          primaryIndustry = 'kollywood';
          industries = ['Kollywood'];
          countries = ['IN'];
          primaryLanguage = 'ta';
        } else if (universe.id.includes('tollywood') || universe.id === 'baahubali' || universe.id === 'rrr' || universe.id === 'kalki-cinematic-universe') {
          primaryIndustry = 'tollywood';
          industries = ['Tollywood'];
          countries = ['IN'];
          primaryLanguage = 'te';
        } else if (universe.id.includes('mollywood')) {
          primaryIndustry = 'mollywood';
          industries = ['Mollywood'];
          countries = ['IN'];
          primaryLanguage = 'ml';
        } else if (universe.id.includes('sandalwood') || universe.id === 'kgf-universe') {
          primaryIndustry = 'sandalwood';
          industries = ['Sandalwood'];
          countries = ['IN'];
          primaryLanguage = 'kn';
        } else if (universe.category === 'anime_universe' || ['demon-slayer', 'jujutsu-kaisen', 'dragon-ball', 'one-piece-saga'].includes(universe.id)) {
          primaryIndustry = 'anime_industry';
          industries = ['Anime Industry', 'Japanese Cinema & Anime'];
          countries = ['JP'];
          primaryLanguage = 'ja';
        }

        // Inherit & expand genres
        const itemGenres = Array.from(new Set([
          ...(universe.genres || ['Action']),
          ...(titleLower.includes('spider') ? ['Science Fiction', 'Action', 'Adventure'] : []),
          ...(titleLower.includes('batman') ? ['Action', 'Crime', 'Drama', 'Thriller'] : []),
          ...(titleLower.includes('superman') ? ['Action', 'Science Fiction', 'Adventure'] : []),
          ...(titleLower.includes('conjuring') || titleLower.includes('annabelle') || titleLower.includes('nun') || titleLower.includes('stree') || titleLower.includes('maddock') ? ['Horror', 'Thriller'] : []),
          ...(titleLower.includes('harry potter') || titleLower.includes('lord of the rings') || titleLower.includes('hobbit') || titleLower.includes('rings of power') || titleLower.includes('thor') || titleLower.includes('doctor strange') || titleLower.includes('shazam') || titleLower.includes('demon slayer') || titleLower.includes('jujutsu kaisen') ? ['Fantasy', 'Adventure'] : []),
          ...(titleLower.includes('star wars') || titleLower.includes('transformers') || titleLower.includes('jurassic') || titleLower.includes('matrix') || titleLower.includes('iron man') || titleLower.includes('avengers') ? ['Science Fiction', 'Action'] : [])
        ]));

        // Resolve artwork independently
        const resolvedPoster = resolveContentArtwork({
          id,
          title: entry.title,
          poster_url: entry.poster_url,
          year: entry.release_year
        });

        extracted.push({
          id,
          content_type: contentType,
          title: entry.title,
          original_title: entry.title,
          overview: entry.explanation || `${entry.title} (${entry.release_year || 'Classic'}) - Part of the ${universe.name}.`,
          description: entry.explanation || `${entry.title} (${entry.release_year || 'Classic'}) - Part of the ${universe.name}.`,
          poster_url: resolvedPoster,
          backdrop_url: entry.backdrop_url || null,
          cover_url: resolvedPoster,
          banner_url: entry.backdrop_url || null,
          year: entry.release_year || null,
          release_date: entry.release_year ? `${entry.release_year}-01-01` : undefined,
          status: 'Released',
          rating_average: 8.0 + ((entry.position || 1) % 15) * 0.1,
          popularity: 100 - (entry.position || 0),
          franchise_id: universe.id,
          franchise_name: universe.name,
          order_in_franchise: entry.position,
          genres: itemGenres,
          industries,
          primary_industry: primaryIndustry,
          countries,
          languages: primaryLanguage === 'en' ? ['English'] : primaryLanguage === 'hi' ? ['Hindi'] : primaryLanguage === 'te' ? ['Telugu'] : primaryLanguage === 'ta' ? ['Tamil'] : primaryLanguage === 'ml' ? ['Malayalam'] : primaryLanguage === 'kn' ? ['Kannada'] : ['Japanese'],
          primary_language: primaryLanguage
        });
      }
    }
  }

  return extracted;
}

// Additional standalone blockbuster titles to ensure rich coverage across every industry & genre
const ADDITIONAL_STANDALONE_TITLES: ContentItem[] = [
  // Hollywood
  {
    id: 'tmdb-m-155',
    content_type: 'movie',
    title: 'The Dark Knight',
    original_title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and DA Harvey Dent, confronting the criminal mastermind known as the Joker.',
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    year: 2008,
    release_date: '2008-07-18',
    status: 'Released',
    rating_average: 9.0,
    popularity: 125.0,
    genres: ['Drama', 'Action', 'Crime', 'Thriller'],
    industries: ['Hollywood'],
    primary_industry: 'hollywood',
    countries: ['US', 'GB'],
    languages: ['English'],
    primary_language: 'en'
  },
  {
    id: 'tmdb-m-414906',
    content_type: 'movie',
    title: 'The Batman',
    original_title: 'The Batman',
    overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing the Riddler.',
    poster_url: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    year: 2022,
    release_date: '2022-03-04',
    status: 'Released',
    rating_average: 7.9,
    popularity: 110.0,
    genres: ['Action', 'Crime', 'Drama', 'Mystery'],
    industries: ['Hollywood'],
    primary_industry: 'hollywood',
    countries: ['US'],
    languages: ['English'],
    primary_language: 'en'
  },
  {
    id: 'tmdb-m-120',
    content_type: 'movie',
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    original_title: 'The Lord of the Rings: The Fellowship of the Ring',
    overview: 'Young hobbit Frodo Baggins embarks on a perilous quest across Middle-earth to destroy the One Ring in Mount Doom.',
    poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/vRQnzOn4H106y3TyRiMMivB24uj.jpg',
    year: 2001,
    release_date: '2001-12-19',
    status: 'Released',
    rating_average: 8.8,
    popularity: 115.0,
    genres: ['Adventure', 'Fantasy', 'Action'],
    industries: ['Hollywood'],
    primary_industry: 'hollywood',
    countries: ['NZ', 'US'],
    languages: ['English'],
    primary_language: 'en'
  },
  {
    id: 'tmdb-m-671',
    content_type: 'movie',
    title: "Harry Potter and the Sorcerer's Stone",
    original_title: "Harry Potter and the Philosopher's Stone",
    overview: 'Harry Potter discovers on his eleventh birthday that he is the orphaned son of two powerful wizards and possesses unique magical powers.',
    poster_url: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hziiv146OpD7qDoBttrUVZAvRXZ.jpg',
    year: 2001,
    release_date: '2001-11-16',
    status: 'Released',
    rating_average: 7.9,
    popularity: 105.0,
    genres: ['Adventure', 'Fantasy'],
    industries: ['Hollywood'],
    primary_industry: 'hollywood',
    countries: ['GB', 'US'],
    languages: ['English'],
    primary_language: 'en'
  },
  // Indian Cinema - Tollywood
  {
    id: 'tmdb-m-753342',
    content_type: 'movie',
    title: 'Kalki 2898 AD',
    original_title: 'కల్కి 2898 AD',
    overview: 'Set in a post-apocalyptic world in the year 2898 AD, a bounty hunter named Bhairava and an immortal warrior protect the mother of the prophesied avatar Kalki.',
    poster_url: 'https://image.tmdb.org/t/p/w500/z6hOik164z7QhS3s3V46q9a7z1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/7c9UVPPiTPltouxSh26Af9VZ9P.jpg',
    year: 2024,
    release_date: '2024-06-27',
    status: 'Released',
    rating_average: 7.7,
    popularity: 130.0,
    genres: ['Science Fiction', 'Action', 'Fantasy', 'Adventure'],
    industries: ['Tollywood'],
    primary_industry: 'tollywood',
    countries: ['IN'],
    languages: ['Telugu', 'Hindi', 'Tamil'],
    primary_language: 'te'
  },
  {
    id: 'tmdb-m-739542',
    content_type: 'movie',
    title: 'Pushpa: The Rise',
    original_title: 'పుష్ప: ది రైజ్',
    overview: 'Pushpa Raj, a red sandalwood smuggler, rises through the ranks of an illegal syndicate in the Seshachalam forests.',
    poster_url: 'https://image.tmdb.org/t/p/w500/pIdxd0gE6u8Xp2Yd0g9V8X5t4j5.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/kWp01n6Qh3Q9F5CsqyP2kE43M0O.jpg',
    year: 2021,
    release_date: '2021-12-17',
    status: 'Released',
    rating_average: 7.6,
    popularity: 95.0,
    genres: ['Action', 'Crime', 'Drama'],
    industries: ['Tollywood'],
    primary_industry: 'tollywood',
    countries: ['IN'],
    languages: ['Telugu', 'Hindi', 'Tamil'],
    primary_language: 'te'
  },
  // Indian Cinema - Kollywood
  {
    id: 'tmdb-m-792307',
    content_type: 'movie',
    title: 'Leo',
    original_title: 'லியோ',
    overview: 'Parthiban, a mild-mannered cafe owner in Himachal Pradesh, is targeted by a ruthless cartel who believe he is former gangster Leo Das.',
    poster_url: 'https://image.tmdb.org/t/p/w500/pD6qqyOpq2ogsp3477F5Yp5X4Zz.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4u2P8o2J6M6o8v9z8o2J6M6o8v.jpg',
    year: 2023,
    release_date: '2023-10-19',
    status: 'Released',
    rating_average: 7.4,
    popularity: 110.0,
    genres: ['Action', 'Thriller', 'Crime'],
    industries: ['Kollywood'],
    primary_industry: 'kollywood',
    countries: ['IN'],
    languages: ['Tamil', 'Telugu', 'Hindi'],
    primary_language: 'ta'
  },
  {
    id: 'tmdb-m-622855',
    content_type: 'movie',
    title: 'Kaithi',
    original_title: 'கைதி',
    overview: 'A recently released prisoner on his way to see his daughter drives a truck full of poisoned cops to hospital while pursued by drug dealers.',
    poster_url: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    year: 2019,
    release_date: '2019-10-25',
    status: 'Released',
    rating_average: 8.1,
    popularity: 85.0,
    genres: ['Action', 'Thriller', 'Crime'],
    industries: ['Kollywood'],
    primary_industry: 'kollywood',
    countries: ['IN'],
    languages: ['Tamil'],
    primary_language: 'ta'
  },
  // Indian Cinema - Mollywood
  {
    id: 'tmdb-m-1214484',
    content_type: 'movie',
    title: 'Aavesham',
    original_title: 'ആവേശം',
    overview: 'Three engineering students in Bangalore get beaten up by seniors and seek the help of a quirky local gangster named Ranga.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    year: 2024,
    release_date: '2024-04-11',
    status: 'Released',
    rating_average: 8.0,
    popularity: 90.0,
    genres: ['Action', 'Comedy', 'Drama'],
    industries: ['Mollywood'],
    primary_industry: 'mollywood',
    countries: ['IN'],
    languages: ['Malayalam'],
    primary_language: 'ml'
  },
  {
    id: 'tmdb-m-1234568',
    content_type: 'movie',
    title: 'Bramayugam',
    original_title: 'ഭ്രമയുഗം',
    overview: 'A folk singer in 17th century Malabar seeks refuge in a mysterious manor, uncovering dark sorcery and psychological bondage.',
    poster_url: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/b1uU3cR5c38uXlO4J3q5RzW8qYp.jpg',
    year: 2024,
    release_date: '2024-02-15',
    status: 'Released',
    rating_average: 8.2,
    popularity: 88.0,
    genres: ['Horror', 'Mystery', 'Thriller', 'Fantasy'],
    industries: ['Mollywood'],
    primary_industry: 'mollywood',
    countries: ['IN'],
    languages: ['Malayalam'],
    primary_language: 'ml'
  },
  // Indian Cinema - Sandalwood
  {
    id: 'tmdb-m-583407',
    content_type: 'movie',
    title: 'K.G.F: Chapter 2',
    original_title: 'ಕೆ.ಜಿ.ಎಫ್: ಅಧ್ಯಾಯ ೨',
    overview: 'The blood-soaked land of Kolar Gold Fields has a new overlord now - Rocky, whose name strikes fear into the heart of his foes and government alike.',
    poster_url: 'https://image.tmdb.org/t/p/w500/64TspJ4uvwPzD1V68z7h7V08t9E.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/7c9UVPPiTPltouxSh26Af9VZ9P.jpg',
    year: 2022,
    release_date: '2022-04-14',
    status: 'Released',
    rating_average: 8.3,
    popularity: 115.0,
    genres: ['Action', 'Crime', 'Drama'],
    industries: ['Sandalwood'],
    primary_industry: 'sandalwood',
    countries: ['IN'],
    languages: ['Kannada', 'Hindi', 'Telugu', 'Tamil'],
    primary_language: 'kn'
  },
  {
    id: 'tmdb-m-1025544',
    content_type: 'movie',
    title: 'Kantara',
    original_title: 'ಕಾಂತಾರ',
    overview: 'When greed paves the way for betrayal, scheming and murder, a young tribal man enlists the power of the woodland deities to defend his ancestral land.',
    poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/jXJxMcVoBAZ01Gtf720iBrmbFqV.jpg',
    year: 2022,
    release_date: '2022-09-30',
    status: 'Released',
    rating_average: 8.3,
    popularity: 92.0,
    genres: ['Action', 'Drama', 'Fantasy', 'Thriller'],
    industries: ['Sandalwood'],
    primary_industry: 'sandalwood',
    countries: ['IN'],
    languages: ['Kannada'],
    primary_language: 'kn'
  },
  // Korean Cinema & K-Drama
  {
    id: 'tmdb-m-396535',
    content_type: 'movie',
    title: 'Train to Busan',
    original_title: '부산행',
    overview: 'While a zombie virus breaks out in South Korea, passengers on a train from Seoul to Busan struggle to survive.',
    poster_url: 'https://image.tmdb.org/t/p/w500/vNVFt6dtcqnL74BZsgrPnrRuvPy.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg',
    year: 2016,
    release_date: '2016-07-20',
    status: 'Released',
    rating_average: 8.0,
    popularity: 98.0,
    genres: ['Action', 'Horror', 'Thriller'],
    industries: ['Korean Cinema & K-Drama'],
    primary_industry: 'korean_cinema',
    countries: ['KR'],
    languages: ['Korean'],
    primary_language: 'ko'
  },
  {
    id: 'tmdb-tv-136283',
    content_type: 'drama',
    title: 'The Glory',
    original_title: '더 글로리',
    overview: 'A woman who survived horrific high school bullying puts an elaborate revenge scheme in motion to make the perpetrators pay.',
    poster_url: 'https://image.tmdb.org/t/p/w500/6O19pQSwmPp1m2Y5L3i0ydDclJo.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/2meX1nMdScFOoV4370rqHWKmX0d.jpg',
    year: 2022,
    release_date: '2022-12-30',
    status: 'Completed',
    rating_average: 8.5,
    popularity: 112.0,
    genres: ['Drama', 'Thriller', 'Mystery'],
    industries: ['Korean Cinema & K-Drama'],
    primary_industry: 'korean_cinema',
    countries: ['KR'],
    languages: ['Korean'],
    primary_language: 'ko',
    seasons_count: 1,
    episodes_count: 16
  },
  // Japanese Cinema & Anime
  {
    id: 'tmdb-m-129',
    content_type: 'anime',
    title: 'Spirited Away',
    original_title: '千と千尋の神隠し',
    overview: 'A young girl wanders into a magical world ruled by spirits, witches, and gods, where humans are changed into beasts.',
    poster_url: 'https://image.tmdb.org/t/p/w500/393mhUQRIikJj7ZtBf68sRknx0G.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    year: 2001,
    release_date: '2001-07-20',
    status: 'Released',
    rating_average: 8.5,
    popularity: 110.0,
    genres: ['Animation', 'Fantasy', 'Adventure', 'Family'],
    industries: ['Anime Industry', 'Japanese Cinema & Anime'],
    primary_industry: 'anime_industry',
    countries: ['JP'],
    languages: ['Japanese'],
    primary_language: 'ja'
  },
  {
    id: 'tmdb-m-916224',
    content_type: 'anime',
    title: 'Suzume',
    original_title: 'すずめの戸締まり',
    overview: 'A 17-year-old girl named Suzume helps a mysterious young man close disaster-causing doors across ruins in Japan.',
    poster_url: 'https://image.tmdb.org/t/p/w500/q719qXXEzOoYaps6XZawPWhNUm7.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/dIWwZWOPZJJtA6tIfXZ8wJ89SSu.jpg',
    year: 2022,
    release_date: '2022-11-11',
    status: 'Released',
    rating_average: 7.9,
    popularity: 95.0,
    genres: ['Animation', 'Fantasy', 'Adventure', 'Drama'],
    industries: ['Anime Industry', 'Japanese Cinema & Anime'],
    primary_industry: 'anime_industry',
    countries: ['JP'],
    languages: ['Japanese'],
    primary_language: 'ja'
  }
];

let cachedUnifiedMaster: ContentItem[] | null = null;

/**
 * Returns the fully unified master content dataset
 */
export function getUnifiedMasterContent(): ContentItem[] {
  if (cachedUnifiedMaster) return cachedUnifiedMaster;

  const dataset: ContentItem[] = [];
  const seenIds = new Set<string>();

  const registerItem = (item: ContentItem) => {
    if (!item || !item.id) return;
    const cleanId = String(item.id).toLowerCase();
    if (seenIds.has(cleanId)) return;
    seenIds.add(cleanId);
    dataset.push(item);
  };

  // 1. Curated Multi-Regional Test Dataset
  MULTI_REGIONAL_TEST_DATASET.forEach(registerItem);

  // 2. Extracted Universe Titles
  extractUniverseTitles().forEach(registerItem);

  // 3. Additional Standalone Flagships
  ADDITIONAL_STANDALONE_TITLES.forEach(registerItem);

  // 4. Sample Manga & Comics
  SAMPLE_MANGA.forEach((m) => {
    registerItem(mangaToContentItem(m));
  });

  cachedUnifiedMaster = dataset;
  return dataset;
}
