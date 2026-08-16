-- ==========================================================
-- Sample Seed Data for MangaShelf / LetMeCheck
-- ==========================================================

INSERT INTO public.manga (
    anilist_id,
    title,
    alternative_titles,
    description,
    type,
    status,
    author,
    artist,
    genres,
    chapters,
    volumes,
    cover_url,
    banner_url,
    source
) VALUES
(
    105398,
    'Solo Leveling',
    ARRAY['Na Honjaman Rebeleop', 'Only I Level Up', '나 혼자만 레벨업'],
    'In a world where hunters awakened with various magical powers battle deadly monsters to protect humanity, Sung Jinwoo is an infamous E-rank hunter known as "the weakest". After a catastrophic raid in a double dungeon, Jinwoo survives and gains a mysterious system that allows him to level up endlessly.',
    'Manhwa',
    'Completed',
    'Chugong',
    'DUBU (REDICE STUDIO)',
    ARRAY['Action', 'Adventure', 'Fantasy', 'Supernatural'],
    179,
    14,
    'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673No9ZqnW3.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-bCgYmZ5r93qR.jpg',
    'AniList'
),
(
    30002,
    'Berserk',
    ARRAY['ベルセルク', 'Kenpuu Denki Berserk'],
    'Guts, a former mercenary now known as the "Black Swordsman," is out for revenge. He travels a dark and grim world plagued by demons, corrupt nobles, and apostles of the God Hand.',
    'Manga',
    'Ongoing',
    'Kentaro Miura',
    'Studio Gaga',
    ARRAY['Action', 'Adventure', 'Dark Fantasy', 'Horror', 'Psychological'],
    375,
    42,
    'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-75KxEKb261tU.png',
    'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30002-3g9K8K3x9l7P.jpg',
    'AniList'
),
(
    119139,
    'Frieren: Beyond Journey''s End',
    ARRAY['Sousou no Frieren', '葬送のフリーレン'],
    'The adventure is over, but life goes on for an elf mage just beginning to learn what living is all about. Frieren defeated the Demon King alongside the hero party, but being an elf with a lifespan of thousands of years, she now explores what human connection meant.',
    'Manga',
    'Ongoing',
    'Kanehito Yamada',
    'Tsukasa Abe',
    ARRAY['Adventure', 'Drama', 'Fantasy', 'Slice of Life'],
    130,
    13,
    'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119139-Z1R1E7aJ646u.jpg',
    'https://s4.anilist.co/file/anilistcdn/media/manga/banner/119139-2zV9p3OsqxL2.jpg',
    'AniList'
)
ON CONFLICT (anilist_id) DO NOTHING;
