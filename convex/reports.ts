import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

export const create = mutation({
  args: {
    reportedId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    await ctx.db.insert("reports", {
      reporterId: user._id,
      reportedId: args.reportedId,
      reason: args.reason,
      createdAt: Date.now(),
    });

    // Also block the reported user
    const existingBlock = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.reportedId)
      )
      .first();

    if (!existingBlock) {
      await ctx.db.insert("blockedUsers", {
        blockerId: user._id,
        blockedId: args.reportedId,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});
