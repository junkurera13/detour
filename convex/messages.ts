import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const send = mutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      matchId: args.matchId,
      senderId: args.senderId,
      content: args.content,
      messageType: args.messageType ?? "text",
      createdAt: Date.now(),
    });

    // Send push notification to recipient
    const match = await ctx.db.get(args.matchId);
    if (match) {
      const recipientId =
        match.user1Id === args.senderId ? match.user2Id : match.user1Id;

      const sender = await ctx.db.get(args.senderId);
      if (sender) {
        await ctx.scheduler.runAfter(0, internal.notifications.sendMessageNotification, {
          recipientId,
          senderName: sender.name,
          messagePreview: args.content,
          matchId: args.matchId,
        });
      }
    }

    return messageId;
  },
});

export const getByMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) => q.neq(q.field("senderId"), args.userId))
      .filter((q) => q.eq(q.field("readAt"), undefined))
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
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .order("desc")
      .first();
    return messages;
  },
});

export const getConversationPreviews = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get blocked users (both directions)
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.userId))
      .collect();
    const blockedMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked", (q) => q.eq("blockedId", args.userId))
      .collect();

    const blockedUserIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    // Get all matches for this user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const allMatches = [...matchesAsUser1, ...matchesAsUser2];

    // Filter out matches with blocked users
    const filteredMatches = allMatches.filter((match) => {
      const otherUserId = match.user1Id === args.userId ? match.user2Id : match.user1Id;
      return !blockedUserIds.has(otherUserId);
    });

    // Get conversation preview for each match
    const previews = await Promise.all(
      filteredMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === args.userId ? match.user2Id : match.user1Id;
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
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .filter((q) => q.neq(q.field("senderId"), args.userId))
          .filter((q) => q.eq(q.field("readAt"), undefined))
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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all matches for this user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
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
        .withIndex("by_match", (q) => q.eq("matchId", matchId))
        .filter((q) => q.neq(q.field("senderId"), args.userId))
        .filter((q) => q.eq(q.field("readAt"), undefined))
        .collect();
      totalUnread += unreadMessages.length;
    }

    return totalUnread;
  },
});
