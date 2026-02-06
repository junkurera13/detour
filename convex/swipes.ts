import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.string(), // "like", "pass", "superlike"
  },
  handler: async (ctx, args) => {
    // Verify the authenticated user is the swiper
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const authUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();
    if (!authUser || authUser._id !== args.swiperId) {
      throw new Error("Not authorized");
    }

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

        // Send push notifications to both users
        const swiper = await ctx.db.get(args.swiperId);
        const swiped = await ctx.db.get(args.swipedId);

        if (swiper && swiped) {
          // Notify the swiped user
          await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
            recipientId: args.swipedId,
            matcherName: swiper.name,
            matchId,
          });

          // Notify the swiper
          await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
            recipientId: args.swiperId,
            matcherName: swiped.name,
            matchId,
          });
        }

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
