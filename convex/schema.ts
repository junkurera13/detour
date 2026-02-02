import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Auth
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

    // Nomad info
    lifestyle: v.array(v.string()),
    timeNomadic: v.string(),
    interests: v.array(v.string()),

    // Media
    photos: v.array(v.string()), // URLs or storage IDs
    instagram: v.optional(v.string()),

    // Location
    currentLocation: v.string(),
    futureTrip: v.optional(v.string()),

    // Status
    joinPath: v.string(), // "invite" or "apply"
    inviteCode: v.optional(v.string()),
    userStatus: v.string(), // "pending", "approved", "rejected"

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_status", ["userStatus"])
    .index("by_location", ["currentLocation"]),

  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    status: v.string(), // "pending", "matched", "rejected"
    user1Action: v.optional(v.string()), // "liked", "passed"
    user2Action: v.optional(v.string()),
    matchedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_status", ["status"]),

  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.string(), // "text", "image", "location"
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_match", ["matchId"])
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
    .index("by_pair", ["swiperId", "swipedId"]),
});
