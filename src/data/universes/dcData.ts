import { Universe } from '../../types/content';

export const DC_UNIVERSES: Universe[] = [
  // 1. DC Extended Universe (DCEU) - Zack Snyder to Aquaman 2
  {
    id: 'dceu',
    name: 'DC Extended Universe (DCEU)',
    original_name: 'DC Extended Universe (2013–2023)',
    slug: 'dceu',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Adventure', 'Fantasy', 'Science Fiction'],
    description: 'The 16-title cinematic continuity launched with Man of Steel (2013) through Aquaman and the Lost Kingdom (2023).',
    poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/jXJxMcVoBAZ01Gtf720iBrmbFqV.jpg',
    available_orders: [
      {
        id: 'dceu-release',
        universe_id: 'dceu',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Watch all 16 DCEU films and series in their official theatrical release sequence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-49521', title: 'Man of Steel', release_year: 2013, poster_url: 'https://image.tmdb.org/t/p/w500/7rIPjn5elwrna0uK7A2W09JbgxD.jpg', context: 'Origins', explanation: 'Clark Kent discovers his Kryptonian origins and battles General Zod.' },
          { position: 2, content_id: 'tmdb-m-209112', title: 'Batman v Superman: Dawn of Justice', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/5UsK3grJvtQrtzEgqNlDljJW96w.jpg', context: 'Trinity Assembled', explanation: 'Batman and Superman clash while Lex Luthor creates Doomsday.' },
          { position: 3, content_id: 'tmdb-m-297761', title: 'Suicide Squad', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/xF7T5q0V3kO1uN9D8C8uFpT1U5S.jpg', context: 'Task Force X', explanation: 'Amanda Waller recruits Belle Reve inmates for a black-ops mission in Midway City.' },
          { position: 4, content_id: 'tmdb-m-297762', title: 'Wonder Woman', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/imekS7f1OuHyUP2LAiTEM0zFvI8.jpg', context: 'WWI Period', explanation: 'Diana Prince leaves Themyscira to end World War I and defeat Ares.' },
          { position: 5, content_id: 'tmdb-m-141052', title: 'Justice League', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/eifGNCSDuxJeS16RA85da423KOo.jpg', context: 'League Assemble', explanation: 'Batman and Wonder Woman recruit Flash, Aquaman, and Cyborg against Steppenwolf.' },
          { position: 6, content_id: 'tmdb-m-297802', title: 'Aquaman', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/5Kg76ldv7VxeX9YlcQXiowHgdX6.jpg', context: 'Atlantis', explanation: 'Arthur Curry claims the Trident of Atlan to become King of Atlantis.' },
          { position: 7, content_id: 'tmdb-m-287947', title: 'Shazam!', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/xnopI5Xtky18MPhK40cZAGAOVeV.jpg', context: 'Magic Realm', explanation: 'Billy Batson is bestowed ancient magical powers by the Wizard Shazam.' },
          { position: 8, content_id: 'tmdb-m-495764', title: 'Birds of Prey', release_year: 2020, poster_url: 'https://image.tmdb.org/t/p/w500/h4BGflmbbbIb824KnTeMuAmCI28.jpg', context: 'Gotham', explanation: 'Harley Quinn teams with Huntress, Black Canary, and Renee Montoya against Black Mask.' },
          { position: 9, content_id: 'tmdb-m-464052', title: 'Wonder Woman 1984', release_year: 2020, poster_url: 'https://image.tmdb.org/t/p/w500/8UlWqw29v4QY9IL90aPrjY10fJ5.jpg', context: 'Cold War Era', explanation: 'Diana faces Maxwell Lord and Cheetah wielding the Dreamstone in 1984.' },
          { position: 10, content_id: 'tmdb-m-436969', title: 'The Suicide Squad', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/kb4gvsmj00ll8E7flAhHqF6955.jpg', context: 'Corto Maltese', explanation: 'James Gunn’s Task Force X infiltrates Jotunheim to destroy Project Starfish.' },
          { position: 11, content_id: 'tmdb-tv-110492', title: 'Peacemaker (Season 1)', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/hE3LRZAY8cuGKUOKvd93NH7emu5.jpg', context: 'Project Butterfly', explanation: 'Christopher Smith joins an A.R.G.U.S. black-ops team targeting alien butterflies.' },
          { position: 12, content_id: 'tmdb-m-436270', title: 'Black Adam', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg', context: 'Kahndaq', explanation: 'Teth-Adam is freed after 5,000 years to defend Kahndaq against the Justice Society.' },
          { position: 13, content_id: 'tmdb-m-594767', title: 'Shazam! Fury of the Gods', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/A3zbZsmsvNGdgm2LKT3T979dnIy.jpg', context: 'Daughters of Atlas', explanation: 'The Shazam family battles Hespera, Kalypso, and Anthea for the Staff of the Gods.' },
          { position: 14, content_id: 'tmdb-m-298618', title: 'The Flash', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', context: 'Flashpoint', explanation: 'Barry Allen alters the timeline to save his mother, creating a multiversal collapse.' },
          { position: 15, content_id: 'tmdb-m-569094', title: 'Blue Beetle', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/mXLOHHc1Zeuwsl4xYKjKh2280ne.jpg', context: 'Palmera City', explanation: 'Jaime Reyes is chosen by the ancient alien Scarab Khaji-Da.' },
          { position: 16, content_id: 'tmdb-m-572802', title: 'Aquaman and the Lost Kingdom', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/7lTnndQzgunNV0V06NP627slHq5.jpg', context: 'DCEU Finale', explanation: 'Arthur Curry allies with Orm to prevent Black Manta from destroying the world with the Black Trident.' }
        ]
      },
      {
        id: 'dceu-chronological',
        universe_id: 'dceu',
        name: 'In-Universe Chronological Timeline',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Follow the historical timeline of the DCEU from Diana’s early adventures in 1918 through the finale.',
        is_default: false,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-297762', title: 'Wonder Woman', release_year: 2017, context: '1918 (WWI)', explanation: 'Diana Prince’s first interaction with mankind during World War I.' },
          { position: 2, content_id: 'tmdb-m-464052', title: 'Wonder Woman 1984', release_year: 2020, context: '1984', explanation: 'Diana living in Washington, D.C. during the Cold War.' },
          { position: 3, content_id: 'tmdb-m-49521', title: 'Man of Steel', release_year: 2013, context: '2013', explanation: 'The Black Zero event in Metropolis.' },
          { position: 4, content_id: 'tmdb-m-209112', title: 'Batman v Superman: Dawn of Justice', release_year: 2016, context: '2015', explanation: 'Eighteen months after the destruction of Metropolis.' },
          { position: 5, content_id: 'tmdb-m-297761', title: 'Suicide Squad', release_year: 2016, context: '2016', explanation: 'Shortly after Superman’s death.' },
          { position: 6, content_id: 'tmdb-m-141052', title: 'Justice League', release_year: 2017, context: '2017', explanation: 'Resurrection of Superman and defeat of Steppenwolf.' },
          { position: 7, content_id: 'tmdb-m-297802', title: 'Aquaman', release_year: 2018, context: '2018', explanation: 'Arthur takes his rightful place on the Atlantean throne.' },
          { position: 8, content_id: 'tmdb-m-287947', title: 'Shazam!', release_year: 2019, context: 'December 2018', explanation: 'Billy Batson battles Dr. Sivana in Philadelphia.' },
          { position: 9, content_id: 'tmdb-m-495764', title: 'Birds of Prey', release_year: 2020, context: '2020', explanation: 'Harley Quinn after her breakup with the Joker.' },
          { position: 10, content_id: 'tmdb-m-436969', title: 'The Suicide Squad', release_year: 2021, context: '2021', explanation: 'Task Force X mission in Corto Maltese.' },
          { position: 11, content_id: 'tmdb-tv-110492', title: 'Peacemaker (Season 1)', release_year: 2022, context: 'Early 2022', explanation: 'Takes place five months after the Corto Maltese mission.' },
          { position: 12, content_id: 'tmdb-m-436270', title: 'Black Adam', release_year: 2022, context: '2022', explanation: 'Teth-Adam awakens in modern-day Kahndaq.' },
          { position: 13, content_id: 'tmdb-m-594767', title: 'Shazam! Fury of the Gods', release_year: 2023, context: '2023', explanation: 'Two years after the first Shazam adventure.' },
          { position: 14, content_id: 'tmdb-m-298618', title: 'The Flash', release_year: 2023, context: '2023', explanation: 'Barry Allen causes the multiverse reset.' },
          { position: 15, content_id: 'tmdb-m-569094', title: 'Blue Beetle', release_year: 2023, context: '2023', explanation: 'Jaime Reyes in Palmera City.' },
          { position: 16, content_id: 'tmdb-m-572802', title: 'Aquaman and the Lost Kingdom', release_year: 2023, context: '2023', explanation: 'The final chapter of the original DCEU continuity.' }
        ]
      }
    ]
  },

  // 2. DC Universe (DC Studios - James Gunn & Peter Safran Continuity)
  {
    id: 'dcu',
    name: 'DC Universe (DC Studios)',
    original_name: 'DC Universe: Chapter 1 Gods and Monsters',
    slug: 'dcu',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Adventure', 'Science Fiction', 'Fantasy'],
    description: 'The brand new DC Studios shared universe spearheaded by James Gunn, commencing with Chapter One: Gods and Monsters.',
    poster_url: 'https://image.tmdb.org/t/p/w500/y4TdGjJdYvP7e408qE7P1R3j8o1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg',
    available_orders: [
      {
        id: 'dcu-release',
        universe_id: 'dcu',
        name: 'Release & Broadcast Sequence',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'The official release timeline for DC Studios Chapter One: Gods and Monsters.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-tv-218000', title: 'Creature Commandos', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/z6D9sXkP5H8p4W5Q8e1r3k7m9.jpg', context: 'DCU Genesis', explanation: 'Amanda Waller forms a black-ops monster squad led by Rick Flag Sr.' },
          { position: 2, content_id: 'tmdb-m-1084199', title: 'Superman', release_year: 2025, poster_url: 'https://image.tmdb.org/t/p/w500/y4TdGjJdYvP7e408qE7P1R3j8o1.jpg', context: 'Chapter One Theatrical Debut', explanation: 'Clark Kent reconciles his Kryptonian heritage with his human upbringing in Metropolis.' },
          { position: 3, content_id: 'tmdb-tv-110492-s2', title: 'Peacemaker (Season 2)', release_year: 2025, poster_url: 'https://image.tmdb.org/t/p/w500/hE3LRZAY8cuGKUOKvd93NH7emu5.jpg', context: 'Direct Superman Tie-in', explanation: 'Christopher Smith navigates the new DCU continuity after the events of Superman.' },
          { position: 4, content_id: 'tmdb-m-1193437', title: 'Supergirl: Woman of Tomorrow', release_year: 2026, poster_url: 'https://image.tmdb.org/t/p/w500/9lE7iO37H3WjP7e408qE7P1R3j8.jpg', context: 'Sci-Fi Epic', explanation: 'Kara Zor-El travels the cosmos with Krypto on a revenge quest alongside Ruthye Marye Knoll.' }
        ]
      }
    ]
  },

  // 3. The Batman Epic Crime Saga (Matt Reeves Gotham Continuity)
  {
    id: 'batman-epic-crime-saga',
    name: 'The Batman Epic Crime Saga',
    original_name: 'Matt Reeves’ The Batman Epic Crime Saga',
    slug: 'batman-epic-crime-saga',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Crime', 'Drama', 'Mystery', 'Thriller'],
    description: 'Matt Reeves’ grounded, noir crime saga centering on Robert Pattinson’s Batman and Colin Farrell’s Penguin.',
    poster_url: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    available_orders: [
      {
        id: 'batman-crime-saga-order',
        universe_id: 'batman-epic-crime-saga',
        name: 'Gotham Chronological Sequence',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'The continuous crime chronicle of Gotham City following the Riddler’s seawall bombings.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-414906', title: 'The Batman', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', context: 'Year Two', explanation: 'Batman investigates the Riddler targeting Gotham’s corrupt elite.' },
          { position: 2, content_id: 'tmdb-tv-194766', title: 'The Penguin', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/yrpA7W1m140fWqC0XW0qG7QeF1M.jpg', context: 'Power Vacuum', explanation: 'Oz Cobb seizes control of the Gotham underworld in the flooded aftermath.' }
        ]
      }
    ]
  },

  // 4. The Dark Knight Trilogy (Christopher Nolan)
  {
    id: 'dark-knight-trilogy',
    name: 'The Dark Knight Trilogy',
    original_name: 'Christopher Nolan’s The Dark Knight Trilogy',
    slug: 'dark-knight-trilogy',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Crime', 'Drama', 'Thriller'],
    description: 'Christopher Nolan’s definitive three-film masterwork starring Christian Bale as Bruce Wayne / Batman.',
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7v9W1Y.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1r5SvR47xKV49.jpg',
    available_orders: [
      {
        id: 'dark-knight-order',
        universe_id: 'dark-knight-trilogy',
        name: 'Trilogy Sequence',
        title: 'Release & Story Order',
        order_type: 'release_order',
        description: 'The complete rise, fall, and resurrection of Gotham’s Dark Knight.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-272', title: 'Batman Begins', release_year: 2005, poster_url: 'https://image.tmdb.org/t/p/w500/8RW2FiIQHg894kWN1E1n71f30Qn.jpg', context: 'Origin', explanation: 'Bruce Wayne trains under Ra’s al Ghul before returning to save Gotham.' },
          { position: 2, content_id: 'tmdb-m-155', title: 'The Dark Knight', release_year: 2008, poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7v9W1Y.jpg', context: 'Joker Masterpiece', explanation: 'Batman confronts the Joker’s philosophical anarchy and Harvey Dent’s fall.' },
          { position: 3, content_id: 'tmdb-m-49026', title: 'The Dark Knight Rises', release_year: 2012, poster_url: 'https://image.tmdb.org/t/p/w500/hrJg3a6Q5p9W4v7Y8e1r3k7m9.jpg', context: 'Legend Finale', explanation: 'Eight years later, Batman emerges from exile to face Bane and the League of Shadows.' }
        ]
      }
    ]
  },

  // 5. Joker Saga (DC Elseworlds - Todd Phillips)
  {
    id: 'joker-saga',
    name: 'Joker / Arthur Fleck Saga',
    original_name: 'DC Elseworlds: Joker Saga',
    slug: 'joker-saga',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Drama', 'Crime', 'Thriller', 'Music'],
    description: 'Todd Phillips and Joaquin Phoenix’s Academy Award-winning Elseworlds character study of Arthur Fleck.',
    poster_url: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2Y58b5k.jpg',
    available_orders: [
      {
        id: 'joker-order',
        universe_id: 'joker-saga',
        name: 'Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'The psychological descent and trial of Arthur Fleck.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-475557', title: 'Joker', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', context: 'Origin', explanation: 'A failed stand-up comedian descends into madness and incites a revolution.' },
          { position: 2, content_id: 'tmdb-m-889737', title: 'Joker: Folie à Deux', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/if8QiqCI7WAGImKcJCf56V2G7Kn.jpg', context: 'Musical Duet', explanation: 'Arthur Fleck meets Harleen Quinzel at Arkham State Hospital awaiting trial.' }
        ]
      }
    ]
  }
];
