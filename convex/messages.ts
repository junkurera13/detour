import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
