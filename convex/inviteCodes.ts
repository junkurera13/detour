import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedUser } from "./auth";

const INVITE_CODES_PER_USER = 3;
const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "DTOUR";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return `${cleanPrefix}-${suffix}`;
}

export const generateCodesForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.userStatus !== "approved") return;

    const existingCodes = await ctx.db
      .query("inviteCodes")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect();

    const toGenerate = INVITE_CODES_PER_USER - existingCodes.length;
    if (toGenerate <= 0) return;

    for (let i = 0; i < toGenerate; i++) {
      let code = generateCode(user.username || user.name);
      // Ensure uniqueness
      let existing = await ctx.db
        .query("inviteCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      while (existing) {
        code = generateCode(user.username || user.name);
        existing = await ctx.db
          .query("inviteCodes")
          .withIndex("by_code", (q) => q.eq("code", code))
          .first();
      }

      await ctx.db.insert("inviteCodes", {
        code,
        createdBy: args.userId,
        maxUses: 1,
        currentUses: 0,
        isActive: true,
        createdAt: Date.now(),
      });
    }
  },
});

// Backfill: generate codes for all approved users missing them
export const backfillCodes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const approved = users.filter((u) => u.userStatus === "approved");
    let generated = 0;
    for (const user of approved) {
      const existing = await ctx.db
        .query("inviteCodes")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
      const toGenerate = INVITE_CODES_PER_USER - existing.length;
      if (toGenerate <= 0) continue;
      for (let i = 0; i < toGenerate; i++) {
        let code = generateCode(user.username || user.name);
        let dup = await ctx.db.query("inviteCodes").withIndex("by_code", (q) => q.eq("code", code)).first();
        while (dup) {
          code = generateCode(user.username || user.name);
          dup = await ctx.db.query("inviteCodes").withIndex("by_code", (q) => q.eq("code", code)).first();
        }
        await ctx.db.insert("inviteCodes", {
          code,
          createdBy: user._id,
          maxUses: 1,
          currentUses: 0,
          isActive: true,
          createdAt: Date.now(),
        });
        generated++;
      }
    }
    return { generated };
  },
});

export const getMyInviteCodes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();
    if (!user) return [];

    const codes = await ctx.db
      .query("inviteCodes")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    return await Promise.all(
      codes.map(async (code) => {
        let usedByUser = null;
        if (code.usedBy) {
          const usedByDoc = await ctx.db.get(code.usedBy);
          if (usedByDoc) {
            usedByUser = {
              _id: usedByDoc._id,
              name: usedByDoc.name,
              username: usedByDoc.username,
              photos: usedByDoc.photos,
            };
          }
        }
        return {
          _id: code._id,
          code: code.code,
          isActive: code.isActive,
          currentUses: code.currentUses,
          maxUses: code.maxUses,
          createdAt: code.createdAt,
          usedByUser,
        };
      })
    );
  },
});

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
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const normalizedCode = args.code.toUpperCase().trim();

    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();

    if (!inviteCode) {
      return { success: false, error: "invalid invite code" };
    }

    if (!inviteCode.isActive || inviteCode.currentUses >= inviteCode.maxUses) {
      return { success: false, error: "this code is no longer valid" };
    }

    // Atomically increment and deactivate if at max capacity.
    // Convex mutations are serialized per-document, so read-then-write
    // within a single mutation is safe from concurrent races.
    const newUses = inviteCode.currentUses + 1;
    await ctx.db.patch(inviteCode._id, {
      currentUses: newUses,
      usedBy: user._id,
      // Deactivate once max uses reached to prevent any further attempts
      ...(newUses >= inviteCode.maxUses ? { isActive: false } : {}),
    });

    // Auto-approve user who used valid invite code
    await ctx.db.patch(user._id, {
      userStatus: "approved",
      updatedAt: Date.now(),
    });

    // Generate 3 invite codes for the newly approved user (chain reaction)
    await ctx.scheduler.runAfter(0, internal.inviteCodes.generateCodesForUser, {
      userId: user._id,
    });

    return { success: true };
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    maxUses: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const codeId = await ctx.db.insert("inviteCodes", {
      code: args.code.toUpperCase().trim(),
      createdBy: user._id,
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
    const user = await getAuthenticatedUser(ctx);
    const inviteCode = await ctx.db.get(args.id);
    if (!inviteCode) {
      throw new Error("Invite code not found");
    }
    if (inviteCode.createdBy !== user._id) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { isActive: false });
  },
});
