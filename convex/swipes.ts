import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedSubscriber } from "./auth";

function getMatchPairKey(userAId: string, userBId: string) {
  return [userAId, userBId].sort().join(":");
}

export const create = mutation({
  args: {
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass"), v.literal("superlike")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    if (user._id === args.swipedId) {
      throw new Error("Cannot swipe on yourself");
    }

    // Check if swipe already exists
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_pair", (q) =>
        q.eq("swiperId", user._id).eq("swipedId", args.swipedId)
      )
      .first();

    if (existingSwipe) {
      return { success: false, error: "already swiped on this user" };
    }

    // Create the swipe
    await ctx.db.insert("swipes", {
      swiperId: user._id,
      swipedId: args.swipedId,
      action: args.action,
      createdAt: Date.now(),
    });

    // Check if there's a mutual like (match!)
    if (args.action === "like" || args.action === "superlike") {
      const reverseSwipe = await ctx.db
        .query("swipes")
        .withIndex("by_pair", (q) =>
          q.eq("swiperId", args.swipedId).eq("swipedId", user._id)
        )
        .first();

      if (
        reverseSwipe &&
        (reverseSwipe.action === "like" || reverseSwipe.action === "superlike")
      ) {
        const pairKey = getMatchPairKey(String(user._id), String(args.swipedId));

        // Reuse existing match if present to avoid duplicate match records.
        const existingMatch = await ctx.db
          .query("matches")
          .withIndex("by_pair", (q) => q.eq("pairKey", pairKey))
          .first();

        const matchId =
          existingMatch?._id ??
          (await ctx.db.insert("matches", {
            user1Id: user._id,
            user2Id: args.swipedId,
            pairKey,
            status: "matched",
            user1Action: args.action,
            user2Action: reverseSwipe.action,
            matchedAt: Date.now(),
            createdAt: Date.now(),
          }));

        // Send push notifications to both users
        const swiped = await ctx.db.get(args.swipedId);

        if (swiped) {
          // Notify the swiped user
          await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
            recipientId: args.swipedId,
            matcherName: user.name,
            matchId,
          });

          // Notify the swiper
          await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
            recipientId: user._id,
            matcherName: swiped.name,
            matchId,
          });

          // Check for crossing paths (overlapping future trips)
          const userTrips = (user.futureTrips || []).map((t) => t.location);
          const swipedTrips = (swiped.futureTrips || []).map((t) => t.location);
          const allSwipedLocs = [...swipedTrips, swiped.currentLocation];
          const allUserLocs = [...userTrips, user.currentLocation];

          for (const userLoc of userTrips) {
            const userCity = userLoc.split(",")[0].trim().toLowerCase();
            const matchedLoc = allSwipedLocs.find((loc) => {
              const city = loc.split(",")[0].trim().toLowerCase();
              return city.includes(userCity) || userCity.includes(city);
            });
            if (matchedLoc) {
              const city = userLoc.split(",")[0].trim();
              await ctx.scheduler.runAfter(0, internal.notifications.sendCrossingPathsNotification, {
                recipientId: args.swipedId,
                otherUserName: user.name,
                city,
              });
              await ctx.scheduler.runAfter(0, internal.notifications.sendCrossingPathsNotification, {
                recipientId: user._id,
                otherUserName: swiped.name,
                city,
              });
              break; // Only notify for first overlapping city
            }
          }
        }

        return { success: true, isMatch: true, matchId };
      }
    }

    return { success: true, isMatch: false };
  },
});

export const getBySwiper = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);
    return await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", user._id))
      .collect();
  },
});

export const getLikesForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const likeSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiped_action", (q) =>
        q.eq("swipedId", user._id).eq("action", "like")
      )
      .collect();
    const superLikeSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiped_action", (q) =>
        q.eq("swipedId", user._id).eq("action", "superlike")
      )
      .collect();

    const swipes = [...likeSwipes, ...superLikeSwipes];

    // Exclude already-matched users
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

    const matchedUserIds = new Set([
      ...matchesAsUser1.map((m) => m.user2Id),
      ...matchesAsUser2.map((m) => m.user1Id),
    ]);

    const unmatched = likeSwipes.filter((s) => !matchedUserIds.has(s.swiperId));

    // Batch-fetch all liker users to avoid N+1
    const likerIds = [...new Set(unmatched.map((s) => s.swiperId))];
    const likerUsers = await Promise.all(likerIds.map((id) => ctx.db.get(id)));
    const likerMap = new Map(
      likerUsers.filter(Boolean).map((u) => [u!._id, u])
    );

    return unmatched
      .map((swipe) => {
        const likerUser = likerMap.get(swipe.swiperId);
        return likerUser ? { swipe, user: likerUser } : null;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  },
});
