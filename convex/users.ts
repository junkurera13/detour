import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// Get the current authenticated user by their Clerk token
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    return user;
  },
});

// Check if authenticated user exists, used after Clerk sign-in
export const getOrCreateByToken = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const tokenIdentifier = identity.subject;

    // Check if user exists with this token
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (existingUser) {
      return { user: existingUser, isNew: false };
    }

    // Check if user exists by email (for account linking)
    if (identity.email) {
      const userByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .first();

      if (userByEmail) {
        // Link existing user to Clerk
        await ctx.db.patch(userByEmail._id, {
          tokenIdentifier,
          email: identity.email,
          updatedAt: Date.now(),
        });
        return { user: userByEmail, isNew: false };
      }
    }

    // Return null to indicate new user needs onboarding
    return { user: null, isNew: true, tokenIdentifier };
  },
});

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
    // Get the authenticated user's identity
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity?.subject;

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      ...args,
      tokenIdentifier,
      email: identity?.email ?? args.email,
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

// Save push notification token for authenticated user
export const savePushToken = mutation({
  args: {
    expoPushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      // User may not be created yet during onboarding
      console.log("User not found for push token save, will save later");
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(user._id, {
      expoPushToken: args.expoPushToken,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Internal query to get user by ID (for notifications)
export const getByIdInternal = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
