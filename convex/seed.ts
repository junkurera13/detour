import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Realistic seed profiles for demo
const testUsers = [
  {
    name: "Hana",
    username: "hana.k_",
    birthday: "1999-08-14",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["digital-nomad", "slow-travel"],
    timeNomadic: "2-years",
    interests: ["design", "coffee", "hiking", "photography"],
    photos: [
      "https://images.unsplash.com/photo-1742210019103-478c7140efbb?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1722407348647-de76f66f3b94?w=400&h=500&fit=crop",
    ],
    instagram: "hana.k_",
    currentLocation: "Lisbon, Portugal",
    futureTrip: "Barcelona, Spain",
  },
  {
    name: "Marco",
    username: "marcodelucci",
    birthday: "1996-03-22",
    gender: "man",
    lookingFor: ["dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "perpetual-traveler"],
    timeNomadic: "3-years",
    interests: ["surfing", "cooking", "dev", "reading"],
    photos: [
      "https://images.unsplash.com/photo-1680104072294-e9e15e26c5cc?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1758172071541-6021168efb47?w=400&h=500&fit=crop",
    ],
    instagram: "marcodelucci",
    currentLocation: "Canggu, Bali",
    futureTrip: "Chiang Mai, Thailand",
  },
  {
    name: "Jess",
    username: "jess_ontheroad",
    birthday: "2001-05-10",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["backpacker", "hostel-hopper"],
    timeNomadic: "1-year",
    interests: ["writing", "live-music", "street-food", "yoga"],
    photos: [
      "https://images.unsplash.com/photo-1770363759112-3f3a3dd874c1?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1763765970643-8ecf39d13ad2?w=400&h=500&fit=crop",
    ],
    currentLocation: "Chiang Mai, Thailand",
    futureTrip: "Vietnam",
  },
  {
    name: "Tomas",
    username: "tomasux",
    birthday: "1994-11-02",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "expat"],
    timeNomadic: "4-years",
    interests: ["design", "photography", "wine", "climbing"],
    photos: [
      "https://images.unsplash.com/photo-1645389415483-597cb1888423?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=500&fit=crop",
    ],
    instagram: "tomasux",
    currentLocation: "Barcelona, Spain",
    futureTrip: "Lisbon, Portugal",
  },
  {
    name: "Aisha",
    username: "aisha.o",
    birthday: "1998-07-19",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["digital-nomad", "slow-travel"],
    timeNomadic: "2-years",
    interests: ["content-creator", "fitness", "cooking", "photography"],
    photos: [
      "https://images.unsplash.com/photo-1752617815086-6ef8f772d841?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1501785888041-af0119f7cbe7?w=400&h=500&fit=crop",
    ],
    instagram: "aisha.o",
    currentLocation: "Cape Town, South Africa",
    futureTrip: "Bali, Indonesia",
  },
  {
    name: "Nate",
    username: "natethompson_",
    birthday: "1997-01-28",
    gender: "man",
    lookingFor: ["dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "2-years",
    interests: ["muay-thai", "food", "coffee", "podcasts"],
    photos: [
      "https://images.unsplash.com/photo-1764451850143-428a7f9e931d?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop",
    ],
    instagram: "natethompson_",
    currentLocation: "Bangkok, Thailand",
    futureTrip: "Da Nang, Vietnam",
  },
  {
    name: "Camille",
    username: "camille.jpg",
    birthday: "2000-09-05",
    gender: "woman",
    lookingFor: ["friends"],
    datingPreference: [],
    lifestyle: ["backpacker", "slow-travel"],
    timeNomadic: "1-year",
    interests: ["photography", "art", "food", "markets"],
    photos: [
      "https://images.unsplash.com/photo-1767396857831-b99623e921cf?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=500&fit=crop",
    ],
    instagram: "camille.jpg",
    currentLocation: "Mexico City, Mexico",
    futureTrip: "Guatemala",
  },
  {
    name: "Ravi",
    username: "ravi.codes",
    birthday: "1995-04-12",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "3-years",
    interests: ["dev", "chess", "hiking", "coffee"],
    photos: [
      "https://images.unsplash.com/photo-1754091152246-8d48d91666f8?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop",
    ],
    instagram: "ravi.codes",
    currentLocation: "Tbilisi, Georgia",
    futureTrip: "Istanbul, Turkey",
  },
  {
    name: "Linnea",
    username: "linneainasia",
    birthday: "2002-12-17",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men", "women"],
    lifestyle: ["digital-nomad", "hostel-hopper"],
    timeNomadic: "1-year",
    interests: ["diving", "dancing", "languages", "food"],
    photos: [
      "https://images.unsplash.com/photo-1766193229155-0fb4ed917a9e?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop",
    ],
    currentLocation: "Da Nang, Vietnam",
    futureTrip: "Philippines",
  },
  {
    name: "Seb",
    username: "seb_writes",
    birthday: "1998-06-25",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "slow-travel"],
    timeNomadic: "2-years",
    interests: ["writing", "salsa", "coffee", "hiking"],
    photos: [
      "https://images.unsplash.com/photo-1551022372-0bdac482b9d6?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=500&fit=crop",
    ],
    instagram: "seb_writes",
    currentLocation: "Medellin, Colombia",
    futureTrip: "Mexico City, Mexico",
  },
  {
    name: "Mei",
    username: "meimei.draws",
    birthday: "1997-10-03",
    gender: "woman",
    lookingFor: ["friends"],
    datingPreference: [],
    lifestyle: ["digital-nomad", "slow-travel"],
    timeNomadic: "2-years",
    interests: ["illustration", "anime", "ramen", "photography"],
    photos: [
      "https://images.unsplash.com/photo-1593049593706-ae61b2b8da4d?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1501785888041-af0119f7cbe7?w=400&h=500&fit=crop",
    ],
    instagram: "meimei.draws",
    currentLocation: "Tokyo, Japan",
    futureTrip: "Seoul, South Korea",
  },
  {
    name: "Oscar",
    username: "oscardata",
    birthday: "1993-02-08",
    gender: "man",
    lookingFor: ["dating"],
    datingPreference: ["women"],
    lifestyle: ["expat", "digital-nomad"],
    timeNomadic: "5-years",
    interests: ["craft-beer", "history", "cycling", "reading"],
    photos: [
      "https://images.unsplash.com/photo-1635942766959-e33b5ba01091?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop",
    ],
    currentLocation: "Porto, Portugal",
    futureTrip: "Morocco",
  },
  {
    name: "Thalia",
    username: "thaliayoga",
    birthday: "1999-03-30",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["slow-travel", "yoga-retreat"],
    timeNomadic: "2-years",
    interests: ["yoga", "meditation", "cooking", "journaling"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=500&fit=crop",
    ],
    instagram: "thaliayoga",
    currentLocation: "Ubud, Bali",
    futureTrip: "Goa, India",
  },
  {
    name: "Diego",
    username: "diegoshoots",
    birthday: "2000-07-14",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "backpacker"],
    timeNomadic: "1-year",
    interests: ["videography", "street-food", "skateboarding", "music"],
    photos: [
      "https://images.unsplash.com/photo-1762708551725-adf8e867e659?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop",
    ],
    instagram: "diegoshoots",
    currentLocation: "Seoul, South Korea",
    futureTrip: "Tokyo, Japan",
  },
  {
    name: "Zoe",
    username: "zoenz",
    birthday: "1996-11-22",
    gender: "woman",
    lookingFor: ["dating"],
    datingPreference: ["men"],
    lifestyle: ["digital-nomad", "perpetual-traveler"],
    timeNomadic: "3-years",
    interests: ["diving", "wine", "sailing", "cooking"],
    photos: [
      "https://images.unsplash.com/photo-1759476531297-ebf52e98ebbb?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop",
    ],
    instagram: "zoenz",
    currentLocation: "Split, Croatia",
    futureTrip: "Montenegro",
  },
];

export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let seededCount = 0;

    for (const user of testUsers) {
      // Check if username already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", user.username))
        .first();

      if (!existing) {
        await ctx.db.insert("users", {
          ...user,
          joinPath: "invite",
          inviteCode: "SEED",
          userStatus: "approved",
          createdAt: now,
          updatedAt: now,
        });
        seededCount++;
      }
    }

    return { message: `Seeded ${seededCount} test users`, count: seededCount };
  },
});

// Help requests seed data — references seeded users by username
const testHelpRequests = [
  {
    username: "clara.sails",
    title: "sunroof seal leaking during rain",
    description: "my van sunroof started leaking after the last big storm. water drips onto the bed area. need someone who knows how to reseal or replace the gasket. i have basic tools.",
    category: "repairs",
    location: "Split, Croatia",
    isUrgent: true,
    hoursAgo: 0.75,
  },
  {
    username: "ryan.surfs",
    title: "need help installing solar panel",
    description: "just got a 200w solar panel for my van but have no clue how to wire it to the battery. looking for someone with electrical experience to help me set it up properly.",
    category: "electrical",
    location: "Canggu, Bali",
    isUrgent: false,
    hoursAgo: 2,
  },
  {
    username: "emma.explores",
    title: "building a fold-out desk for my van",
    description: "want to build a small fold-out desk that mounts to the wall of my sprinter. need someone handy with woodworking or who has done a similar build. happy to pay for time + materials.",
    category: "build",
    location: "Barcelona, Spain",
    isUrgent: false,
    hoursAgo: 5,
  },
  {
    username: "dan.eth",
    title: "shower drain clogged in hostel room",
    description: "the drain in my private hostel bathroom is completely blocked. hostel staff said they cant fix it til next week. anyone have a drain snake or know a quick fix?",
    category: "plumbing",
    location: "Bangkok, Thailand",
    isUrgent: true,
    hoursAgo: 0.5,
  },
  {
    username: "mia.writes",
    title: "led strip lights flickering at night",
    description: "installed led strips in my camper last month and now they flicker randomly. might be a loose connection or a voltage issue. need someone who understands 12v systems.",
    category: "electrical",
    location: "Porto, Portugal",
    isUrgent: false,
    hoursAgo: 8,
  },
  {
    username: "luna.free",
    title: "help moving furniture into new apartment",
    description: "just signed a 3-month lease and need help carrying a couch and desk up 3 flights of stairs. will buy you lunch and beers after!",
    category: "other",
    location: "Tulum, Mexico",
    isUrgent: false,
    hoursAgo: 1,
  },
  {
    username: "alex.vanlife",
    title: "van side door won't lock properly",
    description: "the sliding door on my vw transporter won't latch closed anymore. it slides fine but the lock mechanism seems jammed. worried about security at night.",
    category: "repairs",
    location: "Cape Town, South Africa",
    isUrgent: true,
    hoursAgo: 3,
  },
  {
    username: "lucas.builds",
    title: "mounting a monitor on the wall safely",
    description: "renting an apartment for 2 months and want to mount a small monitor on the wall for work. need to do it without damaging the wall too much. anyone done this before?",
    category: "build",
    location: "Medellín, Colombia",
    isUrgent: false,
    hoursAgo: 12,
  },
  {
    username: "nina.vibes",
    title: "water pump making weird noise",
    description: "the 12v water pump in my van started making a grinding noise when i turn on the tap. water still flows but the sound is concerning. could be air in the line or the pump dying.",
    category: "plumbing",
    location: "Berlin, Germany",
    isUrgent: false,
    hoursAgo: 6,
  },
  {
    username: "tom.adventures",
    title: "setting up a starlink dish on my rv",
    description: "just got starlink and need help figuring out the best mounting position on my rv roof. also not sure about the wiring to run it inside. anyone with starlink experience?",
    category: "electrical",
    location: "Melbourne, Australia",
    isUrgent: false,
    hoursAgo: 18,
  },
  {
    username: "priya.yoga",
    title: "ceiling fan making clicking sound",
    description: "the ceiling fan in my coliving space started making a loud clicking sound at high speed. landlord is away for a week. anyone know how to fix this or at least make it quieter?",
    category: "repairs",
    location: "Goa, India",
    isUrgent: false,
    hoursAgo: 4,
  },
  {
    username: "seb_writes",
    title: "need help assembling ikea furniture",
    description: "just moved into a new place and bought a bunch of ikea stuff. wardrobe, desk, and bookshelf. could really use an extra pair of hands. will provide pizza and beer.",
    category: "build",
    location: "Medellin, Colombia",
    isUrgent: false,
    hoursAgo: 1.5,
  },
];

export const seedHelpRequests = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("helpRequests").take(1);
    if (existing.length > 0) {
      return { message: "Help requests already seeded", count: existing.length };
    }

    const now = Date.now();
    let seededCount = 0;

    for (const request of testHelpRequests) {
      // Look up the author by username
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", request.username))
        .first();

      if (!user) continue; // skip if user not found

      await ctx.db.insert("helpRequests", {
        authorId: user._id,
        title: request.title,
        description: request.description,
        category: request.category,
        location: request.location,
        isUrgent: request.isUrgent,
        status: "open",
        createdAt: now - request.hoursAgo * 3600000,
        updatedAt: now - request.hoursAgo * 3600000,
      });
      seededCount++;
    }

    return { message: `Seeded ${seededCount} help requests`, count: seededCount };
  },
});

export const seedHelpOffers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("helpOffers").take(1);
    if (existing.length > 0) {
      return { message: "Help offers already seeded" };
    }

    const requests = await ctx.db.query("helpRequests").collect();
    if (requests.length === 0) {
      return { message: "No help requests found — seed those first" };
    }

    // Get all users to use as offerers
    const users = await ctx.db.query("users").collect();
    if (users.length < 3) {
      return { message: "Not enough users — seed users first" };
    }

    const now = Date.now();
    let seededCount = 0;

    // Offer messages pool
    const offerMessages = [
      "i've done this before, happy to help out!",
      "i can take a look at this for you. free this afternoon.",
      "this is right up my alley — been doing this kind of work for years.",
      "hey! i'm nearby and have the tools for this. let me know when works.",
      "i can help with this. done similar fixes on my own van.",
      "happy to lend a hand! i'll bring my toolkit.",
      "i've got experience with this — can swing by tomorrow if that works.",
      "sounds like a quick fix. i can help today.",
    ];

    const prices = [1500, 2000, 2500, 3000, 3500, 4000, 5000, 7500, 0];

    for (const request of requests) {
      // Each request gets 1-4 offers from random users (not the author)
      const otherUsers = users.filter((u) => u._id !== request.authorId);
      const numOffers = Math.min(1 + Math.floor(Math.random() * 4), otherUsers.length);

      // Shuffle and pick
      const shuffled = [...otherUsers].sort(() => Math.random() - 0.5);
      const offerers = shuffled.slice(0, numOffers);

      for (let i = 0; i < offerers.length; i++) {
        await ctx.db.insert("helpOffers", {
          requestId: request._id,
          offererId: offerers[i]._id,
          price: prices[Math.floor(Math.random() * prices.length)],
          message: offerMessages[Math.floor(Math.random() * offerMessages.length)],
          status: "pending",
          createdAt: now - Math.random() * 3600000 * 2,
          updatedAt: now - Math.random() * 3600000 * 2,
        });
        seededCount++;
      }
    }

    return { message: `Seeded ${seededCount} help offers`, count: seededCount };
  },
});

// Seed matches and messages for the current user
// Pass your username so the function can find your user ID
export const seedMatches = mutation({
  args: { myUsername: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existing = await ctx.db.query("matches").take(1);
    if (existing.length > 0) {
      return { message: "Matches already seeded" };
    }

    // Find the current user
    const myUsername = args.myUsername || "junz";
    const me = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", myUsername))
      .first();

    if (!me) {
      return { message: `User '${myUsername}' not found. Pass your username as myUsername arg.` };
    }

    // Pick seed users to match with
    const matchUsernames = [
      "clara.sails",
      "ryan.surfs",
      "mia.writes",
      "luna.free",
      "nina.vibes",
    ];

    const now = Date.now();
    let matchCount = 0;
    const matchIds: any[] = [];

    for (let i = 0; i < matchUsernames.length; i++) {
      const other = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", matchUsernames[i]))
        .first();

      if (!other) continue;

      const hoursAgo = [2, 18, 48, 120, 240][i] || 24;
      const matchId = await ctx.db.insert("matches", {
        user1Id: me._id,
        user2Id: other._id,
        status: "matched",
        user1Action: "liked",
        user2Action: "liked",
        matchedAt: now - hoursAgo * 3600000,
        createdAt: now - hoursAgo * 3600000,
      });
      matchIds.push({ matchId, otherId: other._id, otherName: other.name, hoursAgo });
      matchCount++;
    }

    // Seed messages for each match
    const conversationTemplates = [
      // clara.sails — casual recent chat
      [
        { fromMe: false, text: "hey! saw you're in croatia too 🇭🇷", minsAgo: 90 },
        { fromMe: true, text: "yess! just got to split a few days ago", minsAgo: 85 },
        { fromMe: false, text: "nice! how are you liking it so far?", minsAgo: 80 },
        { fromMe: true, text: "its amazing honestly. the old town is beautiful", minsAgo: 70 },
        { fromMe: false, text: "right?? have you been to the green market yet?", minsAgo: 65 },
        { fromMe: true, text: "not yet! is it worth checking out?", minsAgo: 55 },
        { fromMe: false, text: "100%. freshest produce ever. i go every morning", minsAgo: 50 },
      ],
      // ryan.surfs — surf plans
      [
        { fromMe: true, text: "hey! your profile says you surf in bali?", minsAgo: 800 },
        { fromMe: false, text: "yeah! almost every morning at echo beach", minsAgo: 780 },
        { fromMe: true, text: "thats awesome. im planning to head there next month", minsAgo: 750 },
        { fromMe: false, text: "you should! the waves are perfect for all levels rn", minsAgo: 720 },
        { fromMe: true, text: "any board rental spots you'd recommend?", minsAgo: 600 },
        { fromMe: false, text: "yeah deus has great boards. or hit up the local shops on the beach road, way cheaper", minsAgo: 580 },
      ],
      // mia.writes — writing + porto
      [
        { fromMe: false, text: "love that you're into writing too! what do you write about?", minsAgo: 2000 },
        { fromMe: true, text: "mostly travel essays and some fiction. you?", minsAgo: 1900 },
        { fromMe: false, text: "same-ish! travel memoirs. porto is giving me so much material", minsAgo: 1850 },
        { fromMe: true, text: "i bet. the city is insanely photogenic", minsAgo: 1800 },
      ],
      // luna.free — short exchange
      [
        { fromMe: true, text: "hey luna!", minsAgo: 5000 },
        { fromMe: false, text: "hiii ☀️", minsAgo: 4800 },
      ],
      // nina.vibes — no messages yet (empty chat)
      [],
    ];

    let messageCount = 0;
    for (let i = 0; i < matchIds.length; i++) {
      const { matchId, otherId } = matchIds[i];
      const messages = conversationTemplates[i] || [];

      for (const msg of messages) {
        await ctx.db.insert("messages", {
          matchId,
          senderId: msg.fromMe ? me._id : otherId,
          content: msg.text,
          messageType: "text",
          createdAt: now - msg.minsAgo * 60000,
        });
        messageCount++;
      }
    }

    return { message: `Seeded ${matchCount} matches and ${messageCount} messages` };
  },
});

export const seedProfileViews = mutation({
  args: { myUsername: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const myUsername = args.myUsername || "junz";
    const me = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", myUsername))
      .first();

    if (!me) {
      return { message: `User '${myUsername}' not found.` };
    }

    // Check if already seeded
    const existing = await ctx.db
      .query("profileViews")
      .withIndex("by_viewed", (q) => q.eq("viewedId", me._id))
      .first();
    if (existing) {
      return { message: "Profile views already seeded" };
    }

    const viewerUsernames = [
      "clara.sails",
      "ryan.surfs",
      "mia.writes",
      "emma.explores",
      "priya.yoga",
    ];

    const now = Date.now();
    let count = 0;

    for (let i = 0; i < viewerUsernames.length; i++) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", viewerUsernames[i]))
        .first();

      if (!viewer) continue;

      const hoursAgo = [0.5, 3, 8, 24, 72][i] || 1;
      await ctx.db.insert("profileViews", {
        viewerId: viewer._id,
        viewedId: me._id,
        createdAt: now - hoursAgo * 3600000,
      });
      count++;
    }

    return { message: `Seeded ${count} profile views for @${myUsername}` };
  },
});

export const seedInviteCodes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if codes already exist
    const existing = await ctx.db.query("inviteCodes").first();
    if (existing) {
      return { message: "Invite codes already seeded" };
    }

    const codes = [
      { code: "NOMAD2024", maxUses: 100 },
      { code: "DETOUR", maxUses: 50 },
      { code: "WANDERER", maxUses: 50 },
      { code: "EXPLORER", maxUses: 25 },
      { code: "DEVTEST", maxUses: 1000 },
    ];

    for (const { code, maxUses } of codes) {
      await ctx.db.insert("inviteCodes", {
        code,
        maxUses,
        currentUses: 0,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    return { message: "Seeded invite codes successfully" };
  },
});

// Realistic van-lifer activities for demo
// Uses usernames from the existing seed users (clara.sails, ryan.surfs, etc.)
const testActivities = [
  {
    hostUsername: "ryan.surfs",
    title: "sunrise surf session",
    description: "early morning surf at echo beach. all levels welcome — i have an extra board if you need one. we'll grab coffee after at deus.",
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop",
    date: "tomorrow",
    time: "6:00 AM",
    location: "Echo Beach, Canggu, Bali",
    category: "surfing",
    tags: ["go-surfing", "beach-days", "grab-coffee"],
    maxAttendees: 8,
    attendeeUsernames: ["priya.yoga", "clara.sails"],
  },
  {
    hostUsername: "dan.eth",
    title: "co-working & coffee hangout",
    description: "working from one of bangkok's best cafes. good wifi, great vibes. join if you want to co-work and meet other remote workers.",
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&h=400&fit=crop",
    date: "today",
    time: "10:00 AM",
    location: "Rocket Coffeebar, Bangkok, Thailand",
    category: "coworking",
    tags: ["cowork-at-cafes", "grab-coffee"],
    maxAttendees: 12,
    attendeeUsernames: ["mia.writes"],
  },
  {
    hostUsername: "priya.yoga",
    title: "sunset yoga on the beach",
    description: "free yoga flow on the beach as the sun goes down. bring your own mat if you have one, otherwise we'll share. all levels — just come as you are.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
    date: "saturday",
    time: "5:30 PM",
    location: "Palolem Beach, Goa, India",
    category: "yoga",
    tags: ["do-yoga", "beach-days", "watch-sunsets", "meditate"],
    maxAttendees: 15,
    attendeeUsernames: ["luna.free", "emma.explores", "nina.vibes"],
  },
  {
    hostUsername: "emma.explores",
    title: "street food tour — el born",
    description: "hitting the best tapas and street food spots in el born. patatas bravas, jamón, pintxos — the works. meet at the santa caterina market entrance.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    date: "friday",
    time: "6:00 PM",
    location: "El Born, Barcelona, Spain",
    category: "food",
    tags: ["try-street-food", "find-hidden-gems", "explore-the-city"],
    maxAttendees: 10,
    attendeeUsernames: ["lucas.builds"],
  },
  {
    hostUsername: "mia.writes",
    title: "photography walk through ribeira",
    description: "exploring porto's riverside neighborhood with cameras. colorful buildings, narrow streets, incredible light. we'll end at a miradouro for sunset shots.",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop",
    date: "sunday",
    time: "4:00 PM",
    location: "Ribeira, Porto, Portugal",
    category: "photography",
    tags: ["take-photos", "explore-the-city", "watch-sunsets"],
    maxAttendees: 8,
    attendeeUsernames: ["emma.explores", "nina.vibes"],
  },
  {
    hostUsername: "tom.adventures",
    title: "nomad meetup & potluck",
    description: "monthly meetup for digital nomads in melbourne. bring a dish to share and your best travel stories. we'll have the rooftop to ourselves.",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop",
    date: "next saturday",
    time: "7:00 PM",
    location: "Fitzroy, Melbourne, Australia",
    category: "community",
    tags: ["cook-together", "grab-drinks", "find-hidden-gems"],
    maxAttendees: 20,
    attendeeUsernames: ["alex.vanlife", "ryan.surfs"],
  },
  {
    hostUsername: "lucas.builds",
    title: "salsa night for beginners",
    description: "always wanted to try salsa? come learn the basics at a beginner-friendly class. no partner needed — we rotate. then we hit the dance floor after.",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "thursday",
    time: "8:00 PM",
    location: "Parque Lleras, Medellín, Colombia",
    category: "dancing",
    tags: ["go-dancing", "grab-drinks"],
    maxAttendees: 16,
    attendeeUsernames: ["luna.free"],
  },
  {
    hostUsername: "clara.sails",
    title: "island hopping day trip",
    description: "heading to the nearby islands for a full day of swimming and snorkeling. boat leaves at 8am sharp. lunch included. about €30 per person for the boat.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
    date: "wednesday",
    time: "8:00 AM",
    location: "Split Harbor, Split, Croatia",
    category: "diving",
    tags: ["go-diving", "beach-days"],
    maxAttendees: 10,
    attendeeUsernames: ["tom.adventures"],
  },
  {
    hostUsername: "luna.free",
    title: "cenote swim & picnic",
    description: "renting bikes to ride to a hidden cenote outside town. crystal clear water, jungle vibes. bringing snacks and drinks — just bring a towel.",
    image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&h=400&fit=crop",
    date: "tomorrow",
    time: "10:00 AM",
    location: "Tulum, Mexico",
    category: "other",
    tags: ["go-cycling", "beach-days", "find-hidden-gems"],
    maxAttendees: 6,
    attendeeUsernames: ["dan.eth"],
  },
  {
    hostUsername: "alex.vanlife",
    title: "morning run along sea point",
    description: "easy 5k along the sea point promenade with ocean views. we'll run at a chill pace — no pressure. coffee after at the promenade cafe.",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
    date: "monday",
    time: "6:30 AM",
    location: "Sea Point Promenade, Cape Town, South Africa",
    category: "fitness",
    tags: ["go-running", "grab-coffee", "beach-days"],
    maxAttendees: 10,
    attendeeUsernames: ["nina.vibes"],
  },
];

export const seedActivities = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("activities").take(1);
    if (existing.length > 0) {
      return { message: "Activities already seeded", count: existing.length };
    }

    const now = Date.now();
    let seededCount = 0;

    for (const activity of testActivities) {
      // Look up the host by username
      const host = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", activity.hostUsername))
        .first();

      if (!host) continue;

      // Look up attendees by username
      const attendeeIds = [];
      for (const username of activity.attendeeUsernames) {
        const attendee = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .first();
        if (attendee) {
          attendeeIds.push(attendee._id);
        }
      }

      await ctx.db.insert("activities", {
        hostId: host._id,
        title: activity.title,
        description: activity.description,
        image: activity.image,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        category: activity.category,
        tags: activity.tags,
        maxAttendees: activity.maxAttendees,
        attendeeIds,
        status: "active",
        createdAt: now - Math.floor(Math.random() * 86400000),
        updatedAt: now,
      });
      seededCount++;
    }

    return { message: `Seeded ${seededCount} activities`, count: seededCount };
  },
});

export const seedSwipes = mutation({
  args: { myUsername: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const myUsername = args.myUsername || "junz";
    const me = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", myUsername))
      .first();

    if (!me) {
      return { message: `User '${myUsername}' not found.` };
    }

    const existingSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiped", (q) => q.eq("swipedId", me._id))
      .first();
    if (existingSwipes) {
      return { message: "Swipes already seeded" };
    }

    const likerUsernames = [
      "hana.k_", "marcodelucci", "jess_ontheroad", "tomasux",
      "aisha.o", "natethompson_", "camille.jpg", "ravi.codes",
      "linneainasia", "seb_writes", "meimei.draws", "oscardata",
    ];

    const now = Date.now();
    let count = 0;

    for (const username of likerUsernames) {
      const liker = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();
      if (!liker) continue;

      const existing = await ctx.db
        .query("swipes")
        .withIndex("by_pair", (q) =>
          q.eq("swiperId", liker._id).eq("swipedId", me._id)
        )
        .first();
      if (existing) continue;

      await ctx.db.insert("swipes", {
        swiperId: liker._id,
        swipedId: me._id,
        action: "like",
        createdAt: now - Math.floor(Math.random() * 86400000 * 3),
      });
      count++;
    }

    return { message: `Seeded ${count} likes for @${myUsername}` };
  },
});
