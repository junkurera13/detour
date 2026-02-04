import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Block a user
export const blockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already blocked
    const existing = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", args.blockerId).eq("blockedId", args.blockedId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create block record
    const blockId = await ctx.db.insert("blockedUsers", {
      blockerId: args.blockerId,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });

    return blockId;
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", args.blockerId).eq("blockedId", args.blockedId)
      )
      .first();

    if (block) {
      await ctx.db.delete(block._id);
    }
  },
});

// Check if a user is blocked (either direction)
export const isBlocked = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user1 blocked user2
    const block1 = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", args.userId1).eq("blockedId", args.userId2)
      )
      .first();

    if (block1) {
      return { blocked: true, blockedBy: args.userId1 };
    }

    // Check if user2 blocked user1
    const block2 = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", args.userId2).eq("blockedId", args.userId1)
      )
      .first();

    if (block2) {
      return { blocked: true, blockedBy: args.userId2 };
    }

    return { blocked: false, blockedBy: null };
  },
});

// Get all users blocked by a user
export const getBlockedUsers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.userId))
      .collect();

    // Get user details for each blocked user
    const blockedUsers = await Promise.all(
      blocks.map(async (block) => {
        const user = await ctx.db.get(block.blockedId);
        return {
          ...block,
          blockedUser: user,
        };
      })
    );

    return blockedUsers;
  },
});
