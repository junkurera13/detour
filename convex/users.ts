import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    authProvider: v.optional(v.string()),
    name: v.string(),
    username: v.string(),
    birthday: v.string(),
    gender: v.string(),
    lookingFor: v.array(v.string()),
    datingPreference: v.optional(v.array(v.string())),
    lifestyle: v.array(v.string()),
    timeNomadic: v.string(),
    interests: v.array(v.string()),
    photos: v.array(v.string()),
    instagram: v.optional(v.string()),
    currentLocation: v.string(),
    futureTrip: v.optional(v.string()),
    joinPath: v.string(),
    inviteCode: v.optional(v.string()),
    userStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return userId;
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    birthday: v.optional(v.string()),
    gender: v.optional(v.string()),
    lookingFor: v.optional(v.array(v.string())),
    datingPreference: v.optional(v.array(v.string())),
    lifestyle: v.optional(v.array(v.string())),
    timeNomadic: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    photos: v.optional(v.array(v.string())),
    instagram: v.optional(v.string()),
    currentLocation: v.optional(v.string()),
    futureTrip: v.optional(v.string()),
    userStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

export const getNearbyUsers = query({
  args: {
    currentUserId: v.id("users"),
    location: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_location", (q) => q.eq("currentLocation", args.location))
      .filter((q) => q.neq(q.field("_id"), args.currentUserId))
      .filter((q) => q.eq(q.field("userStatus"), "approved"))
      .take(args.limit ?? 20);
    return users;
  },
});

export const getDiscoverUsers = query({
  args: {
    currentUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get users that the current user hasn't swiped on yet
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", args.currentUserId))
      .collect();

    const swipedUserIds = new Set(swipes.map((s) => s.swipedId));

    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), args.currentUserId))
      .filter((q) => q.eq(q.field("userStatus"), "approved"))
      .take(args.limit ?? 50);

    return users.filter((u) => !swipedUserIds.has(u._id));
  },
});

export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    return !existing;
  },
});
