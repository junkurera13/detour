import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

// Block a user
export const blockUser = mutation({
  args: {
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    if (user._id === args.blockedId) {
      throw new Error("Cannot block yourself");
    }

    // Check if already blocked
    const existing = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create block record
    const blockId = await ctx.db.insert("blockedUsers", {
      blockerId: user._id,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });

    return blockId;
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const block = await ctx.db
      .query("blockedUsers")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId)
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
    const user = await getAuthenticatedSubscriber(ctx);
    if (user._id !== args.userId1 && user._id !== args.userId2) {
      throw new Error("Not authorized");
    }

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

// Get all users blocked by the current user
export const getBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const blocks = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", user._id))
      .collect();

    // Get user details for each blocked user
    const blockedUsers = await Promise.all(
      blocks.map(async (block) => {
        const blockedUser = await ctx.db.get(block.blockedId);
        return {
          ...block,
          blockedUser,
        };
      })
    );

    return blockedUsers;
  },
});
