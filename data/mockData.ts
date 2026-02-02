// Mock data to make the app feel lively during testing
// Uses Unsplash for realistic profile photos

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

// Realistic profile photos from Unsplash
const malePhotos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=500&fit=crop&crop=face',
];

const femalePhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face',
];

const lifestylePhotos = [
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop',
];

// 30 diverse mock users
export const mockUsers: MockUser[] = [
  {
    id: 'user_1',
    name: 'Sofia',
    age: 27,
    gender: 'woman',
    location: 'Bali, Indonesia',
    futureTrip: 'Bangkok, Thailand',
    lifestyle: ['digital-nomad', 'slow-travel'],
    interests: ['yoga', 'surfing', 'photography', 'vegan', 'meditation'],
    photos: [femalePhotos[0], lifestylePhotos[0], lifestylePhotos[2]],
    bio: 'UX designer exploring SEA one cafe at a time. Always chasing sunsets and good wifi. 🌅',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'sofia.wanders',
    isOnline: true,
  },
  {
    id: 'user_2',
    name: 'Marcus',
    age: 31,
    gender: 'man',
    location: 'Lisbon, Portugal',
    futureTrip: 'Bali, Indonesia',
    lifestyle: ['digital-nomad', 'perpetual-traveler'],
    interests: ['entrepreneur', 'surfing', 'wine-tasting', 'reading', 'hiking'],
    photos: [malePhotos[0], lifestylePhotos[1], lifestylePhotos[4]],
    bio: 'Building my startup while traveling. Former finance bro turned beach lover. Let\'s grab coffee!',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    instagram: 'marcus.builds',
    isOnline: false,
    lastActive: '2h ago',
  },
  {
    id: 'user_3',
    name: 'Yuki',
    age: 25,
    gender: 'woman',
    location: 'Tokyo, Japan',
    futureTrip: 'Seoul, South Korea',
    lifestyle: ['backpacker', 'hostel-hopper'],
    interests: ['photography', 'street-art', 'ramen', 'anime', 'live-music'],
    photos: [femalePhotos[1], lifestylePhotos[3]],
    bio: 'Capturing stories through my lens. Night markets > fine dining. Always up for karaoke!',
    timeNomadic: '1-year',
    lookingFor: 'friends',
    isOnline: true,
  },
  {
    id: 'user_4',
    name: 'James',
    age: 29,
    gender: 'man',
    location: 'Chiang Mai, Thailand',
    futureTrip: 'Vietnam',
    lifestyle: ['digital-nomad', 'cafe-working'],
    interests: ['content-creator', 'muay-thai', 'cooking', 'motorcycles', 'podcasts'],
    photos: [malePhotos[1], lifestylePhotos[5]],
    bio: 'YouTuber documenting nomad life. Training Muay Thai when not editing. Coffee addict.',
    timeNomadic: '4-years',
    lookingFor: 'both',
    instagram: 'james.nomads',
    isOnline: false,
    lastActive: '30m ago',
  },
  {
    id: 'user_5',
    name: 'Emma',
    age: 28,
    gender: 'woman',
    location: 'Barcelona, Spain',
    futureTrip: 'Lisbon, Portugal',
    lifestyle: ['slow-travel', 'expat'],
    interests: ['dancing', 'wine-tasting', 'architecture', 'cooking', 'festivals'],
    photos: [femalePhotos[2], lifestylePhotos[0], lifestylePhotos[1]],
    bio: 'Former London girl living la vida loca. Love flamenco, tapas, and spontaneous adventures.',
    timeNomadic: '2-years',
    lookingFor: 'dating',
    instagram: 'emma.explores',
    isOnline: true,
  },
  {
    id: 'user_6',
    name: 'Lucas',
    age: 33,
    gender: 'man',
    location: 'Medellín, Colombia',
    futureTrip: 'Mexico City',
    lifestyle: ['digital-nomad', 'entrepreneur'],
    interests: ['salsa', 'entrepreneur', 'coffee-cafes', 'hiking', 'spanish'],
    photos: [malePhotos[2], lifestylePhotos[2]],
    bio: 'Running a remote agency while perfecting my salsa. The weather here? *Chef\'s kiss*',
    timeNomadic: '3-years',
    lookingFor: 'both',
    instagram: 'lucas.builds',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_7',
    name: 'Nina',
    age: 26,
    gender: 'woman',
    location: 'Berlin, Germany',
    futureTrip: 'Tbilisi, Georgia',
    lifestyle: ['backpacker', 'hostel-hopper'],
    interests: ['techno', 'clubbing', 'street-art', 'vintage', 'photography'],
    photos: [femalePhotos[3], lifestylePhotos[3]],
    bio: 'Techno enthusiast, vintage collector. Currently exploring Eastern Europe\'s underground scene.',
    timeNomadic: '1-year',
    lookingFor: 'friends',
    isOnline: true,
  },
  {
    id: 'user_8',
    name: 'Alex',
    age: 30,
    gender: 'non-binary',
    location: 'Cape Town, South Africa',
    futureTrip: 'Bali, Indonesia',
    lifestyle: ['van-life', 'perpetual-traveler'],
    interests: ['surfing', 'diving', 'wildlife', 'photography', 'camping'],
    photos: [malePhotos[3], lifestylePhotos[4], lifestylePhotos[5]],
    bio: 'Living in a converted van, chasing waves and wildlife. Marine biologist by training.',
    timeNomadic: '5-years',
    lookingFor: 'both',
    instagram: 'alex.vanlife',
    isOnline: false,
    lastActive: '3h ago',
  },
  {
    id: 'user_9',
    name: 'Priya',
    age: 27,
    gender: 'woman',
    location: 'Goa, India',
    futureTrip: 'Sri Lanka',
    lifestyle: ['slow-travel', 'yoga-retreat'],
    interests: ['yoga', 'meditation', 'ayurveda', 'vegetarian', 'journaling'],
    photos: [femalePhotos[4], lifestylePhotos[0]],
    bio: 'Yoga teacher spreading peace. Love sunset sessions and chai conversations. 🕉️',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'priya.yoga',
    isOnline: true,
  },
  {
    id: 'user_10',
    name: 'Tom',
    age: 32,
    gender: 'man',
    location: 'Melbourne, Australia',
    futureTrip: 'New Zealand',
    lifestyle: ['digital-nomad', 'seasonal-worker'],
    interests: ['rock-climbing', 'hiking', 'craft-beer', 'camping', 'photography'],
    photos: [malePhotos[4], lifestylePhotos[1], lifestylePhotos[5]],
    bio: 'Software dev by day, adventure seeker by weekend. Currently planning a NZ road trip!',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    isOnline: false,
    lastActive: '45m ago',
  },
  {
    id: 'user_11',
    name: 'Luna',
    age: 24,
    gender: 'woman',
    location: 'Tulum, Mexico',
    futureTrip: 'Guatemala',
    lifestyle: ['backpacker', 'workaway-volunteer'],
    interests: ['dancing', 'festivals', 'diving', 'cooking', 'spanish'],
    photos: [femalePhotos[5], lifestylePhotos[2], lifestylePhotos[4]],
    bio: 'Free spirit learning to make tacos. Cenote obsessed. Let\'s dance under the stars!',
    timeNomadic: '1-year',
    lookingFor: 'friends',
    isOnline: true,
  },
  {
    id: 'user_12',
    name: 'Daniel',
    age: 28,
    gender: 'man',
    location: 'Bangkok, Thailand',
    futureTrip: 'Vietnam',
    lifestyle: ['digital-nomad', 'cafe-working'],
    interests: ['foodie', 'street-food', 'muay-thai', 'gaming', 'crypto'],
    photos: [malePhotos[5], lifestylePhotos[3]],
    bio: 'Web3 developer living the Bangkok dream. Ask me about the best pad thai spots!',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'dan.eth',
    isOnline: true,
  },
  {
    id: 'user_13',
    name: 'Mia',
    age: 29,
    gender: 'woman',
    location: 'Porto, Portugal',
    futureTrip: 'Morocco',
    lifestyle: ['slow-travel', 'expat'],
    interests: ['wine-tasting', 'architecture', 'reading', 'painting', 'sunsets'],
    photos: [femalePhotos[6], lifestylePhotos[0], lifestylePhotos[1]],
    bio: 'Writer finding inspiration in old cities. Currently working on my first novel.',
    timeNomadic: '4-years',
    lookingFor: 'dating',
    instagram: 'mia.writes',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_14',
    name: 'Ryan',
    age: 26,
    gender: 'man',
    location: 'Canggu, Bali',
    futureTrip: 'Thailand',
    lifestyle: ['digital-nomad', 'surfer'],
    interests: ['surfing', 'fitness', 'smoothies', 'entrepreneur', 'beach-volleyball'],
    photos: [malePhotos[6], lifestylePhotos[4], lifestylePhotos[5]],
    bio: 'Surf, work, repeat. Building a wellness brand while catching waves. 🏄‍♂️',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'ryan.surfs',
    isOnline: true,
  },
  {
    id: 'user_15',
    name: 'Clara',
    age: 31,
    gender: 'woman',
    location: 'Split, Croatia',
    futureTrip: 'Montenegro',
    lifestyle: ['boat-life', 'perpetual-traveler'],
    interests: ['sailing', 'diving', 'cooking', 'wine-tasting', 'history'],
    photos: [femalePhotos[7], lifestylePhotos[2]],
    bio: 'Living on a sailboat exploring the Adriatic. Former corporate lawyer living my dream.',
    timeNomadic: '3-years',
    lookingFor: 'dating',
    isOnline: false,
    lastActive: '4h ago',
  },
  {
    id: 'user_16',
    name: 'Kai',
    age: 27,
    gender: 'man',
    location: 'Seoul, South Korea',
    futureTrip: 'Japan',
    lifestyle: ['digital-nomad', 'foodie'],
    interests: ['photography', 'street-food', 'k-pop', 'gaming', 'fashion'],
    photos: [malePhotos[7], lifestylePhotos[3]],
    bio: 'Product designer and street food enthusiast. Documenting hidden gems across Asia.',
    timeNomadic: '2-years',
    lookingFor: 'friends',
    instagram: 'kai.eats',
    isOnline: true,
  },
  {
    id: 'user_17',
    name: 'Olivia',
    age: 25,
    gender: 'woman',
    location: 'Buenos Aires, Argentina',
    futureTrip: 'Chile',
    lifestyle: ['backpacker', 'language-learner'],
    interests: ['tango', 'spanish', 'steak', 'live-music', 'photography'],
    photos: [femalePhotos[0], lifestylePhotos[0]],
    bio: 'Teaching English while learning tango. The nightlife here is unreal! 💃',
    timeNomadic: '1-year',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_18',
    name: 'Max',
    age: 34,
    gender: 'man',
    location: 'Prague, Czech Republic',
    futureTrip: 'Budapest',
    lifestyle: ['expat', 'digital-nomad'],
    interests: ['craft-beer', 'history', 'chess', 'reading', 'classical-music'],
    photos: [malePhotos[0], lifestylePhotos[1]],
    bio: 'Tech lead working remotely from Europe\'s most beautiful cities. Chess anyone?',
    timeNomadic: '5-years',
    lookingFor: 'dating',
    isOnline: false,
    lastActive: '2h ago',
  },
  {
    id: 'user_19',
    name: 'Zara',
    age: 28,
    gender: 'woman',
    location: 'Marrakech, Morocco',
    futureTrip: 'Egypt',
    lifestyle: ['slow-travel', 'solo-explorer'],
    interests: ['photography', 'markets', 'cooking', 'textiles', 'history'],
    photos: [femalePhotos[1], lifestylePhotos[2], lifestylePhotos[3]],
    bio: 'Travel photographer capturing colors and stories. The souks are my happy place.',
    timeNomadic: '3-years',
    lookingFor: 'friends',
    instagram: 'zara.captures',
    isOnline: true,
  },
  {
    id: 'user_20',
    name: 'Jake',
    age: 29,
    gender: 'man',
    location: 'Da Nang, Vietnam',
    futureTrip: 'Philippines',
    lifestyle: ['digital-nomad', 'beach-lover'],
    interests: ['surfing', 'motorbikes', 'pho', 'diving', 'content-creator'],
    photos: [malePhotos[1], lifestylePhotos[4]],
    bio: 'Freelance videographer riding through Vietnam. Best coffee in the world here!',
    timeNomadic: '2-years',
    lookingFor: 'both',
    instagram: 'jake.rides',
    isOnline: true,
  },
  // Additional users for variety
  {
    id: 'user_21',
    name: 'Ava',
    age: 26,
    gender: 'woman',
    location: 'Taipei, Taiwan',
    futureTrip: 'Hong Kong',
    lifestyle: ['digital-nomad', 'foodie'],
    interests: ['night-markets', 'bubble-tea', 'hiking', 'temples', 'photography'],
    photos: [femalePhotos[2], lifestylePhotos[5]],
    bio: 'Marketing consultant exploring every night market in Taiwan. Bubble tea is life.',
    timeNomadic: '1-year',
    lookingFor: 'both',
    isOnline: false,
    lastActive: '20m ago',
  },
  {
    id: 'user_22',
    name: 'Noah',
    age: 30,
    gender: 'man',
    location: 'Playa del Carmen, Mexico',
    futureTrip: 'Costa Rica',
    lifestyle: ['digital-nomad', 'diving'],
    interests: ['diving', 'cenotes', 'tacos', 'salsa', 'photography'],
    photos: [malePhotos[2], lifestylePhotos[0]],
    bio: 'Dive instructor turned remote worker. The underwater world is magical! 🤿',
    timeNomadic: '4-years',
    lookingFor: 'dating',
    instagram: 'noah.dives',
    isOnline: true,
  },
  {
    id: 'user_23',
    name: 'Isla',
    age: 27,
    gender: 'woman',
    location: 'Auckland, New Zealand',
    futureTrip: 'Fiji',
    lifestyle: ['van-life', 'adventure'],
    interests: ['hiking', 'bungee', 'photography', 'camping', 'stargazing'],
    photos: [femalePhotos[3], lifestylePhotos[1], lifestylePhotos[5]],
    bio: 'Living in a campervan exploring Middle Earth. Adrenaline junkie at heart!',
    timeNomadic: '2-years',
    lookingFor: 'both',
    isOnline: true,
  },
  {
    id: 'user_24',
    name: 'Leo',
    age: 28,
    gender: 'man',
    location: 'Hoi An, Vietnam',
    futureTrip: 'Cambodia',
    lifestyle: ['slow-travel', 'photographer'],
    interests: ['photography', 'cooking-class', 'cycling', 'temples', 'coffee'],
    photos: [malePhotos[3], lifestylePhotos[2]],
    bio: 'Street photographer documenting daily life in Vietnam. The light here is perfect.',
    timeNomadic: '3-years',
    lookingFor: 'friends',
    instagram: 'leo.shoots',
    isOnline: false,
    lastActive: '1h ago',
  },
  {
    id: 'user_25',
    name: 'Maya',
    age: 32,
    gender: 'woman',
    location: 'Ubud, Bali',
    futureTrip: 'India',
    lifestyle: ['yoga-retreat', 'slow-travel'],
    interests: ['yoga', 'meditation', 'healthy-eating', 'writing', 'retreats'],
    photos: [femalePhotos[4], lifestylePhotos[0]],
    bio: 'Yoga teacher and wellness writer. Found my peace in the rice terraces. Namaste 🙏',
    timeNomadic: '4-years',
    lookingFor: 'dating',
    instagram: 'maya.om',
    isOnline: true,
  },
];

// Users who liked the current user (for "Likes You" section)
export const mockLikesYou: MockUser[] = mockUsers.slice(0, 6);

// Mock matches with conversation potential
export const mockMatches: MockMatch[] = [
  {
    id: 'match_1',
    user: mockUsers[0], // Sofia
    matchedAt: '2 hours ago',
    hasNewMessage: true,
  },
  {
    id: 'match_2',
    user: mockUsers[3], // James
    matchedAt: '1 day ago',
    hasNewMessage: false,
  },
  {
    id: 'match_3',
    user: mockUsers[4], // Emma
    matchedAt: '3 days ago',
    hasNewMessage: true,
  },
  {
    id: 'match_4',
    user: mockUsers[8], // Priya
    matchedAt: '1 week ago',
    hasNewMessage: false,
  },
  {
    id: 'match_5',
    user: mockUsers[10], // Luna
    matchedAt: '2 weeks ago',
    hasNewMessage: false,
  },
];

// Mock conversations with messages
export const mockConversations: MockConversation[] = [
  {
    id: 'conv_1',
    matchId: 'match_1',
    user: mockUsers[0], // Sofia
    lastMessageAt: '5 min ago',
    unreadCount: 2,
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_1',
        content: 'Hey! I saw you\'re heading to Bangkok too! 🎉',
        timestamp: '2h ago',
        isRead: true,
      },
      {
        id: 'msg_2',
        senderId: 'current_user',
        content: 'Yes! Planning to be there next month. Have you been before?',
        timestamp: '1h ago',
        isRead: true,
      },
      {
        id: 'msg_3',
        senderId: 'user_1',
        content: 'A few times! I know all the best cafes for working. We should meet up!',
        timestamp: '30m ago',
        isRead: true,
      },
      {
        id: 'msg_4',
        senderId: 'user_1',
        content: 'There\'s this amazing rooftop coworking space I want to show you',
        timestamp: '5m ago',
        isRead: false,
      },
    ],
  },
  {
    id: 'conv_2',
    matchId: 'match_3',
    user: mockUsers[4], // Emma
    lastMessageAt: '2h ago',
    unreadCount: 1,
    messages: [
      {
        id: 'msg_5',
        senderId: 'current_user',
        content: 'Love that you\'re into flamenco! I\'ve always wanted to learn',
        timestamp: '1d ago',
        isRead: true,
      },
      {
        id: 'msg_6',
        senderId: 'user_5',
        content: 'It\'s addictive! There\'s a great school here in Barcelona if you visit',
        timestamp: '1d ago',
        isRead: true,
      },
      {
        id: 'msg_7',
        senderId: 'user_5',
        content: 'Are you planning to come to Europe anytime soon?',
        timestamp: '2h ago',
        isRead: false,
      },
    ],
  },
  {
    id: 'conv_3',
    matchId: 'match_2',
    user: mockUsers[3], // James
    lastMessageAt: '1d ago',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_8',
        senderId: 'user_4',
        content: 'Yo! Fellow content creator here. What\'s your niche?',
        timestamp: '2d ago',
        isRead: true,
      },
      {
        id: 'msg_9',
        senderId: 'current_user',
        content: 'Nice to meet you! I focus on travel and lifestyle stuff',
        timestamp: '2d ago',
        isRead: true,
      },
      {
        id: 'msg_10',
        senderId: 'user_4',
        content: 'Cool! Maybe we could collab sometime. I\'m in Chiang Mai for another month',
        timestamp: '1d ago',
        isRead: true,
      },
    ],
  },
  {
    id: 'conv_4',
    matchId: 'match_4',
    user: mockUsers[8], // Priya
    lastMessageAt: '3d ago',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_11',
        senderId: 'user_9',
        content: 'Namaste! 🙏 Saw you\'re interested in yoga too',
        timestamp: '1w ago',
        isRead: true,
      },
      {
        id: 'msg_12',
        senderId: 'current_user',
        content: 'Yes! I\'m trying to practice more while traveling',
        timestamp: '5d ago',
        isRead: true,
      },
      {
        id: 'msg_13',
        senderId: 'user_9',
        content: 'If you ever come to Goa, I teach sunrise sessions on the beach!',
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
    title: 'Sunrise Surf Session',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop',
    date: 'Tomorrow',
    time: '6:00 AM',
    location: 'Echo Beach, Canggu',
    host: { name: 'Ryan', avatar: malePhotos[6] },
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
    host: { name: 'Sofia', avatar: femalePhotos[0] },
    attendees: 12,
    maxAttendees: 20,
    category: 'coffee-cafes',
  },
  {
    id: 'act_3',
    title: 'Sunset Yoga Flow',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
    date: 'Today',
    time: '5:30 PM',
    location: 'Yoga Barn, Ubud',
    host: { name: 'Maya', avatar: femalePhotos[4] },
    attendees: 8,
    maxAttendees: 15,
    category: 'yoga',
  },
  {
    id: 'act_4',
    title: 'Night Market Food Tour',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
    date: 'Friday',
    time: '7:00 PM',
    location: 'Seminyak Night Market',
    host: { name: 'Daniel', avatar: malePhotos[5] },
    attendees: 6,
    maxAttendees: 10,
    category: 'foodie',
  },
  {
    id: 'act_5',
    title: 'Beach Volleyball',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&h=400&fit=crop',
    date: 'Saturday',
    time: '4:00 PM',
    location: 'Kuta Beach',
    host: { name: 'Jake', avatar: malePhotos[1] },
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
    host: { name: 'Leo', avatar: malePhotos[3] },
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
    host: { name: 'Nina', avatar: femalePhotos[3] },
    attendees: 15,
    maxAttendees: 30,
    category: 'live-music',
  },
  {
    id: 'act_8',
    title: 'Entrepreneur Breakfast',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop',
    date: 'Monday',
    time: '8:00 AM',
    location: 'Milk & Madu, Canggu',
    host: { name: 'Marcus', avatar: malePhotos[0] },
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
    host: { name: 'Noah', avatar: malePhotos[2] },
    attendees: 4,
    maxAttendees: 6,
    category: 'diving',
  },
  {
    id: 'act_10',
    title: 'Cooking Class - Balinese Cuisine',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
    date: 'Wednesday',
    time: '10:00 AM',
    location: 'Ubud Market',
    host: { name: 'Priya', avatar: femalePhotos[4] },
    attendees: 6,
    maxAttendees: 8,
    category: 'cooking',
  },
];

// Recent profile viewers (for Profile tab)
export const mockProfileViewers: MockUser[] = [
  mockUsers[1], // Marcus
  mockUsers[5], // Lucas
  mockUsers[7], // Alex
  mockUsers[9], // Tom
  mockUsers[12], // Mia
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
