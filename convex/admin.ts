import { v } from "convex/values";
import { MutationCtx, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const MAX_ATTEMPTS_PER_WINDOW = 10;
const WINDOW_MS = 60_000;
const BLOCK_MS = 10 * 60_000;

function normalizeRequestKey(requestKey: string) {
  return requestKey.trim().slice(0, 256) || "unknown";
}

function secureEquals(input: string, expected: string) {
  const maxLen = Math.max(input.length, expected.length);
  let mismatch = input.length ^ expected.length;
  for (let i = 0; i < maxLen; i++) {
    const a = input.charCodeAt(i) || 0;
    const b = expected.charCodeAt(i) || 0;
    mismatch |= a ^ b;
  }
  return mismatch === 0;
}

async function getAttemptByKey(
  ctx: MutationCtx,
  requestKey: string
) {
  return await ctx.db
    .query("adminAuthAttempts")
    .withIndex("by_key", (q) => q.eq("requestKey", requestKey))
    .first();
}

async function ensureNotBlocked(
  ctx: MutationCtx,
  requestKey: string
) {
  const attempt = await getAttemptByKey(ctx, requestKey);
  const now = Date.now();
  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    throw new Error("Too many admin auth attempts. Try again later.");
  }
}

async function recordFailedAttempt(
  ctx: MutationCtx,
  requestKey: string
) {
  const now = Date.now();
  const attempt = await getAttemptByKey(ctx, requestKey);

  if (!attempt) {
    await ctx.db.insert("adminAuthAttempts", {
      requestKey,
      attempts: 1,
      firstAttemptAt: now,
      updatedAt: now,
    });
    return;
  }

  const isWindowExpired = now - attempt.firstAttemptAt > WINDOW_MS;
  const attempts = isWindowExpired ? 1 : attempt.attempts + 1;
  const blockedUntil =
    attempts >= MAX_ATTEMPTS_PER_WINDOW ? now + BLOCK_MS : undefined;

  await ctx.db.patch(attempt._id, {
    attempts,
    firstAttemptAt: isWindowExpired ? now : attempt.firstAttemptAt,
    blockedUntil,
    updatedAt: now,
  });
}

async function clearAttempts(
  ctx: MutationCtx,
  requestKey: string
) {
  const attempt = await getAttemptByKey(ctx, requestKey);
  if (attempt) {
    await ctx.db.delete(attempt._id);
  }
}

async function assertAdminPassword(
  ctx: MutationCtx,
  password: string,
  requestKeyRaw: string
) {
  const requestKey = normalizeRequestKey(requestKeyRaw);
  await ensureNotBlocked(ctx, requestKey);

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const isValid = adminPassword.length > 0 && secureEquals(password, adminPassword);

  if (!isValid) {
    await recordFailedAttempt(ctx, requestKey);
    throw new Error("Unauthorized");
  }

  await clearAttempts(ctx, requestKey);
}

// Delete a help request by ID (admin)
export const deleteHelpRequest = mutation({
  args: {
    id: v.id("helpRequests"),
    adminPassword: v.string(),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPassword(ctx, args.adminPassword, args.requestKey);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// List all pending users for admin review
export const listPendingUsers = mutation({
  args: {
    adminPassword: v.string(),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPassword(ctx, args.adminPassword, args.requestKey);

    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("userStatus", "pending"))
      .collect();

    // Sort by signup date (oldest first)
    const sorted = pendingUsers.sort((a, b) => a.createdAt - b.createdAt);

    return sorted.map((user) => ({
      id: user._id,
      name: user.name,
      username: user.username,
      photo: user.photos[0] || null,
      photos: user.photos,
      location: user.currentLocation,
      futureTrip: user.futureTrip || null,
      lifestyle: user.lifestyle,
      interests: user.interests,
      lookingFor: user.lookingFor,
      gender: user.gender,
      birthday: user.birthday,
      instagram: user.instagram || null,
      timeNomadic: user.timeNomadic,
      signupDate: user.createdAt,
      joinPath: user.joinPath,
    }));
  },
});

// Approve a pending user
export const approveUser = mutation({
  args: {
    userId: v.id("users"),
    adminPassword: v.string(),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPassword(ctx, args.adminPassword, args.requestKey);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.userStatus !== "pending") {
      throw new Error("User is not pending");
    }

    // Update user status to approved
    await ctx.db.patch(args.userId, {
      userStatus: "approved",
      updatedAt: Date.now(),
    });

    // Generate 3 invite codes for the newly approved user
    await ctx.scheduler.runAfter(0, internal.inviteCodes.generateCodesForUser, {
      userId: args.userId,
    });

    // Send push notification if user has a push token
    if (user.expoPushToken) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
        pushToken: user.expoPushToken,
        title: "You're in!",
        body: "Your application has been approved. Welcome to Detour!",
        data: { type: "approval" },
      });
    }

    return { success: true, userName: user.name };
  },
});

// Reject a pending user
export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    adminPassword: v.string(),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPassword(ctx, args.adminPassword, args.requestKey);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.userStatus !== "pending") {
      throw new Error("User is not pending");
    }

    // Update user status to rejected
    await ctx.db.patch(args.userId, {
      userStatus: "rejected",
      updatedAt: Date.now(),
    });

    return { success: true, userName: user.name };
  },
});

// Verify admin password
export const verifyPassword = mutation({
  args: {
    password: v.string(),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    const requestKey = normalizeRequestKey(args.requestKey);
    try {
      await ensureNotBlocked(ctx, requestKey);
    } catch {
      return { valid: false };
    }

    const adminPassword = process.env.ADMIN_PASSWORD ?? "";
    const valid = adminPassword.length > 0 && secureEquals(args.password, adminPassword);

    if (valid) {
      await clearAttempts(ctx, requestKey);
    } else {
      await recordFailedAttempt(ctx, requestKey);
    }

    return { valid };
  },
});
