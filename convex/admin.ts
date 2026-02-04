import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// List all pending users for admin review
export const listPendingUsers = query({
  args: {},
  handler: async (ctx) => {
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
  },
  handler: async (ctx, args) => {
    // Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || args.adminPassword !== adminPassword) {
      throw new Error("Unauthorized");
    }

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

    // Send push notification if user has a push token
    if (user.expoPushToken) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
        pushToken: user.expoPushToken,
        title: "You're in! 🎉",
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
  },
  handler: async (ctx, args) => {
    // Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || args.adminPassword !== adminPassword) {
      throw new Error("Unauthorized");
    }

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
export const verifyPassword = query({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return { valid: false, error: "Admin password not configured" };
    }
    return { valid: args.password === adminPassword };
  },
});
