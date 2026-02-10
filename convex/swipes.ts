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

export const getLikesForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiped", (q) => q.eq("swipedId", args.userId))
      .collect();

    const likeSwipes = swipes.filter(
      (s) => s.action === "like" || s.action === "superlike"
    );

    // Exclude already-matched users
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();
    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchedUserIds = new Set([
      ...matchesAsUser1.map((m) => m.user2Id),
      ...matchesAsUser2.map((m) => m.user1Id),
    ]);

    const unmatched = likeSwipes.filter((s) => !matchedUserIds.has(s.swiperId));

    const likersWithData = await Promise.all(
      unmatched.map(async (swipe) => {
        const user = await ctx.db.get(swipe.swiperId);
        return user ? { swipe, user } : null;
      })
    );

    return likersWithData.filter((l): l is NonNullable<typeof l> => l !== null);
  },
});
