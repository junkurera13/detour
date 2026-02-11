import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    reportedId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

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
