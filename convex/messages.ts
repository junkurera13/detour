import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedSubscriber } from "./auth";

export const send = mutation({
  args: {
    matchId: v.id("matches"),
    content: v.string(),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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
    const user = await getAuthenticatedSubscriber(ctx);

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

    // Batch-fetch all unique senders
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)));
    const senderMap = new Map(
      senders.filter(Boolean).map((s) => [s!._id, s])
    );

    return messages.map((message) => ({
      ...message,
      sender: senderMap.get(message.senderId) ?? null,
    }));
  },
});

export const markAsRead = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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
    const user = await getAuthenticatedSubscriber(ctx);

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
    const user = await getAuthenticatedSubscriber(ctx);

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

    // Batch-fetch all other users upfront to avoid N+1
    const otherUserIds = [
      ...new Set(
        filteredMatches.map((match) =>
          match.user1Id === user._id ? match.user2Id : match.user1Id
        )
      ),
    ];
    const otherUsers = await Promise.all(
      otherUserIds.map((id) => ctx.db.get(id))
    );
    const otherUserMap = new Map(
      otherUsers.filter(Boolean).map((u) => [u!._id, u])
    );

    // Get conversation preview for each match (messages still need per-match queries for index)
    const previews = await Promise.all(
      filteredMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === user._id ? match.user2Id : match.user1Id;

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
          otherUser: otherUserMap.get(otherUserId) ?? null,
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
    const user = await getAuthenticatedSubscriber(ctx);

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
