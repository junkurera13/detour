import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const validate = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase().trim();

    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();

    if (!inviteCode) {
      return { isValid: false, error: "invalid invite code" };
    }

    if (!inviteCode.isActive) {
      return { isValid: false, error: "this code is no longer active" };
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < Date.now()) {
      return { isValid: false, error: "this code has expired" };
    }

    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return { isValid: false, error: "this code has reached its usage limit" };
    }

    return { isValid: true, codeId: inviteCode._id };
  },
});

export const use = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase().trim();

    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();

    if (!inviteCode) {
      return { success: false, error: "invalid invite code" };
    }

    await ctx.db.patch(inviteCode._id, {
      currentUses: inviteCode.currentUses + 1,
      usedBy: args.userId,
    });

    // Auto-approve user who used valid invite code
    await ctx.db.patch(args.userId, {
      userStatus: "approved",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    createdBy: v.optional(v.id("users")),
    maxUses: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const codeId = await ctx.db.insert("inviteCodes", {
      code: args.code.toUpperCase().trim(),
      createdBy: args.createdBy,
      maxUses: args.maxUses,
      currentUses: 0,
      expiresAt: args.expiresAt,
      isActive: true,
      createdAt: Date.now(),
    });
    return codeId;
  },
});

export const deactivate = mutation({
  args: { id: v.id("inviteCodes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});
