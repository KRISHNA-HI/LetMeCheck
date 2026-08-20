import { Universe } from '../../types/content';

export const SCIFI_FANTASY_UNIVERSES: Universe[] = [
  // 1. Star Wars Universe
  {
    id: 'star-wars',
    name: 'Star Wars Universe',
    original_name: 'Star Wars Saga',
    slug: 'star-wars',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Science Fiction', 'Adventure', 'Action', 'Fantasy'],
    description: 'George Lucas’s epic space-opera mythology spanning the Skywalker Saga, standalone anthologies, and Disney+ canonical live-action series.',
    poster_url: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/zqkmTXzjkAgPnBNaMYw6aU42Uf.jpg',
    available_orders: [
      {
        id: 'starwars-chronological',
        universe_id: 'star-wars',
        name: 'Canon Chronological Timeline',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Follow the galactic timeline from The Acolyte & Fall of the Republic through the Rise of the New Jedi Order.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-tv-114461', title: 'The Acolyte', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/mztd530I9vYVd6vFm8Y8tW8q.jpg', context: 'High Republic (100 BBY)', explanation: 'Jedi Master Sol investigates dark side murders at the end of the High Republic.' },
          { position: 2, content_id: 'tmdb-m-1893', title: 'Star Wars: Episode I - The Phantom Menace', release_year: 1999, poster_url: 'https://image.tmdb.org/t/p/w500/6t8ES1d12OzWyCGxBeDYLHoaDrT.jpg', context: '32 BBY', explanation: 'Qui-Gon Jinn discovers young Anakin Skywalker on Tatooine.' },
          { position: 3, content_id: 'tmdb-m-1894', title: 'Star Wars: Episode II - Attack of the Clones', release_year: 2002, poster_url: 'https://image.tmdb.org/t/p/w500/o76Zhh8gpjW5W42Uf.jpg', context: '22 BBY', explanation: 'The Clone Wars begin as Anakin and Padmé fall in love.' },
          { position: 4, content_id: 'tmdb-tv-4194', title: 'Star Wars: The Clone Wars', release_year: 2008, poster_url: 'https://image.tmdb.org/t/p/w500/p6yW8qZfKzWJ2t7vP8y.jpg', context: '22–19 BBY', explanation: 'Anakin Skywalker and his padawan Ahsoka Tano fight across the galaxy.' },
          { position: 5, content_id: 'tmdb-m-1895', title: 'Star Wars: Episode III - Revenge of the Sith', release_year: 2005, poster_url: 'https://image.tmdb.org/t/p/w500/xfSAoB4CW7xCHIOqvIGZm8OPOiP.jpg', context: '19 BBY', explanation: 'Order 66 destroys the Jedi and Anakin falls to the dark side as Darth Vader.' },
          { position: 6, content_id: 'tmdb-tv-105971', title: 'Star Wars: The Bad Batch', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/WjO1IfxsSrVxR2dUeCMf9W8q.jpg', context: '19 BBY', explanation: 'Clone Force 99 navigates the dawn of the Galactic Empire.' },
          { position: 7, content_id: 'tmdb-m-348350', title: 'Solo: A Star Wars Story', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/3IGHYF73WjP7e408qE7P1R3j8.jpg', context: '10 BBY', explanation: 'Young Han Solo meets Chewbacca and Lando Calrissian on the coaxium heist.' },
          { position: 8, content_id: 'tmdb-tv-92782-obw', title: 'Obi-Wan Kenobi', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/qJXZjWKuQM2Te3Y4Q8R9uLpG05.jpg', context: '9 BBY', explanation: 'Obi-Wan leaves Tatooine to rescue young Princess Leia from Inquisitors.' },
          { position: 9, content_id: 'tmdb-tv-83867', title: 'Star Wars Rebels', release_year: 2014, poster_url: 'https://image.tmdb.org/t/p/w500/w7rW8qZfKzWJ2t7vP8y.jpg', context: '5–0 BBY', explanation: 'The Ghost crew sparks the early rebellion against Grand Admiral Thrawn.' },
          { position: 10, content_id: 'tmdb-tv-84773', title: 'Andor', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/5A2R0qW0qG7QeF1M7v9W1Y.jpg', context: '5–0 BBY', explanation: 'Cassian Andor is drawn into the revolutionary fight against the Empire.' },
          { position: 11, content_id: 'tmdb-m-330459', title: 'Rogue One: A Star Wars Story', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/i0yw1mFbB7sngHCavOXknqiSdMw.jpg', context: '0 BBY', explanation: 'Jyn Erso and the Rogue One squad steal the Death Star plans on Scarif.' },
          { position: 12, content_id: 'tmdb-m-11', title: 'Star Wars: Episode IV - A New Hope', release_year: 1977, poster_url: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', context: '0 BBY / 0 ABY', explanation: 'Luke Skywalker joins Princess Leia and Han Solo to blow up the Death Star.' },
          { position: 13, content_id: 'tmdb-m-1891', title: 'Star Wars: Episode V - The Empire Strikes Back', release_year: 1980, poster_url: 'https://image.tmdb.org/t/p/w500/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg', context: '3 ABY', explanation: 'Luke trains with Yoda on Dagobah and discovers Darth Vader is his father.' },
          { position: 14, content_id: 'tmdb-m-1892', title: 'Star Wars: Episode VI - Return of the Jedi', release_year: 1983, poster_url: 'https://image.tmdb.org/t/p/w500/jQYlyiueyp39W42Uf.jpg', context: '4 ABY', explanation: 'Anakin Skywalker is redeemed as Emperor Palpatine is defeated on the second Death Star.' },
          { position: 15, content_id: 'tmdb-tv-82856', title: 'The Mandalorian (Seasons 1–3)', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1R07Y8vH.jpg', context: '9–11 ABY', explanation: 'Din Djarin protects Grogu across the lawless Outer Rim.' },
          { position: 16, content_id: 'tmdb-tv-115036', title: 'The Book of Boba Fett', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/gNmn1DcZ0aT9W42Uf.jpg', context: '9 ABY', explanation: 'Boba Fett and Fennec Shand take over Jabba the Hutt’s territory on Tatooine.' },
          { position: 17, content_id: 'tmdb-tv-114463', title: 'Ahsoka', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/laCJxobHoPVV9aA7wW0qG7QeF1M.jpg', context: '11 ABY', explanation: 'Ahsoka Tano and Sabine Wren journey to Peridea to find Grand Admiral Thrawn and Ezra Bridger.' },
          { position: 18, content_id: 'tmdb-tv-202303', title: 'Star Wars: Skeleton Crew', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/u1mFbB7sngHCavOXknqiSdMw.jpg', context: '11 ABY', explanation: 'Four children get lost in the wild galaxy and encounter force-sensitive Jod Na Nawood.' },
          { position: 19, content_id: 'tmdb-m-140607', title: 'Star Wars: Episode VII - The Force Awakens', release_year: 2015, poster_url: 'https://image.tmdb.org/t/p/w500/wqnLenjxBT5nO9W42Uf.jpg', context: '34 ABY', explanation: 'Rey, Finn, and Poe Dameron battle Kylo Ren and the First Order.' },
          { position: 20, content_id: 'tmdb-m-181808', title: 'Star Wars: Episode VIII - The Last Jedi', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/kOVEVeg59E08qE7P1R3j8.jpg', context: '34 ABY', explanation: 'Luke Skywalker teaches Rey the nature of the Force on Ahch-To.' },
          { position: 21, content_id: 'tmdb-m-181812', title: 'Star Wars: Episode IX - The Rise of Skywalker', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/db32LaOsbwW0qG7QeF1M7v9W1Y.jpg', context: '35 ABY', explanation: 'The final battle on Exegol between Rey Skywalker and the resurrected Emperor Palpatine.' }
        ]
      }
    ]
  },

  // 2. Wizarding World (Harry Potter & Fantastic Beasts)
  {
    id: 'wizarding-world',
    name: 'Wizarding World (Harry Potter)',
    original_name: 'J.K. Rowling’s Wizarding World',
    slug: 'wizarding-world',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Fantasy', 'Adventure', 'Family', 'Mystery'],
    description: 'The 11-film magical saga spanning the 1920s Fantastic Beasts prequel trilogy and the 8 Harry Potter Hogwarts adventures.',
    poster_url: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hziiv146OpD7q68L0lLsUrCnM7T.jpg',
    available_orders: [
      {
        id: 'wizarding-chronological',
        universe_id: 'wizarding-world',
        name: 'In-Universe Chronological Order',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Experience magical history from Newt Scamander’s 1920s adventures through Harry’s 1990s battles at Hogwarts.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-259316', title: 'Fantastic Beasts and Where to Find Them', release_year: 2016, poster_url: 'https://image.tmdb.org/t/p/w500/hziiv146OpD7q68L0lLsUrCnM7T.jpg', context: '1926 (New York)', explanation: 'Newt Scamander arrives in New York as Gellert Grindelwald plots uprising.' },
          { position: 2, content_id: 'tmdb-m-338952', title: 'Fantastic Beasts: The Crimes of Grindelwald', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/uy0pZ146OpD7q68L0lLsUrCnM7T.jpg', context: '1927 (Paris)', explanation: 'Albus Dumbledore enlists Newt to confront Grindelwald’s rallies in Paris.' },
          { position: 3, content_id: 'tmdb-m-338953', title: 'Fantastic Beasts: The Secrets of Dumbledore', release_year: 2022, poster_url: 'https://image.tmdb.org/t/p/w500/jrgifaWUtTnhH0gpnwLz52w0Qp.jpg', context: '1930s (Berlin & Bhutan)', explanation: 'Dumbledore’s squad intervenes in the International Confederation of Wizards election.' },
          { position: 4, content_id: 'tmdb-m-671', title: 'Harry Potter and the Sorcerer’s Stone', release_year: 2001, poster_url: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', context: 'Year 1 (1991–1992)', explanation: 'Harry discovers his wizard heritage and enters Hogwarts School of Witchcraft and Wizardry.' },
          { position: 5, content_id: 'tmdb-m-672', title: 'Harry Potter and the Chamber of Secrets', release_year: 2002, poster_url: 'https://image.tmdb.org/t/p/w500/sdEOH0992X7Mup9N1v0Y8tW8q.jpg', context: 'Year 2 (1992–1993)', explanation: 'The Heir of Slytherin opens the Chamber, releasing the Basilisk.' },
          { position: 6, content_id: 'tmdb-m-673', title: 'Harry Potter and the Prisoner of Azkaban', release_year: 2004, poster_url: 'https://image.tmdb.org/t/p/w500/aWxHgYrV7v1XwW0qG7QeF1M7v.jpg', context: 'Year 3 (1993–1994)', explanation: 'Sirius Black escapes Azkaban as Dementors surround Hogwarts.' },
          { position: 7, content_id: 'tmdb-m-674', title: 'Harry Potter and the Goblet of Fire', release_year: 2005, poster_url: 'https://image.tmdb.org/t/p/w500/fECGtDD20qW0qG7QeF1M7v9W1Y.jpg', context: 'Year 4 (1994–1995)', explanation: 'Harry competes in the Triwizard Tournament and Lord Voldemort returns.' },
          { position: 8, content_id: 'tmdb-m-675', title: 'Harry Potter and the Order of the Phoenix', release_year: 2007, poster_url: 'https://image.tmdb.org/t/p/w500/5aGhaI4X2X7Mup9N1v0Y8tW8q.jpg', context: 'Year 5 (1995–1996)', explanation: 'Dumbledore’s Army trains to oppose Ministry denial and Dolores Umbridge.' },
          { position: 9, content_id: 'tmdb-m-767', title: 'Harry Potter and the Half-Blood Prince', release_year: 2009, poster_url: 'https://image.tmdb.org/t/p/w500/z7uo9zmQeF1M7v9W1YqGZfKzWJ.jpg', context: 'Year 6 (1996–1997)', explanation: 'Harry and Dumbledore investigate Voldemort’s past and uncover the Horcruxes.' },
          { position: 10, content_id: 'tmdb-m-12444', title: 'Harry Potter and the Deathly Hallows: Part 1', release_year: 2010, poster_url: 'https://image.tmdb.org/t/p/w500/iGoXIpQb7P0Z8aT9W42UfgpnwLz.jpg', context: 'Year 7 (1997–1998)', explanation: 'Harry, Ron, and Hermione hunt Horcruxes across Britain on the run from Death Eaters.' },
          { position: 11, content_id: 'tmdb-m-12445', title: 'Harry Potter and the Deathly Hallows: Part 2', release_year: 2011, poster_url: 'https://image.tmdb.org/t/p/w500/c54HpQmuwW0qG7QeF1M7v9W1Y.jpg', context: 'The Battle of Hogwarts', explanation: 'The epic final siege of Hogwarts and the downfall of Lord Voldemort.' }
        ]
      }
    ]
  },

  // 3. Middle-earth / The Lord of the Rings & The Hobbit (Peter Jackson)
  {
    id: 'middle-earth',
    name: 'The Lord of the Rings & Middle-earth',
    original_name: 'J.R.R. Tolkien’s Middle-earth',
    slug: 'middle-earth',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Fantasy', 'Adventure', 'Action'],
    description: 'Peter Jackson’s legendary 6-film Middle-earth journey from Bilbo Baggins’ quest for Erebor to the destruction of the One Ring in Mordor.',
    poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/vRQnzOn4H1vgKiF1WqW0qG7QeF1.jpg',
    available_orders: [
      {
        id: 'middle-earth-chronological',
        universe_id: 'middle-earth',
        name: 'Middle-earth Chronological Saga',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Bilbo Baggins’ journey with the Dwarves followed 60 years later by Frodo’s quest to Mount Doom.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-49051', title: 'The Hobbit: An Unexpected Journey', release_year: 2012, poster_url: 'https://image.tmdb.org/t/p/w500/yHA9Fc37VmpSC5IfU2B0o9F5a0r.jpg', context: 'The Quest of Erebor', explanation: 'Bilbo Baggins is swept into Thorin Oakenshield’s quest and discovers the One Ring from Gollum.' },
          { position: 2, content_id: 'tmdb-m-57158', title: 'The Hobbit: The Desolation of Smaug', release_year: 2013, poster_url: 'https://image.tmdb.org/t/p/w500/xQFiG1WqW0qG7QeF1M7v9W1Y.jpg', context: 'The Lonely Mountain', explanation: 'The company traverses Mirkwood to confront the dragon Smaug at Erebor.' },
          { position: 3, content_id: 'tmdb-m-122917', title: 'The Hobbit: The Battle of the Five Armies', release_year: 2014, poster_url: 'https://image.tmdb.org/t/p/w500/9kF1WqW0qG7QeF1M7v9W1Y.jpg', context: 'Five Armies Clash', explanation: 'Men, Elves, Dwarves, and Orcs clash for the treasures of the Lonely Mountain.' },
          { position: 4, content_id: 'tmdb-m-120', title: 'The Lord of the Rings: The Fellowship of the Ring', release_year: 2001, poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg', context: 'Quest Begins', explanation: 'Frodo Baggins and the Fellowship depart Rivendell to destroy the One Ring.' },
          { position: 5, content_id: 'tmdb-m-121', title: 'The Lord of the Rings: The Two Towers', release_year: 2002, poster_url: 'https://image.tmdb.org/t/p/w500/5VTN0L9TeL21P9W42Uf.jpg', context: 'Battle of Helm’s Deep', explanation: 'Aragorn leads the defense of Rohan while Frodo and Sam follow Gollum toward Mordor.' },
          { position: 6, content_id: 'tmdb-m-122', title: 'The Lord of the Rings: The Return of the King', release_year: 2003, poster_url: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', context: 'The King Returns', explanation: 'The Siege of Minas Tirith and the destruction of the One Ring in the fires of Mount Doom.' }
        ]
      }
    ]
  },

  // 4. MonsterVerse (Legendary & Warner Bros)
  {
    id: 'monsterverse',
    name: 'MonsterVerse',
    original_name: 'Legendary’s MonsterVerse',
    slug: 'monsterverse',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    description: 'The monumental Titans saga featuring Godzilla, Kong, King Ghidorah, Mothra, and the secrets of Hollow Earth.',
    poster_url: 'https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/en3DXdpj4et90wbPvGFweqdr4xS.jpg',
    available_orders: [
      {
        id: 'monsterverse-chronological',
        universe_id: 'monsterverse',
        name: 'Titan Chronology',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'From 1973 Skull Island to modern Hollow Earth exploration.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-293167', title: 'Kong: Skull Island', release_year: 2017, context: '1973', explanation: 'Monarch scientists encounter Kong and Skullcrawlers during the Vietnam War era.' },
          { position: 2, content_id: 'tmdb-tv-202411', title: 'Monarch: Legacy of Monsters', release_year: 2023, context: '1950s & 2015', explanation: 'Two generations uncover Monarch’s founding ties to the Titans.' },
          { position: 3, content_id: 'tmdb-m-143370', title: 'Godzilla', release_year: 2014, context: '2014', explanation: 'Godzilla reawakens in San Francisco to stop the parasitic MUTOs.' },
          { position: 4, content_id: 'tmdb-m-373571', title: 'Godzilla: King of the Monsters', release_year: 2019, context: '2019', explanation: 'Godzilla clashes with King Ghidorah, Rodan, and Mothra for Titan dominance.' },
          { position: 5, content_id: 'tmdb-m-399566', title: 'Godzilla vs. Kong', release_year: 2021, context: '2024', explanation: 'The two apex Titans clash in Hong Kong before teaming up against Mechagodzilla.' },
          { position: 6, content_id: 'tmdb-m-823464', title: 'Godzilla x Kong: The New Empire', release_year: 2024, context: '2027', explanation: 'Godzilla and Kong enter Hollow Earth to defeat the tyrannical Skar King and Shimo.' }
        ]
      }
    ]
  },

  // 5. The Conjuring Universe
  {
    id: 'the-conjuring-universe',
    name: 'The Conjuring Universe',
    original_name: 'The Conjuring Universe',
    slug: 'the-conjuring',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Horror', 'Mystery', 'Thriller'],
    description: 'James Wan’s interconnected supernatural horror universe based on the real-life case files of demonologists Ed and Lorraine Warren.',
    poster_url: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/mKTIsqPec71oO37H3WjP7e408q.jpg',
    available_orders: [
      {
        id: 'conjuring-chronological',
        universe_id: 'the-conjuring-universe',
        name: 'In-Universe Case File Timeline',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Follow the historical demonic hauntings from 1952 Romania to the 1980s Warren trials.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-439079', title: 'The Nun', release_year: 2018, context: '1952 (Romania)', explanation: 'Sister Irene investigates the demonic entity Valak at the Saint Cartha monastery.' },
          { position: 2, content_id: 'tmdb-m-396422', title: 'Annabelle: Creation', release_year: 2017, context: '1955', explanation: 'A dollmaker hosts orphaned girls as the conduit doll Annabelle awakens.' },
          { position: 3, content_id: 'tmdb-m-968051', title: 'The Nun II', release_year: 2023, context: '1956 (France)', explanation: 'Sister Irene confronts the returned Valak at a French boarding school.' },
          { position: 4, content_id: 'tmdb-m-250574', title: 'Annabelle', release_year: 2014, context: '1967', explanation: 'A young married couple in Santa Monica is tormented by the possessed Annabelle doll.' },
          { position: 5, content_id: 'tmdb-m-138843', title: 'The Conjuring', release_year: 2013, context: '1971 (Rhode Island)', explanation: 'Ed and Lorraine Warren assist the Perron family in their haunted farmhouse.' },
          { position: 6, content_id: 'tmdb-m-521029', title: 'Annabelle Comes Home', release_year: 2019, context: '1972', explanation: 'The artifacts in the Warrens’ occult museum awaken when Annabelle is freed.' },
          { position: 7, content_id: 'tmdb-m-480414', title: 'The Curse of La Llorona', release_year: 2019, context: '1973', explanation: 'Social worker Anna Tate-Garcia turns to Father Perez for protection against the Weeping Woman.' },
          { position: 8, content_id: 'tmdb-m-259693', title: 'The Conjuring 2', release_year: 2016, context: '1977 (Enfield Poltergeist)', explanation: 'The Warrens travel to London to help the Hodgson family battle the Crooked Man and Valak.' },
          { position: 9, content_id: 'tmdb-m-423108', title: 'The Conjuring: The Devil Made Me Do It', release_year: 2021, context: '1981 (Arne Johnson Trial)', explanation: 'The Warrens fight the first court case in US history claiming demonic possession.' }
        ]
      },
      {
        id: 'conjuring-release',
        universe_id: 'the-conjuring-universe',
        name: 'Theatrical Release Sequence',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Watch all films in the order they hit theaters.',
        is_default: false,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-138843', title: 'The Conjuring', release_year: 2013 },
          { position: 2, content_id: 'tmdb-m-250574', title: 'Annabelle', release_year: 2014 },
          { position: 3, content_id: 'tmdb-m-259693', title: 'The Conjuring 2', release_year: 2016 },
          { position: 4, content_id: 'tmdb-m-396422', title: 'Annabelle: Creation', release_year: 2017 },
          { position: 5, content_id: 'tmdb-m-439079', title: 'The Nun', release_year: 2018 },
          { position: 6, content_id: 'tmdb-m-480414', title: 'The Curse of La Llorona', release_year: 2019 },
          { position: 7, content_id: 'tmdb-m-521029', title: 'Annabelle Comes Home', release_year: 2019 },
          { position: 8, content_id: 'tmdb-m-423108', title: 'The Conjuring: The Devil Made Me Do It', release_year: 2021 },
          { position: 9, content_id: 'tmdb-m-968051', title: 'The Nun II', release_year: 2023 }
        ]
      }
    ]
  },

  // 6. Fast & Furious Saga
  {
    id: 'fast-and-furious',
    name: 'Fast & Furious Saga',
    original_name: 'The Fast Saga',
    slug: 'fast-and-furious',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Crime', 'Thriller'],
    description: 'Vin Diesel and the Toretto family’s global vehicular heist and espionage saga.',
    poster_url: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9Y1YqGZfKzWJ2t7v.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    available_orders: [
      {
        id: 'fast-chronological',
        universe_id: 'fast-and-furious',
        name: 'The Fast Family Timeline',
        title: 'Chronological Order',
        order_type: 'chronological',
        description: 'Han’s backstory accounts for Tokyo Drift occurring after Fast & Furious 6.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-9799', title: 'The Fast and the Furious', release_year: 2001, context: 'LA Streets' },
          { position: 2, content_id: 'tmdb-m-584', title: '2 Fast 2 Furious', release_year: 2003, context: 'Miami' },
          { position: 3, content_id: 'tmdb-m-13804', title: 'Fast & Furious (4)', release_year: 2009, context: 'Mexico & LA' },
          { position: 4, content_id: 'tmdb-m-51497', title: 'Fast Five', release_year: 2011, context: 'Rio Heist' },
          { position: 5, content_id: 'tmdb-m-82992', title: 'Fast & Furious 6', release_year: 2013, context: 'London' },
          { position: 6, content_id: 'tmdb-m-9615', title: 'The Fast and the Furious: Tokyo Drift', release_year: 2006, context: 'Tokyo Drift' },
          { position: 7, content_id: 'tmdb-m-168259', title: 'Furious 7', release_year: 2015, context: 'Deckard Shaw revenge' },
          { position: 8, content_id: 'tmdb-m-337339', title: 'The Fate of the Furious', release_year: 2017, context: 'Cipher blackmail' },
          { position: 9, content_id: 'tmdb-m-384018', title: 'Fast & Furious Presents: Hobbs & Shaw', release_year: 2019, context: 'Spin-off' },
          { position: 10, content_id: 'tmdb-m-385128', title: 'F9: The Fast Saga', release_year: 2021, context: 'Jakob Toretto' },
          { position: 11, content_id: 'tmdb-m-385687', title: 'Fast X', release_year: 2023, context: 'Dante Reyes retribution' }
        ]
      }
    ]
  },

  // 7. Mission: Impossible
  {
    id: 'mission-impossible',
    name: 'Mission: Impossible Franchise',
    original_name: 'Mission: Impossible',
    slug: 'mission-impossible',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Adventure', 'Thriller'],
    description: 'Tom Cruise stars as IMF agent Ethan Hunt executing death-defying practical stunts to save the world.',
    poster_url: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
    available_orders: [
      {
        id: 'mi-release',
        universe_id: 'mission-impossible',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Ethan Hunt’s espionage missions in release sequence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-954', title: 'Mission: Impossible', release_year: 1996, explanation: 'Ethan Hunt clears his name after his IMF team is killed in Prague.' },
          { position: 2, content_id: 'tmdb-m-955', title: 'Mission: Impossible II', release_year: 2000, explanation: 'Ethan stops rogue agent Sean Ambrose from unleashing the Chimera virus.' },
          { position: 3, content_id: 'tmdb-m-956', title: 'Mission: Impossible III', release_year: 2006, explanation: 'Ethan confronts arms dealer Owen Davian to protect his fiancée Julia.' },
          { position: 4, content_id: 'tmdb-m-56292', title: 'Mission: Impossible - Ghost Protocol', release_year: 2011, explanation: 'Ethan climbs the Burj Khalifa as IMF is disavowed following the Kremlin bombing.' },
          { position: 5, content_id: 'tmdb-m-177677', title: 'Mission: Impossible - Rogue Nation', release_year: 2015, explanation: 'Ethan and Ilsa Faust hunt Solomon Lane’s Syndicate.' },
          { position: 6, content_id: 'tmdb-m-353081', title: 'Mission: Impossible - Fallout', release_year: 2018, explanation: 'Ethan and August Walker recover stolen plutonium against the Apostles.' },
          { position: 7, content_id: 'tmdb-m-575264', title: 'Mission: Impossible - Dead Reckoning Part One', release_year: 2023, explanation: 'Ethan races to secure the two-piece key controlling the rogue AI known as the Entity.' },
          { position: 8, content_id: 'tmdb-m-575265', title: 'Mission: Impossible - The Final Reckoning', release_year: 2025, explanation: 'The climactic showdown against the Entity aboard the Sevastopol submarine.' }
        ]
      }
    ]
  },

  // 8. James Bond 007 (Daniel Craig Era)
  {
    id: 'james-bond',
    name: 'James Bond 007 (Craig Era)',
    original_name: 'James Bond 007',
    slug: 'james-bond',
    category: 'franchise',
    type: 'franchise',
    region: 'hollywood',
    genres: ['Action', 'Adventure', 'Thriller'],
    description: 'Daniel Craig’s serialized five-film tenure as British Secret Service agent 007.',
    poster_url: 'https://image.tmdb.org/t/p/w500/iGoXIpQb7P0Z8aT9W42UfgpnwLz.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg',
    available_orders: [
      {
        id: 'bond-craig-order',
        universe_id: 'james-bond',
        name: 'Daniel Craig 007 Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'The five-film serialized story from Bond gaining his 00 status to his final mission.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-36557', title: 'Casino Royale', release_year: 2006, context: '00 Status', explanation: 'Bond defeats Le Chiffre in Montenegro and falls for Vesper Lynd.' },
          { position: 2, content_id: 'tmdb-m-10764', title: 'Quantum of Solace', release_year: 2008, context: 'Direct Sequel', explanation: 'Bond seeks retribution for Vesper while stopping Dominic Greene.' },
          { position: 3, content_id: 'tmdb-m-37724', title: 'Skyfall', release_year: 2012, context: 'MI6 Attack', explanation: 'Bond defends M against cyberterrorist Raoul Silva at Skyfall Lodge.' },
          { position: 4, content_id: 'tmdb-m-206647', title: 'Spectre', release_year: 2015, context: 'Blofeld Revelation', explanation: 'Bond uncovers the global shadow syndicate led by Ernst Stavro Blofeld.' },
          { position: 5, content_id: 'tmdb-m-370172', title: 'No Time to Die', release_year: 2021, context: 'Craig Finale', explanation: 'Bond comes out of retirement to face Lyutsifer Safin’s nanoweapon.' }
        ]
      }
    ]
  },

  // 9. John Wick Universe
  {
    id: 'john-wick',
    name: 'John Wick Universe',
    original_name: 'John Wick: Baba Yaga',
    slug: 'john-wick',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'hollywood',
    genres: ['Action', 'Thriller', 'Crime'],
    description: 'Keanu Reeves stars as legendary hitman John Wick in the high-stakes assassin underworld governed by the High Table.',
    poster_url: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/h8G3WjP7e408qE7P1R3j8o1.jpg',
    available_orders: [
      {
        id: 'john-wick-chronological',
        universe_id: 'john-wick',
        name: 'The High Table Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From Winston’s 1970s Continental rise through John Wick’s duel against the Marquis.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-tv-119051', title: 'The Continental: From the World of John Wick', release_year: 2023, context: '1970s NYC', explanation: 'Young Winston Scott seizes control of the iconic assassin sanctuary.' },
          { position: 2, content_id: 'tmdb-m-245891', title: 'John Wick', release_year: 2014, context: 'The Return', explanation: 'John Wick comes out of retirement after his puppy and car are stolen.' },
          { position: 3, content_id: 'tmdb-m-324552', title: 'John Wick: Chapter 2', release_year: 2017, context: 'Blood Oath', explanation: 'John honors a blood oath in Rome, triggering an excommunicado bounty.' },
          { position: 4, content_id: 'tmdb-m-458156', title: 'John Wick: Chapter 3 - Parabellum', release_year: 2019, context: 'Excommunicado', explanation: 'John fights across Casablanca and NYC against the High Table Adjudicator.' },
          { position: 5, content_id: 'tmdb-m-603692', title: 'John Wick: Chapter 4', release_year: 2023, context: 'High Table Duel', explanation: 'John duels the Marquis de Gramont in Paris to earn his ultimate freedom.' },
          { position: 6, content_id: 'tmdb-m-541134', title: 'Ballerina (From the World of John Wick)', release_year: 2025, context: 'Mid-Saga Spin-off', explanation: 'Eve Macarro seeks vengeance against the assassins who murdered her family.' }
        ]
      }
    ]
  },

  // 10. Breaking Bad Universe (Vince Gilligan)
  {
    id: 'breaking-bad-universe',
    name: 'Breaking Bad Universe',
    original_name: 'Vince Gilligan’s Albuquerque Crime Saga',
    slug: 'breaking-bad',
    category: 'series',
    type: 'series',
    region: 'hollywood',
    genres: ['Drama', 'Crime', 'Thriller'],
    description: 'Vince Gilligan and Peter Gould’s critically acclaimed masterwork covering Better Call Saul, Breaking Bad, and El Camino.',
    poster_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    available_orders: [
      {
        id: 'breaking-bad-chronological',
        universe_id: 'breaking-bad-universe',
        name: 'Albuquerque Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From Jimmy McGill’s transformation into Saul Goodman to Walter White’s empire and Jesse Pinkman’s escape.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-tv-60059', title: 'Better Call Saul', release_year: 2015, context: '2002–2004 & 2010', explanation: 'Jimmy McGill evolves into Saul Goodman alongside Kim Wexler and Mike Ehrmantraut.' },
          { position: 2, content_id: 'tmdb-tv-1396', title: 'Breaking Bad', release_year: 2008, context: '2008–2010', explanation: 'Walter White and Jesse Pinkman build a meth empire in New Mexico.' },
          { position: 3, content_id: 'tmdb-m-559969', title: 'El Camino: A Breaking Bad Movie', release_year: 2019, context: '2010 (Post-Finale)', explanation: 'Jesse Pinkman flees law enforcement in search of a new life in Alaska.' }
        ]
      }
    ]
  }
];
