import { Universe } from '../../types/content';

export const MARVEL_LEGACY_UNIVERSES: Universe[] = [
  // 1. Spider-Man Theatrical Legacy (Raimi, Webb, MCU, Spider-Verse)
  {
    id: 'spider-man-franchise',
    name: 'Spider-Man Franchise',
    original_name: 'Spider-Man Theatrical Saga',
    slug: 'spider-man',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Adventure', 'Science Fiction'],
    description: 'Every theatrical Spider-Man live-action and animated feature film spanning Tobey Maguire, Andrew Garfield, Tom Holland, and Miles Morales.',
    poster_url: 'https://image.tmdb.org/t/p/w500/gh4c2ubiUzVTNyfOa17tJioSdMw.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
    available_orders: [
      {
        id: 'spiderman-release',
        universe_id: 'spider-man-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All 10 theatrical Spider-Man movies in chronological release sequence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-557', title: 'Spider-Man', release_year: 2002, poster_url: 'https://image.tmdb.org/t/p/w500/gh4c2ubiUzVTNyfOa17tJioSdMw.jpg', context: 'Sam Raimi Era', explanation: 'Tobey Maguire becomes Peter Parker battling Willem Dafoe’s Green Goblin.' },
          { position: 2, content_id: 'tmdb-m-558', title: 'Spider-Man 2', release_year: 2004, poster_url: 'https://image.tmdb.org/t/p/w500/olxpyq94zl2TaIOJU0j6teQI1bm.jpg', context: 'Sam Raimi Era', explanation: 'Peter faces Doctor Octopus while struggling with identity crises.' },
          { position: 3, content_id: 'tmdb-m-559', title: 'Spider-Man 3', release_year: 2007, poster_url: 'https://image.tmdb.org/t/p/w500/2jLxnMqg5ZgZkE9n6bUvigpRFqS.jpg', context: 'Sam Raimi Era', explanation: 'Confronts the Symbiote Black Suit, Sandman, and Venom.' },
          { position: 4, content_id: 'tmdb-m-1930', title: 'The Amazing Spider-Man', release_year: 2012, poster_url: 'https://image.tmdb.org/t/p/w500/fSbqq3Zt5Fk3Y8o2J6M6o8v.jpg', context: 'Marc Webb Era', explanation: 'Andrew Garfield stars as Peter discovering Oscorp secrets against The Lizard.' },
          { position: 5, content_id: 'tmdb-m-102382', title: 'The Amazing Spider-Man 2', release_year: 2014, poster_url: 'https://image.tmdb.org/t/p/w500/c3YbD5qWk8pQ9z8o2J6M6o8v.jpg', context: 'Marc Webb Era', explanation: 'Battles Electro and the Green Goblin with Gwen Stacy.' },
          { position: 6, content_id: 'tmdb-m-315635', title: 'Spider-Man: Homecoming', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg', context: 'MCU Jon Watts Era', explanation: 'Tom Holland enters the MCU under Tony Stark’s mentorship.' },
          { position: 7, content_id: 'tmdb-m-324857', title: 'Spider-Man: Into the Spider-Verse', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', context: 'Sony Animation', explanation: 'Miles Morales masters his abilities with alternate-dimension Spider-heroes.' },
          { position: 8, content_id: 'tmdb-m-429617', title: 'Spider-Man: Far From Home', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/4q2DbYRQvfl9QcrJQYJeCo9R3Y5.jpg', context: 'MCU Jon Watts Era', explanation: 'Peter battles Mysterio across Europe post-Endgame.' },
          { position: 9, content_id: 'tmdb-m-634649', title: 'Spider-Man: No Way Home', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', context: 'Live-Action Spider-Verse', explanation: 'Three generations of Spider-Men unite against multiversal villains.' },
          { position: 10, content_id: 'tmdb-m-569094-sv', title: 'Spider-Man: Across the Spider-Verse', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', context: 'Sony Animation', explanation: 'Miles Morales catapults across the Multiverse to encounter the Spider-Society.' }
        ]
      }
    ]
  },

  // 2. Spider-Verse Animated Saga (Miles Morales)
  {
    id: 'spider-verse',
    name: 'Spider-Verse Saga',
    original_name: 'Sony Pictures Spider-Verse',
    slug: 'spider-verse',
    category: 'anime_universe',
    type: 'anime_universe',
    region: 'hollywood',
    genres: ['Animation', 'Action', 'Adventure', 'Science Fiction'],
    description: 'The groundbreaking Oscar-winning animated multiverse chronicle of Miles Morales, Gwen Stacy, and the Spider-Society.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    available_orders: [
      {
        id: 'spider-verse-order',
        universe_id: 'spider-verse',
        name: 'Multiverse Order',
        title: 'Story Order',
        order_type: 'release_order',
        description: 'The complete animated journey of Miles Morales across dimensions.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-324857', title: 'Spider-Man: Into the Spider-Verse', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', context: 'Origin', explanation: 'Miles Morales becomes the new Spider-Man of Brooklyn.' },
          { position: 2, content_id: 'tmdb-m-569094-sv', title: 'Spider-Man: Across the Spider-Verse', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', context: 'Spider-Society', explanation: 'Miles battles Miguel O’Hara and The Spot across dimensions.' }
        ]
      }
    ]
  },

  // 3. X-Men Saga (20th Century Fox & Marvel Animation)
  {
    id: 'x-men-saga',
    name: 'X-Men Saga',
    original_name: 'X-Men Cinematic Universe',
    slug: 'x-men',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    description: 'The 20th Century Fox mutant continuity spanning original trilogy, prequel saga, Wolverine films, Logan, and X-Men ’97.',
    poster_url: 'https://image.tmdb.org/t/p/w500/40D6yUf6zVfS4zW0qG7QeF1M.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hQ4pqqGE9iyTM2qV4Lq90hXlK8v.jpg',
    available_orders: [
      {
        id: 'xmen-release',
        universe_id: 'x-men-saga',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Experience the mutant saga in order of theatrical release.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-36657', title: 'X-Men', release_year: 2000, poster_url: 'https://image.tmdb.org/t/p/w500/bRDAc4GogS9DeWWdrkAgUiOC6Hg.jpg', context: 'Original Trilogy', explanation: 'Wolverine and Rogue find refuge at Xavier’s School as Magneto plots mutant supremacy.' },
          { position: 2, content_id: 'tmdb-m-36658', title: 'X2: X-Men United', release_year: 2003, poster_url: 'https://image.tmdb.org/t/p/w500/6y5d8cWk8pQ9z8o2J6M6o8v.jpg', context: 'Original Trilogy', explanation: 'X-Men and Brotherhood unite against Colonel William Stryker.' },
          { position: 3, content_id: 'tmdb-m-36668', title: 'X-Men: The Last Stand', release_year: 2006, poster_url: 'https://image.tmdb.org/t/p/w500/8cWk8pQ9z8o2J6M6o8v.jpg', context: 'Original Trilogy', explanation: 'A mutant cure is developed and Jean Grey transforms into the Dark Phoenix.' },
          { position: 4, content_id: 'tmdb-m-20662', title: 'X-Men Origins: Wolverine', release_year: 2009, poster_url: 'https://image.tmdb.org/t/p/w500/77k9vY8oU8kGkQZfKzWJ2t7vP8y.jpg', context: 'Wolverine Trilogy', explanation: 'Logan’s early life, Weapon X adamantium bonding, and feud with Victor Creed.' },
          { position: 5, content_id: 'tmdb-m-49538', title: 'X-Men: First Class', release_year: 2011, poster_url: 'https://image.tmdb.org/t/p/w500/vQvWqW0qG7QeF1M7v9W1Y.jpg', context: 'Prequel Era', explanation: 'Charles Xavier and Erik Lehnsherr unite during the 1962 Cuban Missile Crisis.' },
          { position: 6, content_id: 'tmdb-m-76170', title: 'The Wolverine', release_year: 2013, poster_url: 'https://image.tmdb.org/t/p/w500/8y5d8cWk8pQ9z8o2J6M6o8v.jpg', context: 'Wolverine Trilogy', explanation: 'Logan travels to Tokyo and loses his healing factor against the Silver Samurai.' },
          { position: 7, content_id: 'tmdb-m-127585', title: 'X-Men: Days of Future Past', release_year: 2014, poster_url: 'https://image.tmdb.org/t/p/w500/hQ4pqqGE9iyTM2qV4Lq90hXlK8v.jpg', context: 'Timeline Shift', explanation: 'Wolverine travels back to 1973 to prevent Sentinels from eradicating mutantkind.' },
          { position: 8, content_id: 'tmdb-m-246655', title: 'X-Men: Apocalypse', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/2mtkWBMvNkh78w9wMhXo0m9q.jpg', context: 'Prequel Era', explanation: 'The ancient mutant En Sabah Nur awakens in 1983 to cleanse the world.' },
          { position: 9, content_id: 'tmdb-m-263115', title: 'Logan', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg', context: 'Masterpiece Finale', explanation: 'An aging Logan cares for Professor X while defending young mutant Laura (X-23).' },
          { position: 10, content_id: 'tmdb-m-320288', title: 'Dark Phoenix', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/9kF1WqW0qG7QeF1M7v9W1Y.jpg', context: 'Prequel Finale', explanation: 'Jean Grey absorbs a solar flare, threatening both mutantkind and Earth.' },
          { position: 11, content_id: 'tmdb-m-340102', title: 'The New Mutants', release_year: 2020, poster_url: 'https://image.tmdb.org/t/p/w500/xrI8qGZfKzWJ2t7vP8y.jpg', context: 'Spin-off', explanation: 'Five young mutants discover their abilities in a secret psychiatric hospital.' },
          { position: 12, content_id: 'tmdb-tv-138503', title: 'X-Men ’97', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/96bWqW0qG7QeF1M7v9W1Y.jpg', context: 'Animated Revival', explanation: 'The legendary 90s animated team continues after Professor X’s departure.' }
        ]
      }
    ]
  },

  // 4. Sony's Spider-Man Universe (SSU - Venom, Morbius, Madame Web, Kraven)
  {
    id: 'sony-spider-man-universe',
    name: 'Sony’s Spider-Man Universe (SSU)',
    original_name: 'Sony’s Spider-Man Universe (SSU)',
    slug: 'ssu',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Science Fiction', 'Horror', 'Adventure'],
    description: 'Sony Pictures’ interconnected universe focusing on antiheroes including Venom, Morbius, Madame Web, and Kraven.',
    poster_url: 'https://image.tmdb.org/t/p/w500/2uNW4WbgBXL2544qGLQmR6KpUtK.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/vIPIFVoi9247v78mGwhXqEkmxO.jpg',
    available_orders: [
      {
        id: 'ssu-release',
        universe_id: 'sony-spider-man-universe',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Watch all antihero films in the Sony’s Spider-Man Universe continuity.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-335983', title: 'Venom', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/2uNW4WbgBXL2544qGLQmR6KpUtK.jpg', context: 'Origins', explanation: 'Eddie Brock bonds with the alien symbiote Venom in San Francisco.' },
          { position: 2, content_id: 'tmdb-m-580489', title: 'Venom: Let There Be Carnage', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/rjkmN1dniUHVYAtwuV3Tji7Fs79.jpg', context: 'Carnage Emerges', explanation: 'Eddie and Venom face serial killer Cletus Kasady and Carnage.' },
          { position: 3, content_id: 'tmdb-m-526896', title: 'Morbius', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/6JjfSchHsiCc0vmNTUr2prrMpln.jpg', context: 'Living Vampire', explanation: 'Dr. Michael Morbius cures his rare blood disorder with vampire bat DNA.' },
          { position: 4, content_id: 'tmdb-m-634492', title: 'Madame Web', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/rULWuutDcN5NvtiZi4xZa35xYEv.jpg', context: 'Clairvoyance', explanation: 'Cassie Webb discovers clairvoyant powers protecting three future Spider-Women.' },
          { position: 5, content_id: 'tmdb-m-912649', title: 'Venom: The Last Dance', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg', context: 'Venom Trilogy Finale', explanation: 'Eddie and Venom on the run from Knull’s Xenophage symbiote hunters.' },
          { position: 6, content_id: 'tmdb-m-558449', title: 'Kraven the Hunter', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/1G5BE48rT1eJ6M6o8vP7e4.jpg', context: 'Apex Predator', explanation: 'Sergei Kravinoff transforms into the world’s greatest apex predator.' }
        ]
      }
    ]
  },

  // 5. Deadpool Franchise
  {
    id: 'deadpool-franchise',
    name: 'Deadpool Franchise',
    original_name: 'The Merc with a Mouth Trilogy',
    slug: 'deadpool',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Comedy', 'Science Fiction'],
    description: 'Ryan Reynolds’ fourth-wall breaking R-rated superhero trilogy culminating in the multiversal Deadpool & Wolverine.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg',
    available_orders: [
      {
        id: 'deadpool-order',
        universe_id: 'deadpool-franchise',
        name: 'Trilogy Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'The complete fourth-wall-breaking Deadpool saga.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-293660', title: 'Deadpool', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/inVq30NYgGtHg28nWbtg74Q7e1j.jpg', context: 'Origin', explanation: 'Wade Wilson seeks revenge on the rogue scientist Ajax who mutated him.' },
          { position: 2, content_id: 'tmdb-m-383498', title: 'Deadpool 2', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/to0spRl1CMDvyUbvdme394fnSdY.jpg', context: 'X-Force', explanation: 'Deadpool forms X-Force to protect young mutant Russell from Cable.' },
          { position: 3, content_id: 'tmdb-m-533535', title: 'Deadpool & Wolverine', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', context: 'Multiverse Team-up', explanation: 'Wade Wilson and Wolverine unite to save Wade’s universe via the TVA.' }
        ]
      }
    ]
  },

  // 6. Fantastic Four Franchise
  {
    id: 'fantastic-four-franchise',
    name: 'Fantastic Four Franchise',
    original_name: 'Fantastic Four Theatrical Films',
    slug: 'fantastic-four',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    description: 'Marvel’s First Family across the 2000s Tim Story era, 2015 reboot, and the MCU First Steps.',
    poster_url: 'https://image.tmdb.org/t/p/w500/u2p5P4U4Y6wFq9z8o2J6M6o8v.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9GBhzXMFjgcZ3FdR9w0bUMMTgNs.jpg',
    available_orders: [
      {
        id: 'f4-release',
        universe_id: 'fantastic-four-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All theatrical adaptations of Marvel’s First Family.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-9738', title: 'Fantastic Four', release_year: 2005, poster_url: 'https://image.tmdb.org/t/p/w500/4GpnL8qZfKzWJ2t7vP8y.jpg', context: 'Tim Story Era', explanation: 'Four astronauts gain cosmic superpowers and battle Victor Von Doom.' },
          { position: 2, content_id: 'tmdb-m-1979', title: 'Fantastic Four: Rise of the Silver Surfer', release_year: 2007, poster_url: 'https://image.tmdb.org/t/p/w500/6rW8qZfKzWJ2t7vP8y.jpg', context: 'Tim Story Era', explanation: 'The Fantastic Four team with Silver Surfer to stop Galactus.' },
          { position: 3, content_id: 'tmdb-m-166424', title: 'Fantastic Four (2015)', release_year: 2015, poster_url: 'https://image.tmdb.org/t/p/w500/8tW8qZfKzWJ2t7vP8y.jpg', context: 'Josh Trank Era', explanation: 'Young scientists teleport to Planet Zero and must harness their alterations.' },
          { position: 4, content_id: 'tmdb-m-1003598', title: 'The Fantastic Four: First Steps', release_year: 2025, poster_url: 'https://image.tmdb.org/t/p/w500/u2p5P4U4Y6wFq9z8o2J6M6o8v.jpg', context: 'MCU Phase 6', explanation: 'The 1960s retro-futuristic Marvel Studios debut against Galactus.' }
        ]
      }
    ]
  }
];
