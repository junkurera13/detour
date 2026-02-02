import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.string(), // "like", "pass", "superlike"
  },
  handler: async (ctx, args) => {
    // Check if swipe already exists
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_pair", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId)
      )
      .first();

    if (existingSwipe) {
      return { success: false, error: "already swiped on this user" };
    }

    // Create the swipe
    await ctx.db.insert("swipes", {
      ...args,
      createdAt: Date.now(),
    });

    // Check if there's a mutual like (match!)
    if (args.action === "like" || args.action === "superlike") {
      const reverseSwipe = await ctx.db
        .query("swipes")
        .withIndex("by_pair", (q) =>
          q.eq("swiperId", args.swipedId).eq("swipedId", args.swiperId)
        )
        .first();

      if (
        reverseSwipe &&
        (reverseSwipe.action === "like" || reverseSwipe.action === "superlike")
      ) {
        // It's a match! Create match record
        const matchId = await ctx.db.insert("matches", {
          user1Id: args.swiperId,
          user2Id: args.swipedId,
          status: "matched",
          user1Action: args.action,
          user2Action: reverseSwipe.action,
          matchedAt: Date.now(),
          createdAt: Date.now(),
        });

        return { success: true, isMatch: true, matchId };
      }
    }

    return { success: true, isMatch: false };
  },
});

export const getBySwiper = query({
  args: { swiperId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", args.swiperId))
      .collect();
  },
});
