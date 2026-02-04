import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set typing status for a user in a match
export const setTyping = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check for existing typing status
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_match_and_user", (q) =>
        q.eq("matchId", args.matchId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingStatus", {
        matchId: args.matchId,
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get typing status for a match (returns the other user's typing status)
export const getTypingStatus = query({
  args: {
    matchId: v.id("matches"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the match to find the other user
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const otherUserId =
      match.user1Id === args.currentUserId ? match.user2Id : match.user1Id;

    // Get typing status for the other user
    const status = await ctx.db
      .query("typingStatus")
      .withIndex("by_match_and_user", (q) =>
        q.eq("matchId", args.matchId).eq("userId", otherUserId)
      )
      .first();

    // Consider typing status stale after 5 seconds
    if (status && status.isTyping && Date.now() - status.updatedAt < 5000) {
      return { isTyping: true, userId: otherUserId };
    }

    return { isTyping: false, userId: otherUserId };
  },
});

// Clear all typing statuses for a user (when they leave a chat)
export const clearTyping = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const statuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(
      statuses.map((status) =>
        ctx.db.patch(status._id, { isTyping: false, updatedAt: Date.now() })
      )
    );
  },
});
