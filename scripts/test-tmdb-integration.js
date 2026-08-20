// ==========================================================
// Integration Test for TMDB Provider & Importer
// ==========================================================

import fs from 'fs';
import path from 'path';

// Helper to read .env file manually if exists
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim().replace(/^['"](.*)['"]$/, '$1');
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

async function runTests() {
  console.log('--- STARTING TMDB INTEGRATION TEST ---');
  const tmdbKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
  if (!tmdbKey) {
    console.error('ERROR: No TMDB API Key found in environment or .env file');
    process.exit(1);
  }
  console.log('TMDB API Key detected (length: ' + tmdbKey.length + ' chars)');

  // Import our providers and normalizers
  const { TmdbProvider } = await import('../src/services/providers/tmdb.js').catch(async () => {
    // If running in node without direct TS compile
    return await import('../dist/server.cjs').catch(() => null) || {};
  });
  
  console.log('Testing raw TMDB endpoints via fetch...');

  // Test 1: Movie (Inception)
  console.log('\n[TEST 1] Movie: Inception');
  const searchMovieRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=Inception&include_adult=false`);
  const movieData = await searchMovieRes.json();
  const inception = movieData.results?.[0];
  console.log('Result:', {
    id: inception?.id,
    title: inception?.title,
    release_date: inception?.release_date,
    original_language: inception?.original_language,
    overview_length: inception?.overview?.length,
    poster_path: inception?.poster_path
  });

  // Test 2: TV Series (Stranger Things)
  console.log('\n[TEST 2] TV series: Stranger Things');
  const searchTvRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=Stranger+Things&include_adult=false`);
  const tvData = await searchTvRes.json();
  const strangerThings = tvData.results?.[0];
  console.log('Result:', {
    id: strangerThings?.id,
    name: strangerThings?.name,
    first_air_date: strangerThings?.first_air_date,
    original_language: strangerThings?.original_language,
    overview_length: strangerThings?.overview?.length,
    poster_path: strangerThings?.poster_path
  });

  // Test 3: Anime (Demon Slayer)
  console.log('\n[TEST 3] Anime: Demon Slayer');
  const searchAnimeRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=Demon+Slayer&include_adult=false`);
  const animeData = await searchAnimeRes.json();
  const demonSlayer = animeData.results?.[0];
  console.log('Result:', {
    id: demonSlayer?.id,
    name: demonSlayer?.name,
    first_air_date: demonSlayer?.first_air_date,
    original_language: demonSlayer?.original_language,
    origin_country: demonSlayer?.origin_country,
    overview_length: demonSlayer?.overview?.length,
    poster_path: demonSlayer?.poster_path
  });

  // Test 4: Indian Regional Movie (RRR - Telugu)
  console.log('\n[TEST 4] Indian Regional Movie: RRR (Telugu)');
  const searchRegionalRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=RRR&include_adult=false`);
  const regionalData = await searchRegionalRes.json();
  const rrr = regionalData.results?.find(r => r.original_language === 'te') || regionalData.results?.[0];
  console.log('Result:', {
    id: rrr?.id,
    title: rrr?.title,
    original_title: rrr?.original_title,
    release_date: rrr?.release_date,
    original_language: rrr?.original_language,
    overview_length: rrr?.overview?.length,
    poster_path: rrr?.poster_path
  });
}

runTests().catch(console.error);
