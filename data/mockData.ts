// Mock data for client-side UI fallbacks during testing

export interface MockUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  futureTrip?: string;
  lifestyle: string[];
  interests: string[];
  photos: string[];
  bio: string;
  timeNomadic: string;
  lookingFor: string;
  instagram?: string;
  isOnline?: boolean;
  lastActive?: string;
}

export interface MockMatch {
  id: string;
  user: MockUser;
  matchedAt: string;
  hasNewMessage?: boolean;
}

export interface MockConversation {
  id: string;
  matchId: string;
  user: MockUser;
  messages: MockMessage[];
  lastMessageAt: string;
  unreadCount: number;
}

export interface MockMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface MockActivity {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  location: string;
  host: {
    name: string;
    avatar: string;
  };
  attendees: number;
  maxAttendees: number;
  category: string;
}

// Primary face photos
const photo = {
  hana: 'https://images.unsplash.com/photo-1742210019103-478c7140efbb?w=400&h=500&fit=crop&crop=face',
  marco: 'https://images.unsplash.com/photo-1680104072294-e9e15e26c5cc?w=400&h=500&fit=crop&crop=face',
  jess: 'https://images.unsplash.com/photo-1770363759112-3f3a3dd874c1?w=400&h=500&fit=crop&crop=face',
  tomas: 'https://images.unsplash.com/photo-1645389415483-597cb1888423?w=400&h=500&fit=crop&crop=face',
  aisha: 'https://images.unsplash.com/photo-1752617815086-6ef8f772d841?w=400&h=500&fit=crop&crop=face',
  nate: 'https://images.unsplash.com/photo-1764451850143-428a7f9e931d?w=400&h=500&fit=crop&crop=face',
  camille: 'https://images.unsplash.com/photo-1767396857831-b99623e921cf?w=400&h=500&fit=crop&crop=face',
  ravi: 'https://images.unsplash.com/photo-1754091152246-8d48d91666f8?w=400&h=500&fit=crop&crop=face',
  linnea: 'https://images.unsplash.com/photo-1766193229155-0fb4ed917a9e?w=400&h=500&fit=crop&crop=face',
  seb: 'https://images.unsplash.com/photo-1551022372-0bdac482b9d6?w=400&h=500&fit=crop&crop=face',
  mei: 'https://images.unsplash.com/photo-1593049593706-ae61b2b8da4d?w=400&h=500&fit=crop&crop=face',
  oscar: 'https://images.unsplash.com/photo-1635942766959-e33b5ba01091?w=400&h=500&fit=crop&crop=face',
  thalia: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
  diego: 'https://images.unsplash.com/photo-1762708551725-adf8e867e659?w=400&h=500&fit=crop&crop=face',
  zoe: 'https://images.unsplash.com/photo-1759476531297-ebf52e98ebbb?w=400&h=500&fit=crop&crop=face',
  kofi: 'https://images.unsplash.com/photo-1726140873349-9c12700bdd76?w=400&h=500&fit=crop&crop=face',
  lena: 'https://images.unsplash.com/photo-1763336306420-9eaa53a5f9db?w=400&h=500&fit=crop&crop=face',
  finn: 'https://images.unsplash.com/photo-1758915214590-fa0cc9ea70ac?w=400&h=500&fit=crop&crop=face',
  amara: 'https://images.unsplash.com/photo-1509503643053-8fc818177382?w=400&h=500&fit=crop&crop=face',
  jules: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
  rina: 'https://images.unsplash.com/photo-1749282106070-0983517c3dda?w=400&h=500&fit=crop&crop=face',
  sam: 'https://images.unsplash.com/photo-1724118135606-b4ff6b631cd3?w=400&h=500&fit=crop&crop=face',
  isla: 'https://images.unsplash.com/photo-1739825353871-2b9c6716142a?w=400&h=500&fit=crop&crop=face',
  leo: 'https://images.unsplash.com/photo-1726140871824-5092b960af0e?w=400&h=500&fit=crop&crop=face',
  priya: 'https://images.unsplash.com/photo-1633108606765-01df4f2efa3f?w=400&h=500&fit=crop&crop=face',
};

// Lifestyle / secondary photos
const lifestyle = {
  laptopCoffee: 'https://images.unsplash.com/photo-1722407348647-de76f66f3b94?w=400&h=500&fit=crop',
  coastalHike: 'https://images.unsplash.com/photo-1758172071541-6021168efb47?w=400&h=500&fit=crop',
  hillOcean: 'https://images.unsplash.com/photo-1763765970643-8ecf39d13ad2?w=400&h=500&fit=crop',
  travel1: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=500&fit=crop',
  mountains: 'https://images.unsplash.com/photo-1501785888041-af0119f7cbe7?w=400&h=500&fit=crop',
  beachSunset: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=500&fit=crop',
  tropicalBeach: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop',
  beachSunrise: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop',
  lakeMountains: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop',
};

export const mockUsers: MockUser[] = [
  {
    id: 'user_1',
    name: 'Hana',
    age: 26,
    gender: 'woman',
    location: 'Lisbon, Portugal',
    futureTrip: 'Barcelona, Spain',
    lifestyle: ['digital-nomad', 'slow-travel'],
    interests: ['design', 'coffee', 'hiking', 'photography'],
    photos: [photo.hana, lifestyle.laptopCoffee, lifestyle.travel1],
    bio: 'moved to lisbon 6 months ago and already cant imagine leaving. graphic designer, coffee snob, sunset chaser',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'hana.k_',
    isOnline: true,
  },
  {
    id: 'user_2',
    name: 'Marco',
    age: 29,
    gender: 'man',
    location: 'Canggu, Bali',
    futureTrip: 'Chiang Mai, Thailand',
    lifestyle: ['digital-nomad', 'perpetual-traveler'],
    interests: ['surfing', 'cooking', 'dev', 'reading'],
    photos: [photo.marco, lifestyle.coastalHike],
    bio: 'building apps from wherever the wifi is decent. currently obsessed with the surf here. italian so i cook',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    instagram: 'marcodelucci',
    isOnline: false,
    lastActive: '2h ago',
  },
  {
    id: 'user_3',
    name: 'Jess',
    age: 24,
    gender: 'woman',
    location: 'Chiang Mai, Thailand',
    futureTrip: 'Vietnam',
    lifestyle: ['backpacker', 'hostel-hopper'],
    interests: ['writing', 'live-music', 'street-food', 'yoga'],
    photos: [photo.jess, lifestyle.hillOcean],
    bio: 'quit my marketing job last year. best decision ever. writing about it while eating pad thai',
    timeNomadic: '1-year',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_4',
    name: 'Tomas',
    age: 31,
    gender: 'man',
    location: 'Barcelona, Spain',
    futureTrip: 'Lisbon, Portugal',
    lifestyle: ['digital-nomad', 'expat'],
    interests: ['design', 'photography', 'wine', 'climbing'],
    photos: [photo.tomas, lifestyle.mountains, lifestyle.lakeMountains],
    bio: 'ux designer from sao paulo. been in barcelona 2 years and still finding new tapas spots. weekend climber',
    timeNomadic: '4-years',
    lookingFor: 'both',
    instagram: 'tomasux',
    isOnline: false,
    lastActive: '30m ago',
  },
  {
    id: 'user_5',
    name: 'Aisha',
    age: 27,
    gender: 'woman',
    location: 'Cape Town, South Africa',
    futureTrip: 'Bali, Indonesia',
    lifestyle: ['digital-nomad', 'slow-travel'],
    interests: ['content-creator', 'fitness', 'cooking', 'photography'],
    photos: [photo.aisha, lifestyle.beachSunset, lifestyle.mountains],
    bio: 'content girly who actually loves her job. always down for a sunset beer. heading to bali next',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'aisha.o',
    isOnline: true,
  },
  {
    id: 'user_6',
    name: 'Nate',
    age: 28,
    gender: 'man',
    location: 'Bangkok, Thailand',
    futureTrip: 'Da Nang, Vietnam',
    lifestyle: ['digital-nomad'],
    interests: ['muay-thai', 'food', 'coffee', 'podcasts'],
    photos: [photo.nate, lifestyle.beachSunrise],
    bio: 'left toronto, dont think im going back anytime soon tbh. product manager by day, muay thai by evening',
    timeNomadic: '2-years',
    lookingFor: 'dating',
    instagram: 'natethompson_',
    isOnline: true,
  },
  {
    id: 'user_7',
    name: 'Camille',
    age: 25,
    gender: 'woman',
    location: 'Mexico City, Mexico',
    futureTrip: 'Guatemala',
    lifestyle: ['backpacker', 'slow-travel'],
    interests: ['photography', 'art', 'food', 'markets'],
    photos: [photo.camille, lifestyle.travel1],
    bio: 'freelance photographer from lyon. my camera roll is 90% food and street art. looking for adventure buddies',
    timeNomadic: '1-year',
    lookingFor: 'friends',
    instagram: 'camille.jpg',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_8',
    name: 'Ravi',
    age: 30,
    gender: 'man',
    location: 'Tbilisi, Georgia',
    futureTrip: 'Istanbul, Turkey',
    lifestyle: ['digital-nomad'],
    interests: ['dev', 'chess', 'hiking', 'coffee'],
    photos: [photo.ravi, lifestyle.lakeMountains],
    bio: 'software engineer. tbilisi is the most underrated city in the world and im not accepting arguments on this',
    timeNomadic: '3-years',
    lookingFor: 'both',
    instagram: 'ravi.codes',
    isOnline: true,
  },
  {
    id: 'user_9',
    name: 'Linnea',
    age: 23,
    gender: 'woman',
    location: 'Da Nang, Vietnam',
    futureTrip: 'Philippines',
    lifestyle: ['digital-nomad', 'hostel-hopper'],
    interests: ['diving', 'dancing', 'languages', 'food'],
    photos: [photo.linnea, lifestyle.tropicalBeach, lifestyle.beachSunset],
    bio: 'swedish girl learning vietnamese (badly). got my dive cert last month. always saying yes to things',
    timeNomadic: '1-year',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_10',
    name: 'Seb',
    age: 27,
    gender: 'man',
    location: 'Medellin, Colombia',
    futureTrip: 'Mexico City, Mexico',
    lifestyle: ['digital-nomad', 'slow-travel'],
    interests: ['writing', 'salsa', 'coffee', 'hiking'],
    photos: [photo.seb, lifestyle.travel1],
    bio: 'copywriter from london. moved here for the weather, stayed for the salsa. still terrible at it',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'seb_writes',
    isOnline: false,
    lastActive: '45m ago',
  },
  {
    id: 'user_11',
    name: 'Mei',
    age: 28,
    gender: 'woman',
    location: 'Tokyo, Japan',
    futureTrip: 'Seoul, South Korea',
    lifestyle: ['digital-nomad', 'slow-travel'],
    interests: ['illustration', 'anime', 'ramen', 'photography'],
    photos: [photo.mei, lifestyle.mountains],
    bio: 'illustrator based in tokyo. drawing in cafes is my whole personality at this point. ramen enthusiast',
    timeNomadic: '2-years',
    lookingFor: 'friends',
    instagram: 'meimei.draws',
    isOnline: true,
  },
  {
    id: 'user_12',
    name: 'Oscar',
    age: 32,
    gender: 'man',
    location: 'Porto, Portugal',
    futureTrip: 'Morocco',
    lifestyle: ['expat', 'digital-nomad'],
    interests: ['craft-beer', 'history', 'cycling', 'reading'],
    photos: [photo.oscar, lifestyle.lakeMountains],
    bio: 'data analyst from berlin. porto has the best pastries and worst parking in europe. cycling everywhere',
    timeNomadic: '5-years',
    lookingFor: 'dating',
    isOnline: false,
    lastActive: '2h ago',
  },
  {
    id: 'user_13',
    name: 'Thalia',
    age: 26,
    gender: 'woman',
    location: 'Ubud, Bali',
    futureTrip: 'Goa, India',
    lifestyle: ['slow-travel', 'yoga-retreat'],
    interests: ['yoga', 'meditation', 'cooking', 'journaling'],
    photos: [photo.thalia, lifestyle.beachSunset],
    bio: 'yoga teacher from athens. came to bali for a month and that was two years ago. no regrets',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'thaliayoga',
    isOnline: true,
  },
  {
    id: 'user_14',
    name: 'Diego',
    age: 25,
    gender: 'man',
    location: 'Seoul, South Korea',
    futureTrip: 'Tokyo, Japan',
    lifestyle: ['digital-nomad', 'backpacker'],
    interests: ['videography', 'street-food', 'skateboarding', 'music'],
    photos: [photo.diego, lifestyle.beachSunrise],
    bio: 'freelance videographer from mexico city. seoul is insane. the food the culture the energy. filming everything',
    timeNomadic: '1-year',
    lookingFor: 'both',
    instagram: 'diegoshoots',
    isOnline: false,
    lastActive: '20m ago',
  },
  {
    id: 'user_15',
    name: 'Zoe',
    age: 29,
    gender: 'woman',
    location: 'Split, Croatia',
    futureTrip: 'Montenegro',
    lifestyle: ['digital-nomad', 'perpetual-traveler'],
    interests: ['diving', 'wine', 'sailing', 'cooking'],
    photos: [photo.zoe, lifestyle.tropicalBeach],
    bio: 'pm from auckland. spent last summer sailing the adriatic and now i cant go back to normal life',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    instagram: 'zoenz',
    isOnline: false,
    lastActive: '4h ago',
  },
  {
    id: 'user_16',
    name: 'Kofi',
    age: 28,
    gender: 'man',
    location: 'Lisbon, Portugal',
    futureTrip: 'Barcelona, Spain',
    lifestyle: ['digital-nomad', 'entrepreneur'],
    interests: ['entrepreneur', 'basketball', 'podcasts', 'cooking'],
    photos: [photo.kofi, lifestyle.laptopCoffee],
    bio: 'running a saas startup from lisbon. accra boy at heart. looking for pickup basketball games and good jollof',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'kofi_builds',
    isOnline: true,
  },
  {
    id: 'user_17',
    name: 'Lena',
    age: 27,
    gender: 'woman',
    location: 'Buenos Aires, Argentina',
    futureTrip: 'Chile',
    lifestyle: ['slow-travel', 'language-learner'],
    interests: ['tango', 'languages', 'wine', 'literature'],
    photos: [photo.lena, lifestyle.travel1, lifestyle.hillOcean],
    bio: 'translator from prague. learning spanish through tango classes. the steak here changed my life',
    timeNomadic: '1-year',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_18',
    name: 'Finn',
    age: 26,
    gender: 'man',
    location: 'Taipei, Taiwan',
    futureTrip: 'Japan',
    lifestyle: ['digital-nomad'],
    interests: ['dev', 'night-markets', 'hiking', 'board-games'],
    photos: [photo.finn, lifestyle.coastalHike],
    bio: 'taught english in korea, learned to code, now freelancing from taipei. night market regular',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'finncodes',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_19',
    name: 'Amara',
    age: 30,
    gender: 'woman',
    location: 'Tulum, Mexico',
    futureTrip: 'Costa Rica',
    lifestyle: ['slow-travel', 'wellness'],
    interests: ['yoga', 'psychology', 'cooking', 'reading'],
    photos: [photo.amara, lifestyle.beachSunset],
    bio: 'remote therapist who took her own advice and left nyc. tulum is healing in ways i didnt expect',
    timeNomadic: '1-year',
    lookingFor: 'dating',
    isOnline: true,
  },
  {
    id: 'user_20',
    name: 'Jules',
    age: 25,
    gender: 'non-binary',
    location: 'Canggu, Bali',
    futureTrip: 'Thailand',
    lifestyle: ['digital-nomad', 'perpetual-traveler'],
    interests: ['design', 'surfing', 'coffee', 'photography'],
    photos: [photo.jules, lifestyle.beachSunrise, lifestyle.tropicalBeach],
    bio: 'ux researcher from amsterdam. somehow ended up in bali. surfing before standup calls is unbeatable',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'jjules_',
    isOnline: true,
  },
  {
    id: 'user_21',
    name: 'Rina',
    age: 24,
    gender: 'woman',
    location: 'Berlin, Germany',
    futureTrip: 'Lisbon, Portugal',
    lifestyle: ['digital-nomad', 'expat'],
    interests: ['social-media', 'techno', 'vintage', 'photography'],
    photos: [photo.rina, lifestyle.travel1],
    bio: 'social media manager from osaka. berlin for the techno scene, staying for the affordable rent (by tokyo standards)',
    timeNomadic: '1-year',
    lookingFor: 'friends',
    isOnline: false,
    lastActive: '3h ago',
  },
  {
    id: 'user_22',
    name: 'Sam',
    age: 33,
    gender: 'man',
    location: 'Prague, Czech Republic',
    futureTrip: 'Budapest, Hungary',
    lifestyle: ['expat', 'digital-nomad'],
    interests: ['startup', 'chess', 'craft-beer', 'running'],
    photos: [photo.sam, lifestyle.mountains],
    bio: 'startup founder from sf. moved to prague because $8 beers in the mission got old. building something cool',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    instagram: 'samdoestech',
    isOnline: false,
    lastActive: '2h ago',
  },
  {
    id: 'user_23',
    name: 'Isla',
    age: 28,
    gender: 'woman',
    location: 'Auckland, New Zealand',
    futureTrip: 'Fiji',
    lifestyle: ['van-life', 'adventure'],
    interests: ['hiking', 'photography', 'camping', 'diving'],
    photos: [photo.isla, lifestyle.hillOcean, lifestyle.coastalHike],
    bio: 'travel nurse from edinburgh. living in a campervan exploring nz. adrenaline junkie in recovery (not really)',
    timeNomadic: '2-years',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_24',
    name: 'Leo',
    age: 27,
    gender: 'man',
    location: 'Hoi An, Vietnam',
    futureTrip: 'Cambodia',
    lifestyle: ['slow-travel', 'photographer'],
    interests: ['photography', 'cooking', 'cycling', 'coffee'],
    photos: [photo.leo, lifestyle.lakeMountains],
    bio: 'photographer from buenos aires. the light in hoi an is unreal. mostly found on a bicycle or at a pho spot',
    timeNomadic: '3-years',
    lookingFor: 'friends',
    instagram: 'leoshootsfilm',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_25',
    name: 'Priya',
    age: 31,
    gender: 'woman',
    location: 'Goa, India',
    futureTrip: 'Sri Lanka',
    lifestyle: ['slow-travel', 'yoga-retreat'],
    interests: ['yoga', 'ayurveda', 'cooking', 'writing'],
    photos: [photo.priya, lifestyle.beachSunset],
    bio: 'wellness coach from mumbai. teaching yoga on the beach and writing about it. goa sunsets hit different',
    timeNomadic: '4-years',
    lookingFor: 'dating',
    instagram: 'priya.goa',
    isOnline: true,
  },
];

// Users who liked the current user (for "Likes You" section)
export const mockLikesYou: MockUser[] = mockUsers.slice(0, 12);

// Mock matches with conversation potential
const matchNow = Date.now();

export const mockMatches: MockMatch[] = [
  {
    id: 'match_1',
    user: mockUsers[0], // Hana
    matchedAt: new Date(matchNow - 2 * 3600000).toISOString(), // 2h ago
    hasNewMessage: true,
  },
  {
    id: 'match_2',
    user: mockUsers[3], // Tomas
    matchedAt: new Date(matchNow - 24 * 3600000).toISOString(), // 1d ago
    hasNewMessage: false,
  },
  {
    id: 'match_3',
    user: mockUsers[4], // Aisha
    matchedAt: new Date(matchNow - 3 * 24 * 3600000).toISOString(), // 3d ago
    hasNewMessage: true,
  },
  {
    id: 'match_4',
    user: mockUsers[8], // Linnea
    matchedAt: new Date(matchNow - 7 * 24 * 3600000).toISOString(), // 1w ago
    hasNewMessage: false,
  },
  {
    id: 'match_5',
    user: mockUsers[12], // Thalia
    matchedAt: new Date(matchNow - 14 * 24 * 3600000).toISOString(), // 2w ago
    hasNewMessage: false,
  },
];

// Mock conversations with messages
export const mockConversations: MockConversation[] = [
  {
    id: 'conv_1',
    matchId: 'match_1',
    user: mockUsers[0], // Hana
    lastMessageAt: '5 min ago',
    unreadCount: 2,
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_1',
        content: 'hey! saw you just got to lisbon too. how are you finding it so far?',
        timestamp: '2h ago',
        isRead: true,
      },
      {
        id: 'msg_2',
        senderId: 'current_user',
        content: 'honestly loving it. the cafe scene is insane. any recs?',
        timestamp: '1h ago',
        isRead: true,
      },
      {
        id: 'msg_3',
        senderId: 'user_1',
        content: 'ok so theres this place in alfama called fabrica, their flat white is perfect',
        timestamp: '30m ago',
        isRead: true,
      },
      {
        id: 'msg_4',
        senderId: 'user_1',
        content: 'we should go sometime! i need more coffee friends here lol',
        timestamp: '5m ago',
        isRead: false,
      },
    ],
  },
  {
    id: 'conv_2',
    matchId: 'match_3',
    user: mockUsers[4], // Aisha
    lastMessageAt: '2h ago',
    unreadCount: 1,
    messages: [
      {
        id: 'msg_5',
        senderId: 'current_user',
        content: 'your cape town photos are amazing! how long have you been there?',
        timestamp: '1d ago',
        isRead: true,
      },
      {
        id: 'msg_6',
        senderId: 'user_5',
        content: 'thank you!! about 4 months now. table mountain never gets old honestly',
        timestamp: '1d ago',
        isRead: true,
      },
      {
        id: 'msg_7',
        senderId: 'user_5',
        content: 'are you thinking about coming to SA at all? its so underrated for nomads',
        timestamp: '2h ago',
        isRead: false,
      },
    ],
  },
  {
    id: 'conv_3',
    matchId: 'match_2',
    user: mockUsers[3], // Tomas
    lastMessageAt: '1d ago',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_8',
        senderId: 'user_4',
        content: 'fellow designer! what tools are you using these days?',
        timestamp: '2d ago',
        isRead: true,
      },
      {
        id: 'msg_9',
        senderId: 'current_user',
        content: 'mostly figma, some framer for prototypes. you?',
        timestamp: '2d ago',
        isRead: true,
      },
      {
        id: 'msg_10',
        senderId: 'user_4',
        content: 'same haha. lmk if you want to cowork sometime, i know a great spot near the gothic quarter',
        timestamp: '1d ago',
        isRead: true,
      },
    ],
  },
  {
    id: 'conv_4',
    matchId: 'match_4',
    user: mockUsers[8], // Linnea
    lastMessageAt: '3d ago',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_11',
        senderId: 'user_9',
        content: 'hej! just saw youre into diving too. have you done any dives around here?',
        timestamp: '1w ago',
        isRead: true,
      },
      {
        id: 'msg_12',
        senderId: 'current_user',
        content: 'not yet! just got my cert. any recommendations for first dives?',
        timestamp: '5d ago',
        isRead: true,
      },
      {
        id: 'msg_13',
        senderId: 'user_9',
        content: 'the cham islands are amazing and only like an hour from da nang! we should go',
        timestamp: '3d ago',
        isRead: true,
      },
    ],
  },
];

// Mock activities for the Explore tab
export const mockActivities: MockActivity[] = [
  {
    id: 'act_1',
    title: 'Morning Surf Session',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop',
    date: 'Tomorrow',
    time: '6:00 AM',
    location: 'Echo Beach, Canggu',
    host: { name: 'Marco', avatar: photo.marco },
    attendees: 4,
    maxAttendees: 8,
    category: 'surfing',
  },
  {
    id: 'act_2',
    title: 'Coworking Coffee Meetup',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&h=400&fit=crop',
    date: 'Today',
    time: '10:00 AM',
    location: 'Hubud, Ubud',
    host: { name: 'Hana', avatar: photo.hana },
    attendees: 12,
    maxAttendees: 20,
    category: 'coffee',
  },
  {
    id: 'act_3',
    title: 'Sunset Yoga',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
    date: 'Today',
    time: '5:30 PM',
    location: 'Yoga Barn, Ubud',
    host: { name: 'Thalia', avatar: photo.thalia },
    attendees: 8,
    maxAttendees: 15,
    category: 'yoga',
  },
  {
    id: 'act_4',
    title: 'Street Food Crawl',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
    date: 'Friday',
    time: '7:00 PM',
    location: 'Seminyak Night Market',
    host: { name: 'Nate', avatar: photo.nate },
    attendees: 6,
    maxAttendees: 10,
    category: 'food',
  },
  {
    id: 'act_5',
    title: 'Beach Volleyball',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&h=400&fit=crop',
    date: 'Saturday',
    time: '4:00 PM',
    location: 'Kuta Beach',
    host: { name: 'Kofi', avatar: photo.kofi },
    attendees: 7,
    maxAttendees: 12,
    category: 'fitness',
  },
  {
    id: 'act_6',
    title: 'Photography Walk',
    image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&h=400&fit=crop',
    date: 'Sunday',
    time: '6:00 AM',
    location: 'Tegallalang Rice Terrace',
    host: { name: 'Leo', avatar: photo.leo },
    attendees: 5,
    maxAttendees: 8,
    category: 'photography',
  },
  {
    id: 'act_7',
    title: 'Live Music Night',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    date: 'Saturday',
    time: '8:00 PM',
    location: 'La Favela, Seminyak',
    host: { name: 'Rina', avatar: photo.rina },
    attendees: 15,
    maxAttendees: 30,
    category: 'music',
  },
  {
    id: 'act_8',
    title: 'Founder Breakfast',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop',
    date: 'Monday',
    time: '8:00 AM',
    location: 'Milk & Madu, Canggu',
    host: { name: 'Sam', avatar: photo.sam },
    attendees: 8,
    maxAttendees: 15,
    category: 'entrepreneur',
  },
  {
    id: 'act_9',
    title: 'Scuba Diving Trip',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
    date: 'Next Tuesday',
    time: '7:00 AM',
    location: 'Nusa Penida',
    host: { name: 'Linnea', avatar: photo.linnea },
    attendees: 4,
    maxAttendees: 6,
    category: 'diving',
  },
  {
    id: 'act_10',
    title: 'Balinese Cooking Class',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
    date: 'Wednesday',
    time: '10:00 AM',
    location: 'Ubud Market',
    host: { name: 'Priya', avatar: photo.priya },
    attendees: 6,
    maxAttendees: 8,
    category: 'cooking',
  },
];

// Recent profile viewers (for Profile tab)
export const mockProfileViewers: MockUser[] = [
  mockUsers[1],  // Marco
  mockUsers[5],  // Nate
  mockUsers[7],  // Ravi
  mockUsers[9],  // Seb
  mockUsers[12], // Thalia
];

// Users heading to your destination
export const getUsersHeadingTo = (destination: string): MockUser[] => {
  return mockUsers.filter(user =>
    user.futureTrip?.toLowerCase().includes(destination.toLowerCase()) ||
    user.location.toLowerCase().includes(destination.toLowerCase())
  );
};

// Users nearby (same location)
export const getUsersNearby = (location: string): MockUser[] => {
  const locationParts = location.toLowerCase().split(',');
  return mockUsers.filter(user => {
    const userLocationParts = user.location.toLowerCase().split(',');
    return locationParts.some(part =>
      userLocationParts.some(userPart =>
        userPart.trim().includes(part.trim()) || part.trim().includes(userPart.trim())
      )
    );
  });
};

// Filter activities by interest
export const getActivitiesByInterest = (interests: string[]): MockActivity[] => {
  if (!interests || interests.length === 0) return mockActivities;
  return mockActivities.filter(activity =>
    interests.some(interest =>
      activity.category.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(activity.category.toLowerCase())
    )
  );
};

// Get random subset of users for discover/swiping
export const getDiscoverUsers = (excludeIds: string[] = [], limit: number = 20): MockUser[] => {
  return mockUsers
    .filter(user => !excludeIds.includes(user.id))
    .slice(0, limit);
};

