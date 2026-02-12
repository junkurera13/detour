import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const allMatches = [...matchesAsUser1, ...matchesAsUser2];

    // Get the other user's info for each match
    const matchesWithUsers = await Promise.all(
      allMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === user._id ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherUserId);
        return {
          ...match,
          otherUser,
        };
      })
    );

    return matchesWithUsers;
  },
});

export const getById = query({
  args: { id: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const match = await ctx.db.get(args.id);
    if (!match) return null;

    // Verify user is part of this match
    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized");
    }

    const user1 = await ctx.db.get(match.user1Id);
    const user2 = await ctx.db.get(match.user2Id);

    return {
      ...match,
      user1,
      user2,
    };
  },
});

export const unmatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Verify user is part of this match
    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.matchId, {
      status: "unmatched",
    });
  },
});
