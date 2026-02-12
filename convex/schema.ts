import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Auth
    tokenIdentifier: v.optional(v.string()), // Clerk token identifier (subject)
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    authProvider: v.optional(v.string()), // "phone", "google", "apple"

    // Profile basics
    name: v.string(),
    username: v.string(),
    birthday: v.string(), // ISO date string
    gender: v.string(),

    // Preferences
    lookingFor: v.array(v.string()), // ["friends", "dating"]
    datingPreference: v.optional(v.array(v.string())),
    friendsPreference: v.optional(v.array(v.string())),

    // Dating goals
    datingGoals: v.optional(v.array(v.string())), // ["long-term", "life-partner", "casual", "intimacy"]

    // Nomad info
    lifestyle: v.array(v.string()),
    rigType: v.optional(v.string()),
    rigName: v.optional(v.string()),
    rigPhoto: v.optional(v.string()),
    timeNomadic: v.string(),
    interests: v.array(v.string()),

    // Media
    photos: v.array(v.string()), // URLs or storage IDs
    instagram: v.optional(v.string()),

    // Location
    currentLocation: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    futureTrip: v.optional(v.string()), // Legacy field for backward compatibility
    futureTrips: v.optional(v.array(v.object({
      location: v.string(),
      date: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      stopType: v.optional(v.string()), // "city", "campsite", "coworking", "beach", "rest-area", "hostel", "community"
    }))),

    // Pets
    pets: v.optional(v.array(v.object({ type: v.string(), name: v.string(), photo: v.optional(v.string()) }))),

    // Builder profile
    builderBio: v.optional(v.string()),
    builderSpecialties: v.optional(v.array(v.string())),

    // Status
    joinPath: v.string(), // "invite" or "apply"
    inviteCode: v.optional(v.string()),
    userStatus: v.string(), // "pending", "approved", "rejected"

    // Push Notifications
    expoPushToken: v.optional(v.string()),

    // Billing / entitlement
    hasDetourPlus: v.optional(v.boolean()),
    subscriptionUpdatedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_status", ["userStatus"])
    .index("by_location", ["currentLocation"]),

  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    pairKey: v.optional(v.string()), // stable sorted pair key `${minId}:${maxId}`
    status: v.string(), // "pending", "matched", "rejected"
    user1Action: v.optional(v.string()), // "liked", "passed"
    user2Action: v.optional(v.string()),
    matchedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_status", ["status"])
    .index("by_pair", ["pairKey"]),

  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.string(), // "text", "image", "location"
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_match", ["matchId"])
    .index("by_match_created", ["matchId", "createdAt"])
    .index("by_match_read", ["matchId", "readAt"])
    .index("by_sender", ["senderId"]),

  inviteCodes: defineTable({
    code: v.string(),
    createdBy: v.optional(v.id("users")),
    usedBy: v.optional(v.id("users")),
    maxUses: v.number(),
    currentUses: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_creator", ["createdBy"]),

  swipes: defineTable({
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.string(), // "like", "pass", "superlike"
    createdAt: v.number(),
  })
    .index("by_swiper", ["swiperId"])
    .index("by_swiped", ["swipedId"])
    .index("by_swiped_action", ["swipedId", "action"])
    .index("by_pair", ["swiperId", "swipedId"]),

  helpRequests: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(), // "repairs", "electrical", "build", "plumbing", "other"
    location: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    budget: v.optional(v.number()), // cents, optional suggested budget
    isUrgent: v.boolean(),
    status: v.string(), // "open", "in_progress", "completed", "cancelled"
    progressStep: v.optional(v.string()), // "negotiation", "working", "payment", "completed"
    acceptedOfferId: v.optional(v.id("helpOffers")),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_category", ["category"])
    .index("by_created", ["createdAt"]),

  helpOffers: defineTable({
    requestId: v.id("helpRequests"),
    offererId: v.id("users"),
    price: v.optional(v.number()), // cents, optional
    message: v.string(),
    status: v.string(), // "pending", "accepted", "rejected", "withdrawn"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_offerer", ["offererId"]),

  // Help messaging (for accepted offers)
  helpConversations: defineTable({
    requestId: v.id("helpRequests"),
    offerId: v.id("helpOffers"),
    requesterId: v.id("users"), // person who posted the request
    offererId: v.id("users"), // person who made the offer
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_requester", ["requesterId"])
    .index("by_offerer", ["offererId"]),

  helpMessages: defineTable({
    conversationId: v.id("helpConversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.string(), // "text", "image"
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  // Help reviews (reputation system)
  helpReviews: defineTable({
    reviewerId: v.id("users"),
    reviewedId: v.id("users"),
    requestId: v.id("helpRequests"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_reviewed", ["reviewedId"])
    .index("by_request", ["requestId"]),

  // Profile views
  profileViews: defineTable({
    viewerId: v.id("users"),
    viewedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_viewed", ["viewedId", "createdAt"])
    .index("by_pair", ["viewerId", "viewedId"]),

  // Activities / events
  activities: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    endDate: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    maxAttendees: v.optional(v.number()),
    attendeeIds: v.array(v.id("users")),
    status: v.string(), // "active", "cancelled", "completed"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_created", ["createdAt"]),

  // Activity group chat messages
  activityMessages: defineTable({
    activityId: v.id("activities"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.string(), // "text"
    createdAt: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_created", ["activityId", "createdAt"]),

  // Reports
  reports: defineTable({
    reporterId: v.id("users"),
    reportedId: v.id("users"),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported", ["reportedId"]),

  // Blocked users
  blockedUsers: defineTable({
    blockerId: v.id("users"), // user who blocked
    blockedId: v.id("users"), // user who was blocked
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_pair", ["blockerId", "blockedId"]),

  // Community-sourced nomad stops
  nomadStops: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // "campsite", "coworking", "beach", "rest-area", "hostel", "parking", "water", "dump-station", "other"
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())), // "wifi", "water", "electric", "showers", "laundry", "pets-ok"
    photos: v.optional(v.array(v.string())),
    status: v.string(), // "active", "flagged", "removed"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // Saved nomad stops
  stopSaves: defineTable({
    userId: v.id("users"),
    stopId: v.id("nomadStops"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stop", ["stopId"])
    .index("by_pair", ["userId", "stopId"]),

  // Admin auth attempt tracking (rate limit / temporary lockout)
  adminAuthAttempts: defineTable({
    requestKey: v.string(),
    attempts: v.number(),
    firstAttemptAt: v.number(),
    blockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_key", ["requestKey"]),
});
