import { Universe } from '../../types/content';

export const INDIAN_CINEMA_UNIVERSES: Universe[] = [
  // 1. YRF Spy Universe (Aditya Chopra)
  {
    id: 'yrf-spy-universe',
    name: 'YRF Spy Universe',
    original_name: 'Yash Raj Films Spy Universe',
    slug: 'yrf-spy-universe',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'bollywood',
    genres: ['Action', 'Thriller', 'Crime'],
    description: 'Aditya Chopra’s high-octane Indian RAW and ISI spy franchise uniting Tiger (Salman Khan), Kabir (Hrithik Roshan), and Pathaan (Shah Rukh Khan).',
    poster_url: 'https://image.tmdb.org/t/p/w500/m1b9To0hO4fE0qR2r3J8vP7e408.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg',
    available_orders: [
      {
        id: 'yrf-spy-release',
        universe_id: 'yrf-spy-universe',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Watch all Indian RAW espionage blockbusters in their official release order.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-116745', title: 'Ek Tha Tiger', release_year: 2012, poster_url: 'https://image.tmdb.org/t/p/w500/m1b9To0hO4fE0qR2r3J8vP7e408.jpg', context: 'Origins', explanation: 'RAW agent Tiger falls in love with ISI agent Zoya on a mission in Dublin.' },
          { position: 2, content_id: 'tmdb-m-434050', title: 'Tiger Zinda Hai', release_year: 2017, poster_url: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg', context: 'Iraq Mission', explanation: 'Tiger and Zoya team up to rescue 25 Indian nurses held hostage by ISC in Tikrit.' },
          { position: 3, content_id: 'tmdb-m-585268', title: 'War', release_year: 2019, poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', context: 'Major Kabir', explanation: 'RAW soldier Khalid hunts his former mentor Major Kabir Anand, who has gone rogue.' },
          { position: 4, content_id: 'tmdb-m-864692', title: 'Pathaan', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/m1b9To0hO4fE0qR2r3J8vP7e408.jpg', context: 'Crossover Milestone', explanation: 'Exiled RAW agent Pathaan teams with Rubina and Tiger to stop Jim’s Outfit X from deploying a biological virus.' },
          { position: 5, content_id: 'tmdb-m-786892', title: 'Tiger 3', release_year: 2023, poster_url: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg', context: 'Pathaan Cameo', explanation: 'Tiger and Zoya are framed as traitors by revenge-seeking ex-ISI chief Aatish Rehman.' },
          { position: 6, content_id: 'tmdb-m-1084200', title: 'War 2', release_year: 2025, poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', context: 'Kabir vs Jr NTR', explanation: 'Major Kabir goes up against a ruthless international operative across Tokyo and Europe.' }
        ]
      }
    ]
  },

  // 2. Rohit Shetty Cop Universe
  {
    id: 'cop-universe',
    name: 'Rohit Shetty Cop Universe',
    original_name: 'Rohit Shetty Picturez Cop Universe',
    slug: 'cop-universe',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'bollywood',
    genres: ['Action', 'Comedy', 'Crime', 'Drama'],
    description: 'Rohit Shetty’s blockbuster police franchise uniting DCP Bajirao Singham (Ajay Devgn), Inspector Sangram Bhalerao / Simmba (Ranveer Singh), DCP Veer Sooryavanshi (Akshay Kumar), and ACP Satya (Tiger Shroff).',
    poster_url: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    available_orders: [
      {
        id: 'cop-release',
        universe_id: 'cop-universe',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'Watch all Cop Universe films in official release sequence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-70074', title: 'Singham', release_year: 2011, poster_url: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg', context: 'Origin', explanation: 'Honest police officer Bajirao Singham takes on corrupt politician Jaikant Shikre in Goa.' },
          { position: 2, content_id: 'tmdb-m-284293', title: 'Singham Returns', release_year: 2014, poster_url: 'https://image.tmdb.org/t/p/w500/m1b9To0hO4fE0qR2r3J8vP7e408.jpg', context: 'DCP Singham', explanation: 'DCP Singham uncovers a political black money racket in Mumbai involving godman Swamiji.' },
          { position: 3, content_id: 'tmdb-m-529107', title: 'Simmba', release_year: 2018, poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', context: 'Simmba Meets Singham', explanation: 'Corrupt cop Sangram Bhalerao reforms after a personal tragedy, assisted by Singham.' },
          { position: 4, content_id: 'tmdb-m-585083', title: 'Sooryavanshi', release_year: 2021, poster_url: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg', context: 'Grand Trio Crossover', explanation: 'DCP Veer Sooryavanshi unites with Singham and Simmba to thwart a sleeper-cell terror attack on Mumbai.' },
          { position: 5, content_id: 'tmdb-tv-202412', title: 'Indian Police Force', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/9lE7iO37H3WjP7e408qE7P1R3j8.jpg', context: 'Delhi Police Series', explanation: 'SP Kabir Malik leads Delhi Police special cell hunting serial bomb blasts across India.' },
          { position: 6, content_id: 'tmdb-m-1084201', title: 'Singham Again', release_year: 2024, poster_url: 'https://image.tmdb.org/t/p/w500/1X6G0fE0qR2r3J8vP7e408qE7P1.jpg', context: 'Mega Ramayana-Inspired Ensemble', explanation: 'Singham assembles Simmba, Sooryavanshi, ACP Satya, and SP Tara Shetty across Sri Lanka against Danger Lanka.' }
        ]
      }
    ]
  },

  // 3. Lokesh Cinematic Universe (LCU)
  {
    id: 'lcu',
    name: 'Lokesh Cinematic Universe (LCU)',
    original_name: 'Lokesh Cinematic Universe (LCU)',
    slug: 'lcu',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'kollywood',
    genres: ['Action', 'Crime', 'Thriller'],
    description: 'Lokesh Kanagaraj’s acclaimed Tamil dark crime and syndicate universe centering on Dilli (Karthi), Vikram (Kamal Haasan), and Leo Das (Thalapathy Vijay).',
    poster_url: 'https://image.tmdb.org/t/p/w500/t05t3l0X1m7W8qZfKzWJ2t7vP8.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg',
    available_orders: [
      {
        id: 'lcu-chronological',
        universe_id: 'lcu',
        name: 'Syndicate Timeline',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From Dilli’s truck run through Amar’s investigation and Leo Das’s emergence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-630566', title: 'Kaithi', release_year: 2019, context: 'Drug Bust in Trichy', explanation: 'Prisoner Dilli drives a truck of poisoned police officers to save them from Adaikalam’s cartel.' },
          { position: 2, content_id: 'tmdb-m-828853', title: 'Vikram', release_year: 2022, context: 'Black Ops & Rolex Entry', explanation: 'Agent Arun Kumar (Vikram) battles drug kingpin Sandhanam and exposes kingpin Rolex.' },
          { position: 3, content_id: 'tmdb-m-969492', title: 'Leo', release_year: 2023, context: 'Parthiban / Leo Das', explanation: 'Quiet cafe owner Parthiban in Himachal is targeted by Harold and Antony Das.' },
          { position: 4, content_id: 'tmdb-m-1193438', title: 'Coolie', release_year: 2025, context: 'Gold Smuggling Cartel', explanation: 'Superstar Rajinikanth stars in Lokesh Kanagaraj’s high-stakes action saga.' }
        ]
      }
    ]
  },

  // 4. Maddock Supernatural Horror-Comedy Universe
  {
    id: 'maddock-horror-comedy',
    name: 'Maddock Horror-Comedy Universe',
    original_name: 'Maddock Supernatural Universe',
    slug: 'maddock-horror-comedy',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'bollywood',
    genres: ['Comedy', 'Horror', 'Supernatural'],
    description: 'Dinesh Vijan’s massively popular Indian folklore horror-comedy universe connecting Stree, Bhediya, Munjya, and Thama.',
    poster_url: 'https://image.tmdb.org/t/p/w500/stree2poster01r1CMDvyUbvdme394.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    available_orders: [
      {
        id: 'maddock-chronological',
        universe_id: 'maddock-horror-comedy',
        name: 'Folklore Chronology',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'The shared universe connecting Chanderi folklore, the Arunachal shape-shifting werewolf, the Chetuk monster, and Sarkata.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-531428', title: 'Stree', release_year: 2018, context: 'Chanderi Legend', explanation: 'Vicky and his friends investigate the female spirit abducting men at night in Chanderi.' },
          { position: 2, content_id: 'tmdb-m-798286', title: 'Bhediya', release_year: 2022, context: 'Arunachal Werewolf', explanation: 'Bhaskar is bitten by a magical wolf in the forests of Ziro and gains shape-shifting powers.' },
          { position: 3, content_id: 'tmdb-m-1249289', title: 'Munjya', release_year: 2024, context: 'Konkan Folklore', explanation: 'Bittu accidentally awakens the vengeful child-spirit Munjya in Maharashtra.' },
          { position: 4, content_id: 'tmdb-m-1084202', title: 'Stree 2: Sarkate Ka Aatank', release_year: 2024, context: 'Sarkata Battle & Crossovers', explanation: 'Vicky unites with Stree and Bhediya to defeat the headless demon Sarkata in Chanderi.' },
          { position: 5, content_id: 'tmdb-m-1084203', title: 'Thama (Vampire Horror Comedy)', release_year: 2025, context: 'Vampire Mythology', explanation: 'Ayushmann Khurrana and Rashmika Mandanna enter the bloody vampire folklore realm.' }
        ]
      }
    ]
  },

  // 5. Kalki Cinematic Universe / Indian Mythological Sci-Fi
  {
    id: 'kalki-cinematic-universe',
    name: 'Kalki Cinematic Universe',
    original_name: 'Nag Ashwin’s Kalki Universe',
    slug: 'kalki',
    category: 'cinematic_universe',
    type: 'cinematic_universe',
    region: 'tollywood',
    genres: ['Science Fiction', 'Action', 'Fantasy', 'Mythology'],
    description: 'Nag Ashwin’s monumental dystopian sci-fi epic blending the ancient Mahabharata epoch with futuristic Kasi in 2898 AD.',
    poster_url: 'https://image.tmdb.org/t/p/w500/kalki2898adposter01r1CMDvyUb.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9lE7iO37H3WjP7e408qE7P1R3j8.jpg',
    available_orders: [
      {
        id: 'kalki-order',
        universe_id: 'kalki-cinematic-universe',
        name: 'The Kalki Timeline',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From Kurukshetra in 3102 BC to the Complex and Shambhala in 2898 AD.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-870096', title: 'Kalki 2898 AD', release_year: 2024, context: 'Part 1: The Incarnation', explanation: 'Immortal Ashwatthama protects the pregnant SUM-80 from bounty hunter Bhairava and Supreme Yaskin.' }
        ]
      }
    ]
  },

  // 6. Baahubali Franchise (S.S. Rajamouli)
  {
    id: 'baahubali-franchise',
    name: 'Baahubali Franchise',
    original_name: 'S.S. Rajamouli’s Baahubali',
    slug: 'baahubali',
    category: 'franchise',
    type: 'franchise',
    region: 'tollywood',
    genres: ['Action', 'Drama', 'Fantasy', 'Adventure'],
    description: 'S.S. Rajamouli’s historical epic of Mahishmati Kingdom starring Prabhas as Amarendra and Mahendra Baahubali.',
    poster_url: 'https://image.tmdb.org/t/p/w500/baahubaliposter01r1CMDvyUb.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1r5SvR47xKV49.jpg',
    available_orders: [
      {
        id: 'baahubali-order',
        universe_id: 'baahubali-franchise',
        name: 'Mahishmati Saga',
        title: 'Release & Story Order',
        order_type: 'release_order',
        description: 'The complete rise, betrayal, and vengeance of the royal bloodline.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-256040', title: 'Baahubali: The Beginning', release_year: 2015, explanation: 'Shiva climbs the waterfall and discovers his royal heritage as Mahendra Baahubali.' },
          { position: 2, content_id: 'tmdb-m-350312', title: 'Baahubali 2: The Conclusion', release_year: 2017, explanation: 'Reveals why Kattappa killed Amarendra Baahubali and the liberation of Mahishmati.' }
        ]
      }
    ]
  },

  // 7. K.G.F Franchise (Prashanth Neel)
  {
    id: 'kgf-franchise',
    name: 'K.G.F Franchise',
    original_name: 'Kolar Gold Fields Saga',
    slug: 'kgf',
    category: 'franchise',
    type: 'franchise',
    region: 'sandalwood',
    genres: ['Action', 'Crime', 'Drama', 'Thriller'],
    description: 'Prashanth Neel’s blockbuster Kannada gangster saga chronicling Rocky Bhai’s rise to rule the Kolar Gold Fields.',
    poster_url: 'https://image.tmdb.org/t/p/w500/kgfchapter2poster01r1CMDvy.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    available_orders: [
      {
        id: 'kgf-order',
        universe_id: 'kgf-franchise',
        name: 'Rocky Bhai Saga',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'From the streets of Bombay to absolute dominion over Narachi.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-560057', title: 'K.G.F: Chapter 1', release_year: 2018, explanation: 'Rocky infiltrates the slave mines of Narachi to assassinate Garuda.' },
          { position: 2, content_id: 'tmdb-m-611579', title: 'K.G.F: Chapter 2', release_year: 2022, explanation: 'Rocky defends his gold empire against Adheera, Inayat Khalil, and Prime Minister Ramika Sen.' }
        ]
      }
    ]
  },

  // 8. Pushpa Franchise (Sukumar)
  {
    id: 'pushpa-franchise',
    name: 'Pushpa Franchise',
    original_name: 'Pushpa: Red Sanders Saga',
    slug: 'pushpa',
    category: 'franchise',
    type: 'franchise',
    region: 'tollywood',
    genres: ['Action', 'Crime', 'Drama', 'Thriller'],
    description: 'Allu Arjun stars as Pushpa Raj rising through the red sandalwood smuggling syndicate in Seshachalam forests.',
    poster_url: 'https://image.tmdb.org/t/p/w500/pushpa2poster01r1CMDvyUbvdme.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg',
    available_orders: [
      {
        id: 'pushpa-order',
        universe_id: 'pushpa-franchise',
        name: 'Red Sanders Syndicate Order',
        title: 'Story Order',
        order_type: 'chronological',
        description: 'The rise and rule of Pushpa Raj.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-690942', title: 'Pushpa: The Rise (Part 1)', release_year: 2021, explanation: 'A daily-wage laborer rises to dominate the red sanders syndicate and clashes with SP Bhanwar Singh Shekhawat.' },
          { position: 2, content_id: 'tmdb-m-998844', title: 'Pushpa 2: The Rule', release_year: 2024, explanation: 'Pushpa expands his empire internationally while engaging in an all-out war with Shekhawat.' }
        ]
      }
    ]
  },

  // 9. Dhoom Franchise (Yash Raj Films)
  {
    id: 'dhoom-franchise',
    name: 'Dhoom Franchise',
    original_name: 'Dhoom Action Heist Trilogy',
    slug: 'dhoom',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Action', 'Crime', 'Thriller'],
    description: 'Yash Raj Films’ iconic superbike heist franchise starring Abhishek Bachchan (ACP Jai Dixit) and Uday Chopra (Ali).',
    poster_url: 'https://image.tmdb.org/t/p/w500/dhoom3poster01r1CMDvyUbvdme.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    available_orders: [
      {
        id: 'dhoom-release',
        universe_id: 'dhoom-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All three high-speed superbike heist blockbusters in order.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-11674', title: 'Dhoom', release_year: 2004, explanation: 'ACP Jai Dixit and mechanic Ali pursue Kabir’s high-speed motorcycle robber gang in Mumbai.' },
          { position: 2, content_id: 'tmdb-m-11675', title: 'Dhoom 2: Back in Action', release_year: 2006, explanation: 'Jai and Ali team with ACP Shonali Bose in Rio de Janeiro to catch master thief Aryan (Mr. A).' },
          { position: 3, content_id: 'tmdb-m-114470', title: 'Dhoom: 3', release_year: 2013, explanation: 'Jai and Ali travel to Chicago to stop magician-acrobat Sahir from bankrupting the Western Bank of Chicago.' }
        ]
      }
    ]
  },

  // 10. Dhamaal Comedy Franchise
  {
    id: 'dhamaal-franchise',
    name: 'Dhamaal Franchise',
    original_name: 'Dhamaal Comedy Universe',
    slug: 'dhamaal',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Comedy', 'Adventure'],
    description: 'Indra Kumar’s madcap treasure hunt comedy franchise starring Riteish Deshmukh, Arshad Warsi, Javed Jaffrey, and Aashish Chaudhary.',
    poster_url: 'https://image.tmdb.org/t/p/w500/dhamaalposter01r1CMDvyUbvdme.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1r5SvR47xKV49.jpg',
    available_orders: [
      {
        id: 'dhamaal-release',
        universe_id: 'dhamaal-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All three treasure-hunting comedy movies in release sequence.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-28260', title: 'Dhamaal', release_year: 2007, explanation: 'Four lazy friends race Inspector Kabir Nayak to Goa to find 10 crore hidden under a big W.' },
          { position: 2, content_id: 'tmdb-m-68388', title: 'Double Dhamaal', release_year: 2011, explanation: 'The four friends seek revenge on Kabir after being swindled out of their fortune in Macau.' },
          { position: 3, content_id: 'tmdb-m-576393', title: 'Total Dhamaal', release_year: 2019, explanation: 'An all-star ensemble races across Janakpur zoo to recover 50 crore hidden underground.' }
        ]
      }
    ]
  },

  // 11. Hera Pheri Franchise
  {
    id: 'hera-pheri-franchise',
    name: 'Hera Pheri Franchise',
    original_name: 'Hera Pheri Cult Comedy',
    slug: 'hera-pheri',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Comedy', 'Crime', 'Drama'],
    description: 'Priyadarshan and Neeraj Vora’s iconic cult comedy starring Akshay Kumar (Raju), Suniel Shetty (Shyam), and Paresh Rawal (Baburao Ganpatrao Apte).',
    poster_url: 'https://image.tmdb.org/t/p/w500/herapheriposter01r1CMDvyUb.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    available_orders: [
      {
        id: 'hera-pheri-release',
        universe_id: 'hera-pheri-franchise',
        name: 'Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'The misadventures of Baburao, Raju, and Shyam.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-24253', title: 'Hera Pheri', release_year: 2000, explanation: 'Three impoverished men get a cross-connection ransom call from kidnapper Kabira.' },
          { position: 2, content_id: 'tmdb-m-44336', title: 'Phir Hera Pheri', release_year: 2006, explanation: 'The trio falls for Anuradha’s chit-fund scam promising to double money in 21 days.' }
        ]
      }
    ]
  },

  // 12. Golmaal Comedy Franchise (Rohit Shetty)
  {
    id: 'golmaal-franchise',
    name: 'Golmaal Franchise',
    original_name: 'Rohit Shetty’s Golmaal',
    slug: 'golmaal',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Comedy', 'Action', 'Drama'],
    description: 'Rohit Shetty’s four-film comedy franchise starring Ajay Devgn (Gopal), Arshad Warsi (Madhav), Tusshar Kapoor (Lucky), and Kunal Kemmu/Shreyas Talpade (Laxman).',
    poster_url: 'https://image.tmdb.org/t/p/w500/golmaalposter01r1CMDvyUbvdme.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/vRQnzOn4H1vgKiF1WqW0qG7QeF1.jpg',
    available_orders: [
      {
        id: 'golmaal-release',
        universe_id: 'golmaal-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All Golmaal comedy films in order of release.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-12966', title: 'Golmaal: Fun Unlimited', release_year: 2006, explanation: 'Four runaway friends take shelter inside an old blind couple’s bungalow.' },
          { position: 2, content_id: 'tmdb-m-16788', title: 'Golmaal Returns', release_year: 2008, explanation: 'Gopal gets stuck on a yacht with an attractive woman and invents an alibi.' },
          { position: 3, content_id: 'tmdb-m-45543', title: 'Golmaal 3', release_year: 2010, explanation: 'Two rival gangs of step-brothers clash in Goa before uniting their parents.' },
          { position: 4, content_id: 'tmdb-m-443463', title: 'Golmaal Again', release_year: 2017, explanation: 'The gang visits their childhood orphanage and discovers it is protected by a friendly ghost.' }
        ]
      }
    ]
  },

  // 13. Bhool Bhulaiyaa Franchise
  {
    id: 'bhool-bhulaiyaa-franchise',
    name: 'Bhool Bhulaiyaa Franchise',
    original_name: 'Bhool Bhulaiyaa Psychological Horror-Comedy',
    slug: 'bhool-bhulaiyaa',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Comedy', 'Horror', 'Mystery'],
    description: 'The hit Indian horror-comedy franchise centered around the haunting spirit of Manjulika inside the royal palace.',
    poster_url: 'https://image.tmdb.org/t/p/w500/bhoolbhulaiyaa3poster01r1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/9r9QxWk8pQ9z8o2J6M6o8vP7e4.jpg',
    available_orders: [
      {
        id: 'bhool-bhulaiyaa-release',
        universe_id: 'bhool-bhulaiyaa-franchise',
        name: 'Theatrical Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'All three Bhool Bhulaiyaa films in order.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-13009', title: 'Bhool Bhulaiyaa', release_year: 2007, explanation: 'Psychiatrist Dr. Aditya Shrivastava investigates paranormal occurrences and dissociative identity disorder in an ancestral palace.' },
          { position: 2, content_id: 'tmdb-m-739992', title: 'Bhool Bhulaiyaa 2', release_year: 2022, explanation: 'Ruhaan (Rooh Baba) poses as a psychic at a Rajasthani mansion and unleashes Manjulika’s ghost.' },
          { position: 3, content_id: 'tmdb-m-1084204', title: 'Bhool Bhulaiyaa 3', release_year: 2024, explanation: 'Rooh Baba returns to Bengal to confront two royal spirits claiming to be Manjulika.' }
        ]
      }
    ]
  },

  // 14. Drishyam Franchise
  {
    id: 'drishyam-franchise',
    name: 'Drishyam Franchise',
    original_name: 'Drishyam Crime Thriller',
    slug: 'drishyam',
    category: 'franchise',
    type: 'franchise',
    region: 'bollywood',
    genres: ['Crime', 'Drama', 'Mystery', 'Thriller'],
    description: 'Jeethu Joseph and Nishikant Kamat’s gripping suspense thriller starring Ajay Devgn as Vijay Salgaonkar shielding his family on October 2nd and 3rd.',
    poster_url: 'https://image.tmdb.org/t/p/w500/drishyamposter01r1CMDvyUbvdme.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    available_orders: [
      {
        id: 'drishyam-release',
        universe_id: 'drishyam-franchise',
        name: 'Release Order',
        title: 'Release Order',
        order_type: 'release_order',
        description: 'The October 2nd incident and the 7-year investigation.',
        is_default: true,
        ordered_entries: [
          { position: 1, content_id: 'tmdb-m-342521', title: 'Drishyam', release_year: 2015, explanation: 'Vijay Salgaonkar creates an airtight alibi on October 2nd after IG Meera Deshmukh’s son disappears.' },
          { position: 2, content_id: 'tmdb-m-943822', title: 'Drishyam 2', release_year: 2022, explanation: 'Seven years later, IG Tarun Ahlawat reopens the case as forensic evidence surfaces.' }
        ]
      }
    ]
  }
];
