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
    // Check if users already seeded (more than 5 users means seeded)
    const existingUsers = await ctx.db.query("users").take(10);
    if (existingUsers.length >= 10) {
      return { message: "Users already seeded", count: existingUsers.length };
    }

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
