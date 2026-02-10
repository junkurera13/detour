import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const record = mutation({
  args: { viewedId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!viewer) {
      throw new Error("User not found");
    }

    // Skip if viewing own profile
    if (viewer._id === args.viewedId) {
      return;
    }

    // Upsert: delete old entry for this pair, insert new one
    const existing = await ctx.db
      .query("profileViews")
      .withIndex("by_pair", (q) =>
        q.eq("viewerId", viewer._id).eq("viewedId", args.viewedId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("profileViews", {
      viewerId: viewer._id,
      viewedId: args.viewedId,
      createdAt: Date.now(),
    });
  },
});

export const getRecentViewers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const views = await ctx.db
      .query("profileViews")
      .withIndex("by_viewed", (q) => q.eq("viewedId", user._id))
      .order("desc")
      .take(10);

    const viewers = await Promise.all(
      views.map(async (view) => {
        const viewer = await ctx.db.get(view.viewerId);
        if (!viewer) return null;
        return {
          _id: viewer._id,
          name: viewer.name,
          photos: viewer.photos,
          viewedAt: view.createdAt,
        };
      })
    );

    return viewers.filter(Boolean);
  },
});
