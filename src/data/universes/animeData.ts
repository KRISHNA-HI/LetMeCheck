import { Universe } from '../../types/content';

export const ANIME_UNIVERSES: Universe[] = [
  // 1. Jujutsu Kaisen
  {
    id: 'jujutsu-kaisen',
    name: 'Jujutsu Kaisen',
    original_name: '呪術廻戦 (Jujutsu Kaisen)',
    slug: 'jujutsu-kaisen',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Dark Fantasy', 'Supernatural'],
    description: 'Gege Akutami’s dark fantasy masterpiece following Yuji Itadori, Satoru Gojo, and jujutsu sorcerers combating malevolent cursed spirits.',
    poster_url: 'https://image.tmdb.org/t/p/w500/hD05Ur1wN8Qv2M2xTzN3q9Y8o1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9vE7iO37H3WjP7e408qE7P1R3j8.jpg',
    available_orders: [
      {
        id: 'jjk-chronological',
        universe_id: 'jujutsu-kaisen',
        name: 'In-Universe Story Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'Prequel movie JJK 0 introduces Yuta Okkotsu and Gojo’s past before Yuji’s journey.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-131573', title: 'Jujutsu Kaisen 0 (Movie)', release_year: 2021, context: 'Prequel (2017)', explanation: 'Yuta Okkotsu joins Tokyo Jujutsu High to break the curse of Rika Orimoto.' },
          { position: 2, content_id: 'anilist-113415', title: 'Jujutsu Kaisen (Season 1)', release_year: 2020, context: 'Fearsome Womb to Origin of Obedience', explanation: 'Yuji Itadori swallows Ryomen Sukuna’s cursed finger and enters the sorcery world.' },
          { position: 3, content_id: 'anilist-145064', title: 'Jujutsu Kaisen (Season 2)', release_year: 2023, context: 'Hidden Inventory & Shibuya Incident', explanation: 'Gojo and Geto’s teenage past followed by the catastrophic Shibuya Incident.' }
        ]
      },
      {
        id: 'jjk-release',
        universe_id: 'jujutsu-kaisen',
        name: 'Broadcast Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Season 1 followed by JJK 0 movie and Season 2.',
        is_default: false,
        ordered_entries: [
          { position: 1, content_id: 'anilist-113415', title: 'Jujutsu Kaisen (Season 1)', release_year: 2020 },
          { position: 2, content_id: 'anilist-131573', title: 'Jujutsu Kaisen 0 (Movie)', release_year: 2021 },
          { position: 3, content_id: 'anilist-145064', title: 'Jujutsu Kaisen (Season 2)', release_year: 2023 }
        ]
      }
    ]
  },

  // 2. Dragon Ball Franchise
  {
    id: 'dragon-ball',
    name: 'Dragon Ball Saga',
    original_name: 'ドラゴンボール (Dragon Ball)',
    slug: 'dragon-ball',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    description: 'Akira Toriyama’s legendary shonen saga following Son Goku from childhood martial arts training to multiversal godhood.',
    poster_url: 'https://image.tmdb.org/t/p/w500/tShQt1wN8Qv2M2xTzN3q9Y8o1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9kF1WqW0qG7QeF1M7v9W1Y.jpg',
    available_orders: [
      {
        id: 'db-chronological',
        universe_id: 'dragon-ball',
        name: 'Canon Chronological Timeline',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Follow Goku’s official canon timeline from childhood through Dragon Ball Daima.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-223', title: 'Dragon Ball (Original Series)', release_year: 1986, context: 'Goku’s Youth', explanation: 'Goku meets Bulma, trains under Master Roshi, and defeats the Red Ribbon Army and King Piccolo.' },
          { position: 2, content_id: 'anilist-813', title: 'Dragon Ball Z / DBZ Kai', release_year: 1989, context: 'Saiyan to Buu Sagas', explanation: 'Goku discovers his Saiyan heritage and battles Vegeta, Frieza, Cell, and Majin Buu.' },
          { position: 3, content_id: 'anilist-21175', title: 'Dragon Ball Super', release_year: 2015, context: 'Gods & Multiverse', explanation: 'Goku encounters Lord Beerus and competes in the Tournament of Power.' },
          { position: 4, content_id: 'anilist-101280', title: 'Dragon Ball Super: Broly (Movie)', release_year: 2018, context: 'Canon Film', explanation: 'Goku and Vegeta fuse into Gogeta to battle the legendary Saiyan Broly.' },
          { position: 5, content_id: 'anilist-133373', title: 'Dragon Ball Super: Super Hero (Movie)', release_year: 2022, context: 'Gohan Beast Awakening', explanation: 'Gohan and Piccolo defend Earth against the Red Ribbon Army and Cell Max.' },
          { position: 6, content_id: 'anilist-168128', title: 'Dragon Ball Daima', release_year: 2024, context: 'Demon Realm Adventure', explanation: 'Goku and companions are turned small by a conspiracy and travel to the Demon Realm.' }
        ]
      }
    ]
  },

  // 3. Demon Slayer (Kimetsu no Yaiba)
  {
    id: 'demon-slayer',
    name: 'Demon Slayer: Kimetsu no Yaiba',
    original_name: '鬼滅の刃 (Kimetsu no Yaiba)',
    slug: 'demon-slayer',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Fantasy', 'Historical'],
    description: 'Koyoharu Gotouge and ufotable’s visual masterpiece following Tanjiro Kamado on his quest to cure his demon sister Nezuko.',
    poster_url: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH69Q7L6x0bUMMTg.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg',
    available_orders: [
      {
        id: 'demon-slayer-chronological',
        universe_id: 'demon-slayer',
        name: 'Story Arc Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'Complete animated story from Final Selection through the Hashira Training Arc.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-101922', title: 'Demon Slayer: Kimetsu no Yaiba (Season 1)', release_year: 2019, context: 'Final Selection to Natagumo Mountain', explanation: 'Tanjiro joins the Demon Slayer Corps and battles Rui with Hinokami Kagura.' },
          { position: 2, content_id: 'anilist-112151', title: 'Demon Slayer: Mugen Train (Movie / Arc)', release_year: 2020, context: 'Mugen Train Arc', explanation: 'Tanjiro and Flame Hashira Kyojuro Rengoku battle Lower One Enmu and Upper Three Akaza.' },
          { position: 3, content_id: 'anilist-129874', title: 'Demon Slayer: Entertainment District Arc (Season 2)', release_year: 2021, context: 'Yoshiwara District', explanation: 'Tanjiro, Zenitsu, and Inosuke accompany Sound Hashira Tengen Uzui against Upper Six Gyutaro & Daki.' },
          { position: 4, content_id: 'anilist-145139', title: 'Demon Slayer: Swordsmith Village Arc (Season 3)', release_year: 2023, context: 'Swordsmith Village', explanation: 'Tanjiro unites with Muichiro Tokito and Mitsuri Kanroji against Upper Four and Five.' },
          { position: 5, content_id: 'anilist-166240', title: 'Demon Slayer: Hashira Training Arc (Season 4)', release_year: 2024, context: 'Hashira Training', explanation: 'The Demon Slayer Corps undertakes grueling Hashira training preparing for the final battle against Muzan.' }
        ]
      }
    ]
  },

  // 4. Naruto & Boruto Ninja Saga
  {
    id: 'naruto-boruto-saga',
    name: 'Naruto & Boruto Ninja Saga',
    original_name: 'NARUTO -ナルト- / BORUTO',
    slug: 'naruto',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    description: 'Masashi Kishimoto’s epic shinobi saga covering Naruto Uzumaki’s dream of becoming Hokage through Boruto: Two Blue Vortex.',
    poster_url: 'https://image.tmdb.org/t/p/w500/77k9vY8oU8kGkQZfKzWJ2t7vP8y.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    available_orders: [
      {
        id: 'naruto-chronological',
        universe_id: 'naruto-boruto-saga',
        name: 'Shinobi Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From the Academy in the Hidden Leaf to the Fourth Great Ninja War and Boruto.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-20', title: 'Naruto (Part I)', release_year: 2002, context: 'Genin Era', explanation: 'Naruto forms Team 7 with Sasuke and Sakura under Kakashi Hatake.' },
          { position: 2, content_id: 'anilist-1735', title: 'Naruto: Shippuden', release_year: 2007, context: 'Akatsuki & War Arc', explanation: 'Naruto returns to save Gaara, battle Pain, and fight the Fourth Great Ninja War.' },
          { position: 3, content_id: 'anilist-16870', title: 'The Last: Naruto the Movie', release_year: 2014, context: 'Canon Epilogue', explanation: 'Naruto battles Toneri Otsutsuki on the Moon and realizes his love for Hinata.' },
          { position: 4, content_id: 'anilist-97938', title: 'Boruto: Naruto Next Generations', release_year: 2017, context: 'Next Generation', explanation: 'Boruto Uzumaki navigates high-tech shinobi threats and the Otsutsuki clan.' }
        ]
      }
    ]
  },

  // 5. One Piece
  {
    id: 'one-piece-saga',
    name: 'One Piece',
    original_name: 'ONE PIECE (ワンピース)',
    slug: 'one-piece',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    description: 'Eiichiro Oda’s unmatched pirate odyssey following Monkey D. Luffy and the Straw Hat Pirates across the Grand Line for the legendary One Piece treasure.',
    poster_url: 'https://image.tmdb.org/t/p/w500/cMD9Ygz11xYdgii51I3r2J02Z2.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    available_orders: [
      {
        id: 'one-piece-chronological',
        universe_id: 'one-piece-saga',
        name: 'Grand Line Story Saga Order',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From East Blue, Alabasta, Water 7, Marineford, Dressrosa, Wano Country to Egghead Island.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-21', title: 'One Piece: East Blue to Marineford (Part 1)', release_year: 1999, context: 'Pre-Timeskip', explanation: 'Luffy gathers his crew and challenges the World Government at Marineford.' },
          { position: 2, content_id: 'anilist-21-pt2', title: 'One Piece: Fishman Island to Wano (Part 2)', release_year: 2011, context: 'New World Saga', explanation: 'The Straw Hats enter the New World, ally with Law, and defeat Emperor Kaido in Wano.' },
          { position: 3, content_id: 'anilist-142838', title: 'One Piece Film: Red', release_year: 2022, context: 'Uta Concert', explanation: 'Red-Haired Shanks’ daughter Uta seeks to create a new era of eternal happiness with music.' },
          { position: 4, content_id: 'anilist-21-egghead', title: 'One Piece: Egghead Island Arc', release_year: 2024, context: 'Final Saga Begins', explanation: 'The Straw Hats arrive on Dr. Vegapunk’s futuristic island as the secrets of the Void Century unfold.' }
        ]
      }
    ]
  },

  // 6. Attack on Titan (Shingeki no Kyojin)
  {
    id: 'attack-on-titan',
    name: 'Attack on Titan',
    original_name: '進撃の巨人 (Shingeki no Kyojin)',
    slug: 'attack-on-titan',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Dark Fantasy', 'Drama'],
    description: 'Hajime Isayama’s monumental saga following Eren Yeager, Mikasa Ackerman, and the Scout Regiment battling man-eating Titans.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8C9nS01r1CMDvyUbvdme394fnSd.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg',
    available_orders: [
      {
        id: 'aot-order',
        universe_id: 'attack-on-titan',
        name: 'The Fall of Paradis to the Rumbling',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'Complete 4-season progression from the Fall of Wall Maria through The Final Chapters.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-16498', title: 'Attack on Titan (Season 1)', release_year: 2013, context: 'Fall of Shiganshina & Female Titan', explanation: 'Eren Yeager joins the Scouts and discovers his Attack Titan powers.' },
          { position: 2, content_id: 'anilist-20958', title: 'Attack on Titan (Season 2)', release_year: 2017, context: 'Clash of the Titans', explanation: 'The identities of the Armored and Colossal Titans are revealed.' },
          { position: 3, content_id: 'anilist-99147', title: 'Attack on Titan (Season 3)', release_year: 2018, context: 'Uprising & Return to Shiganshina', explanation: 'The Scouts retake Wall Maria and discover the truth of the world in Grisha’s basement.' },
          { position: 4, content_id: 'anilist-110277', title: 'Attack on Titan: The Final Season', release_year: 2020, context: 'Marley & The Rumbling', explanation: 'Eren initiates the Rumbling across the globe as former allies unite to stop him.' }
        ]
      }
    ]
  },

  // 7. Bleach
  {
    id: 'bleach-universe',
    name: 'Bleach Saga',
    original_name: 'BLEACH (ブリーチ)',
    slug: 'bleach',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'japan',
    genres: ['Animation', 'Action', 'Supernatural', 'Adventure'],
    description: 'Tite Kubo’s supernatural shonen epic starring substitute Soul Reaper Ichigo Kurosaki protecting the living world and Soul Society.',
    poster_url: 'https://image.tmdb.org/t/p/w500/2EewFaZrORbKNq589tQZ97oQ1v4.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg',
    available_orders: [
      {
        id: 'bleach-order',
        universe_id: 'bleach-universe',
        name: 'Soul Reaper to Thousand-Year Blood War',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From Ichigo meeting Rukia to the war against Yhwach and the Quincy Wandenreich.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'anilist-269', title: 'Bleach (Original Series)', release_year: 2004, context: 'Soul Society & Arrancar Arcs', explanation: 'Ichigo masters Bankai and Hollowfication to stop Sosuke Aizen.' },
          { position: 2, content_id: 'anilist-114446', title: 'Bleach: Thousand-Year Blood War (Parts 1–3)', release_year: 2022, context: 'Quincy Blood War', explanation: 'Yhwach leads the Quincy Sternritter to eradicate the Soul Society and Soul King.' }
        ]
      }
    ]
  }
];
