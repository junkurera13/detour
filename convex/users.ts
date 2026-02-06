import { v } from "convex/values";
import { mutation, query, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
    futureTrips: v.optional(v.array(v.object({
      location: v.string(),
      date: v.optional(v.string()),
    }))),
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
    futureTrips: v.optional(v.array(v.object({
      location: v.string(),
      date: v.optional(v.string()),
    }))),
    userStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    // Verify the authenticated user is updating their own profile
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const authUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();
    if (!authUser || authUser._id !== id) {
      throw new Error("Not authorized");
    }

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

    // Get blocked users (both directions)
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.currentUserId))
      .collect();
    const blockedMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked", (q) => q.eq("blockedId", args.currentUserId))
      .collect();

    const blockedUserIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), args.currentUserId))
      .filter((q) => q.eq(q.field("userStatus"), "approved"))
      .take(args.limit ?? 50);

    return users.filter((u) => !swipedUserIds.has(u._id) && !blockedUserIds.has(u._id));
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

// Get waitlist position for pending users
export const getWaitlistPosition = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!currentUser || currentUser.userStatus !== "pending") {
      return null;
    }

    // Count pending users created before this user
    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("userStatus", "pending"))
      .collect();

    // Sort by createdAt and find position
    const sortedUsers = pendingUsers.sort((a, b) => a.createdAt - b.createdAt);
    const position = sortedUsers.findIndex((u) => u._id === currentUser._id) + 1;

    return {
      position,
      totalPending: pendingUsers.length,
    };
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

// Internal action to delete user from Clerk
export const deleteClerkUser = internalAction({
  args: { clerkUserId: v.string() },
  handler: async (_ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY not configured");
      return { success: false, error: "Clerk not configured" };
    }

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users/${args.clerkUserId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to delete Clerk user:", errorText);
        return { success: false, error: errorText };
      }

      console.log("Successfully deleted Clerk user:", args.clerkUserId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting Clerk user:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Delete user account and all associated data
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;
    const clerkUserId = identity.subject;

    // Delete all matches involving the user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .collect();
    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .collect();

    for (const match of [...matchesAsUser1, ...matchesAsUser2]) {
      // Delete all messages in this match
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(match._id);
    }

    // Delete all swipes by the user
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", userId))
      .collect();
    for (const swipe of swipes) {
      await ctx.db.delete(swipe._id);
    }

    // Delete swipes on the user
    const swipesOnUser = await ctx.db
      .query("swipes")
      .withIndex("by_swiped", (q) => q.eq("swipedId", userId))
      .collect();
    for (const swipe of swipesOnUser) {
      await ctx.db.delete(swipe._id);
    }

    // Delete help requests by the user
    const helpRequests = await ctx.db
      .query("helpRequests")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();
    for (const request of helpRequests) {
      // Delete offers on this request
      const offers = await ctx.db
        .query("helpOffers")
        .withIndex("by_request", (q) => q.eq("requestId", request._id))
        .collect();
      for (const offer of offers) {
        await ctx.db.delete(offer._id);
      }
      // Delete conversations for this request
      const conversations = await ctx.db
        .query("helpConversations")
        .withIndex("by_request", (q) => q.eq("requestId", request._id))
        .collect();
      for (const conv of conversations) {
        const helpMsgs = await ctx.db
          .query("helpMessages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        for (const msg of helpMsgs) {
          await ctx.db.delete(msg._id);
        }
        await ctx.db.delete(conv._id);
      }
      await ctx.db.delete(request._id);
    }

    // Delete help offers made by the user
    const helpOffers = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", userId))
      .collect();
    for (const offer of helpOffers) {
      await ctx.db.delete(offer._id);
    }

    // Delete help conversations where user is offerer
    const helpConvsAsOfferer = await ctx.db
      .query("helpConversations")
      .withIndex("by_offerer", (q) => q.eq("offererId", userId))
      .collect();
    for (const conv of helpConvsAsOfferer) {
      const helpMsgs = await ctx.db
        .query("helpMessages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      for (const msg of helpMsgs) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(conv._id);
    }

    // Delete help messages sent by user (in any remaining conversations)
    const helpMessagesBySender = await ctx.db
      .query("helpMessages")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .collect();
    for (const msg of helpMessagesBySender) {
      await ctx.db.delete(msg._id);
    }

    // Finally, delete the user from Convex
    await ctx.db.delete(userId);

    // Schedule deletion from Clerk (runs asynchronously)
    await ctx.scheduler.runAfter(0, internal.users.deleteClerkUser, {
      clerkUserId,
    });

    return { success: true };
  },
});
