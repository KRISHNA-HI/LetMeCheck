-- ==========================================================
-- Reference Dictionaries & Core Metadata Seed
-- Covers Content Types, Countries, Languages, Industries, Genres, Franchises
-- ==========================================================

-- 1. Content Types
INSERT INTO public.content_types (code, name, description, is_visual, is_literary) VALUES
('movie', 'Movie', 'Feature films and direct-to-video movies', true, false),
('tv_series', 'TV Series', 'Broadcast and network television series', true, false),
('web_series', 'Web Series', 'Streaming platform original series', true, false),
('anime', 'Anime', 'Japanese animation series and films', true, false),
('drama', 'Drama', 'Live-action television dramas (K-Drama, J-Drama, C-Drama)', true, false),
('manga', 'Manga', 'Japanese printed comics', false, true),
('manhwa', 'Manhwa', 'Korean digital/printed comics and webtoons', false, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_visual = EXCLUDED.is_visual,
  is_literary = EXCLUDED.is_literary;

-- 2. Countries
INSERT INTO public.countries (code, name, flag_emoji) VALUES
('IN', 'India', '🇮🇳'),
('US', 'United States', '🇺🇸'),
('JP', 'Japan', '🇯🇵'),
('KR', 'South Korea', '🇰🇷'),
('GB', 'United Kingdom', '🇬🇧'),
('CN', 'China', '🇨🇳'),
('FR', 'France', '🇫🇷'),
('DE', 'Germany', '🇩🇪'),
('CA', 'Canada', '🇨🇦'),
('AU', 'Australia', '🇦🇺'),
('ES', 'Spain', '🇪🇸'),
('IT', 'Italy', '🇮🇹'),
('TH', 'Thailand', '🇹🇭'),
('ID', 'Indonesia', '🇮🇩')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_emoji = EXCLUDED.flag_emoji;

-- 3. Languages
INSERT INTO public.languages (code, name, native_name) VALUES
('en', 'English', 'English'),
('hi', 'Hindi', 'हिन्दी'),
('te', 'Telugu', 'తెలుగు'),
('ta', 'Tamil', 'தமிழ்'),
('ml', 'Malayalam', 'മലയാളം'),
('kn', 'Kannada', 'ಕನ್ನಡ'),
('bn', 'Bengali', 'বাংলা'),
('mr', 'Marathi', 'मराठी'),
('pa', 'Punjabi', 'ਪੰਜਾਬੀ'),
('gu', 'Gujarati', 'ગુજરાતી'),
('ja', 'Japanese', '日本語'),
('ko', 'Korean', '한국어'),
('zh', 'Chinese', '中文'),
('es', 'Spanish', 'Español'),
('fr', 'French', 'Français'),
('de', 'German', 'Deutsch')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name;

-- 4. Industries & Film Hubs
INSERT INTO public.industries (code, name, region, country_code, primary_language_code, description) VALUES
('hollywood', 'Hollywood', 'North America', 'US', 'en', 'American mainstream & global cinema based in the US'),
('bollywood', 'Bollywood', 'Mumbai / North India', 'IN', 'hi', 'Hindi-language film industry of India'),
('tollywood', 'Tollywood', 'Hyderabad / Andhra & Telangana', 'IN', 'te', 'Telugu-language film industry of India'),
('kollywood', 'Kollywood', 'Chennai / Tamil Nadu', 'IN', 'ta', 'Tamil-language film industry of India'),
('mollywood', 'Mollywood', 'Kerala', 'IN', 'ml', 'Malayalam-language film industry of India renowned for storytelling'),
('sandalwood', 'Sandalwood', 'Bengaluru / Karnataka', 'IN', 'kn', 'Kannada-language film industry of India'),
('bengali_cinema', 'Bengali Cinema', 'Kolkata / West Bengal', 'IN', 'bn', 'Bengali-language art-house & mainstream film industry'),
('marathi_cinema', 'Marathi Cinema', 'Maharashtra', 'IN', 'mr', 'Marathi-language film industry of India'),
('punjabi_cinema', 'Pollywood', 'Punjab', 'IN', 'pa', 'Punjabi-language film industry'),
('japanese_cinema', 'Japanese Cinema & J-Drama', 'Japan', 'JP', 'ja', 'Japanese live-action cinema, television dramas, and tokusatsu'),
('korean_cinema', 'Korean Cinema & K-Drama', 'South Korea', 'KR', 'ko', 'South Korean cinema (Hallyuwood) and globally acclaimed K-Dramas'),
('chinese_cinema', 'Chinese Cinema & C-Drama', 'China', 'CN', 'zh', 'Mainland China, Hong Kong, and Taiwanese cinema and period dramas'),
('anime_industry', 'Anime Industry', 'Japan', 'JP', 'ja', 'Japanese animated television series, films, and original video animations')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  country_code = EXCLUDED.country_code,
  primary_language_code = EXCLUDED.primary_language_code,
  description = EXCLUDED.description;

-- 5. Genres
INSERT INTO public.genres (name, slug, description) VALUES
('Action', 'action', 'High-energy sequences, combat, physical stunts, and chases'),
('Adventure', 'adventure', 'Journeys, explorations, quests, and grand encounters'),
('Animation', 'animation', '2D, 3D, CGI, and hand-drawn illustrated entertainment'),
('Comedy', 'comedy', 'Lighthearted humor, satire, parody, and entertainment'),
('Crime', 'crime', 'Heists, criminal underworlds, mafia, and investigations'),
('Documentary', 'documentary', 'Real-world exploration, historical recounts, and biographical studies'),
('Drama', 'drama', 'Character-driven emotional depth, conflict, and societal themes'),
('Family', 'family', 'Wholesome entertainment suitable for all ages and family viewing'),
('Fantasy', 'fantasy', 'Magic, mythical creatures, supernatural realms, and high-concept worlds'),
('History', 'history', 'Period pieces, historical biographies, and factual recreations'),
('Horror', 'horror', 'Suspense, psychological terror, monsters, and the supernatural'),
('Music', 'music', 'Musical scores, performance narratives, and sound-driven stories'),
('Mystery', 'mystery', 'Puzzles, detective whodunits, conspiracies, and suspenseful plotlines'),
('Romance', 'romance', 'Love stories, relationships, emotional connections, and intimacy'),
('Science Fiction', 'sci-fi', 'Futuristic technology, space exploration, time travel, and sci-fi concepts'),
('Thriller', 'thriller', 'High stakes, psychological tension, edge-of-the-seat pacing'),
('War', 'war', 'Military conflicts, battlefield narratives, and wartime resilience'),
('Western', 'western', 'Frontier survival, outlaws, gunfights, and dusty landscapes'),
('Psychological', 'psychological', 'Deep mental conflict, psychological tension, and mind games'),
('Supernatural', 'supernatural', 'Ghosts, occult, paranormal occurrences, and mythical phenomena')
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- 6. Sample Master Franchises (Conjuring Universe, MCU, Fast & Furious, Harry Potter)
INSERT INTO public.franchises (name, original_name, slug, description) VALUES
('The Conjuring Universe', 'The Conjuring Universe', 'the-conjuring-universe', 'The horror cinematic universe centered around paranormal investigators Ed and Lorraine Warren and haunted artifacts.'),
('Marvel Cinematic Universe', 'Marvel Cinematic Universe', 'mcu', 'The interconnected superhero universe produced by Marvel Studios spanning Infinity Saga and Multiverse Saga.'),
('Fast & Furious', 'The Fast and the Furious', 'fast-and-furious', 'The global action franchise centered on illegal street racing, high-octane heists, and family allegiance.'),
('Harry Potter & Wizarding World', 'Wizarding World', 'wizarding-world', 'The fantasy universe created by J.K. Rowling featuring the Hogwarts saga and Fantastic Beasts.')
ON CONFLICT (slug) DO NOTHING;
