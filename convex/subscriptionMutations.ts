import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const setEntitlementForToken = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    hasDetourPlus: v.boolean(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();

    if (!user) {
      return { updated: false };
    }

    await ctx.db.patch(user._id, {
      hasDetourPlus: args.hasDetourPlus,
      subscriptionUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

