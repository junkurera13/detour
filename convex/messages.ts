import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedUser } from "./auth";

export const send = mutation({
  args: {
    matchId: v.id("matches"),
    content: v.string(),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Validate content
    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }
    if (args.content.length > 5000) {
      throw new Error("Message too long");
    }

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized");
    }

    const messageId = await ctx.db.insert("messages", {
      matchId: args.matchId,
      senderId: user._id,
      content: args.content,
      messageType: args.messageType ?? "text",
      createdAt: Date.now(),
    });

    // Send push notification to recipient
    const recipientId =
      match.user1Id === user._id ? match.user2Id : match.user1Id;

    await ctx.scheduler.runAfter(0, internal.notifications.sendMessageNotification, {
      recipientId,
      senderName: user.name,
      messagePreview: args.content,
      matchId: args.matchId,
    });

    return messageId;
  },
});

export const getByMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) return [];
    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    // Get sender info for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
        };
      })
    );

    return messagesWithSenders;
  },
});

export const markAsRead = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) return;
    if (match.user1Id !== user._id && match.user2Id !== user._id) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match_read", (q) =>
        q.eq("matchId", args.matchId).eq("readAt", undefined)
      )
      .filter((q) => q.neq(q.field("senderId"), user._id))
      .collect();

    const now = Date.now();
    await Promise.all(
      messages.map((message) =>
        ctx.db.patch(message._id, { readAt: now })
      )
    );
  },
});

export const getLastMessage = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    if (match.user1Id !== user._id && match.user2Id !== user._id) return null;

    const message = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .first();
    return message;
  },
});

export const getConversationPreviews = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get blocked users (both directions)
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", user._id))
      .collect();
    const blockedMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked", (q) => q.eq("blockedId", user._id))
      .collect();

    const blockedUserIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    // Get all matches for this user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const allMatches = [...matchesAsUser1, ...matchesAsUser2];

    // Filter out matches with blocked users
    const filteredMatches = allMatches
      .filter((match) => {
      const otherUserId = match.user1Id === user._id ? match.user2Id : match.user1Id;
      return !blockedUserIds.has(otherUserId);
      })
      // Hard cap to keep preview query predictable at higher user scale.
      .sort((a, b) => (b.matchedAt ?? b.createdAt) - (a.matchedAt ?? a.createdAt))
      .slice(0, 100);

    // Get conversation preview for each match
    const previews = await Promise.all(
      filteredMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === user._id ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherUserId);

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .order("desc")
          .first();

        // Count unread messages
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_match_read", (q) =>
            q.eq("matchId", match._id).eq("readAt", undefined)
          )
          .filter((q) => q.neq(q.field("senderId"), user._id))
          .collect();

        return {
          matchId: match._id,
          otherUser,
          lastMessage,
          unreadCount: unreadMessages.length,
          matchedAt: match.matchedAt,
        };
      })
    );

    // Sort by last message time (most recent first)
    return previews.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.matchedAt || 0;
      const bTime = b.lastMessage?.createdAt || b.matchedAt || 0;
      return bTime - aTime;
    });
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get all matches for this user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const allMatchIds = [
      ...matchesAsUser1.map((m) => m._id),
      ...matchesAsUser2.map((m) => m._id),
    ];

    let totalUnread = 0;
    for (const matchId of allMatchIds) {
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_match_read", (q) =>
          q.eq("matchId", matchId).eq("readAt", undefined)
        )
        .filter((q) => q.neq(q.field("senderId"), user._id))
        .collect();
      totalUnread += unreadMessages.length;
    }

    return totalUnread;
  },
});
