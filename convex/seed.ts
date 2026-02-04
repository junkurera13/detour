import { mutation } from "./_generated/server";

// Test user data for seeding
const testUsers = [
  {
    name: "Sofia",
    username: "sofia.wanders",
    birthday: "1997-03-15",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["digital-nomad", "slow-travel"],
    timeNomadic: "2-years",
    interests: ["yoga", "surfing", "photography", "meditation"],
    photos: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face"],
    instagram: "sofia.wanders",
    currentLocation: "Bali, Indonesia",
    futureTrip: "Bangkok, Thailand",
  },
  {
    name: "Marcus",
    username: "marcus.builds",
    birthday: "1993-07-22",
    gender: "man",
    lookingFor: ["dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "perpetual-traveler"],
    timeNomadic: "3-years",
    interests: ["entrepreneur", "surfing", "wine", "reading", "hiking"],
    photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"],
    instagram: "marcus.builds",
    currentLocation: "Lisbon, Portugal",
    futureTrip: "Bali, Indonesia",
  },
  {
    name: "Yuki",
    username: "yuki.captures",
    birthday: "1999-11-08",
    gender: "woman",
    lookingFor: ["friends"],
    datingPreference: [],
    lifestyle: ["backpacker", "hostel-hopper"],
    timeNomadic: "1-year",
    interests: ["photography", "art", "food", "music"],
    photos: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face"],
    currentLocation: "Tokyo, Japan",
    futureTrip: "Seoul, South Korea",
  },
  {
    name: "James",
    username: "james.nomads",
    birthday: "1995-02-14",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "4-years",
    interests: ["fitness", "cooking", "photography", "coffee"],
    photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face"],
    instagram: "james.nomads",
    currentLocation: "Chiang Mai, Thailand",
    futureTrip: "Vietnam",
  },
  {
    name: "Emma",
    username: "emma.explores",
    birthday: "1996-06-30",
    gender: "woman",
    lookingFor: ["dating"],
    datingPreference: ["men"],
    lifestyle: ["slow-travel", "expat"],
    timeNomadic: "2-years",
    interests: ["dancing", "wine", "art", "cooking", "music"],
    photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face"],
    instagram: "emma.explores",
    currentLocation: "Barcelona, Spain",
    futureTrip: "Lisbon, Portugal",
  },
  {
    name: "Lucas",
    username: "lucas.builds",
    birthday: "1991-09-05",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "3-years",
    interests: ["dancing", "coffee", "hiking", "languages"],
    photos: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face"],
    instagram: "lucas.builds",
    currentLocation: "Medellín, Colombia",
    futureTrip: "Mexico City",
  },
  {
    name: "Nina",
    username: "nina.vibes",
    birthday: "1998-04-18",
    gender: "woman",
    lookingFor: ["friends"],
    datingPreference: [],
    lifestyle: ["backpacker", "hostel-hopper"],
    timeNomadic: "1-year",
    interests: ["music", "art", "photography", "nightlife"],
    photos: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face"],
    currentLocation: "Berlin, Germany",
    futureTrip: "Tbilisi, Georgia",
  },
  {
    name: "Alex",
    username: "alex.vanlife",
    birthday: "1994-12-01",
    gender: "non-binary",
    lookingFor: ["friends", "dating"],
    datingPreference: ["everyone"],
    lifestyle: ["van-life", "perpetual-traveler"],
    timeNomadic: "5-years",
    interests: ["surfing", "diving", "photography", "camping"],
    photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face"],
    instagram: "alex.vanlife",
    currentLocation: "Cape Town, South Africa",
    futureTrip: "Bali, Indonesia",
  },
  {
    name: "Priya",
    username: "priya.yoga",
    birthday: "1997-08-25",
    gender: "woman",
    lookingFor: ["friends", "dating"],
    datingPreference: ["men"],
    lifestyle: ["slow-travel"],
    timeNomadic: "2-years",
    interests: ["yoga", "meditation", "reading", "cooking"],
    photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face"],
    instagram: "priya.yoga",
    currentLocation: "Goa, India",
    futureTrip: "Sri Lanka",
  },
  {
    name: "Tom",
    username: "tom.adventures",
    birthday: "1992-01-10",
    gender: "man",
    lookingFor: ["dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad", "seasonal-worker"],
    timeNomadic: "3-years",
    interests: ["climbing", "hiking", "photography", "camping"],
    photos: ["https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face"],
    currentLocation: "Melbourne, Australia",
    futureTrip: "New Zealand",
  },
  {
    name: "Luna",
    username: "luna.free",
    birthday: "2000-05-20",
    gender: "woman",
    lookingFor: ["friends"],
    datingPreference: [],
    lifestyle: ["backpacker"],
    timeNomadic: "1-year",
    interests: ["dancing", "diving", "cooking", "languages"],
    photos: ["https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face"],
    currentLocation: "Tulum, Mexico",
    futureTrip: "Guatemala",
  },
  {
    name: "Daniel",
    username: "dan.eth",
    birthday: "1996-10-12",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "2-years",
    interests: ["food", "fitness", "gaming", "coffee"],
    photos: ["https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face"],
    instagram: "dan.eth",
    currentLocation: "Bangkok, Thailand",
    futureTrip: "Vietnam",
  },
  {
    name: "Mia",
    username: "mia.writes",
    birthday: "1995-03-28",
    gender: "woman",
    lookingFor: ["dating"],
    datingPreference: ["men"],
    lifestyle: ["slow-travel", "expat"],
    timeNomadic: "4-years",
    interests: ["wine", "reading", "art", "writing"],
    photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face"],
    instagram: "mia.writes",
    currentLocation: "Porto, Portugal",
    futureTrip: "Morocco",
  },
  {
    name: "Ryan",
    username: "ryan.surfs",
    birthday: "1998-07-07",
    gender: "man",
    lookingFor: ["friends", "dating"],
    datingPreference: ["women"],
    lifestyle: ["digital-nomad"],
    timeNomadic: "2-years",
    interests: ["surfing", "fitness", "coffee"],
    photos: ["https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop&crop=face"],
    instagram: "ryan.surfs",
    currentLocation: "Canggu, Bali",
    futureTrip: "Thailand",
  },
  {
    name: "Clara",
    username: "clara.sails",
    birthday: "1993-11-15",
    gender: "woman",
    lookingFor: ["dating"],
    datingPreference: ["men"],
    lifestyle: ["boat-life", "perpetual-traveler"],
    timeNomadic: "3-years",
    interests: ["diving", "cooking", "wine"],
    photos: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face"],
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
