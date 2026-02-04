import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all conversations for current user (as requester or offerer)
export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return [];

    // Get conversations where user is requester
    const asRequester = await ctx.db
      .query("helpConversations")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .collect();

    // Get conversations where user is offerer
    const asOfferer = await ctx.db
      .query("helpConversations")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .collect();

    // Combine and dedupe
    const allConversations = [...asRequester, ...asOfferer];
    const uniqueConversations = allConversations.filter(
      (conv, index, self) =>
        index === self.findIndex((c) => c._id === conv._id)
    );

    // Enrich with request info, other user info, and last message
    const enriched = await Promise.all(
      uniqueConversations.map(async (conv) => {
        const request = await ctx.db.get(conv.requestId);
        const otherUserId =
          conv.requesterId === user._id ? conv.offererId : conv.requesterId;
        const otherUser = await ctx.db.get(otherUserId);
        const offer = await ctx.db.get(conv.offerId);

        // Get last message
        const messages = await ctx.db
          .query("helpMessages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv._id)
          )
          .collect();
        messages.sort((a, b) => b.createdAt - a.createdAt);
        const lastMessage = messages[0] || null;

        // Count unread messages
        const unreadCount = messages.filter(
          (m) => m.senderId !== user._id && !m.readAt
        ).length;

        return {
          ...conv,
          request: request
            ? {
                _id: request._id,
                title: request.title,
                category: request.category,
                status: request.status,
              }
            : null,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                photos: otherUser.photos,
              }
            : null,
          offer: offer
            ? {
                _id: offer._id,
                price: offer.price,
              }
            : null,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
          isRequester: conv.requesterId === user._id,
        };
      })
    );

    // Sort by last message time (or created time if no messages)
    enriched.sort(
      (a, b) =>
        (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );

    return enriched;
  },
});

// Get a single conversation by ID
export const getConversation = query({
  args: { id: v.id("helpConversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return null;

    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;

    // Check user is part of conversation
    if (
      conversation.requesterId !== user._id &&
      conversation.offererId !== user._id
    ) {
      return null;
    }

    const request = await ctx.db.get(conversation.requestId);
    const otherUserId =
      conversation.requesterId === user._id
        ? conversation.offererId
        : conversation.requesterId;
    const otherUser = await ctx.db.get(otherUserId);
    const offer = await ctx.db.get(conversation.offerId);

    return {
      ...conversation,
      request: request
        ? {
            _id: request._id,
            title: request.title,
            description: request.description,
            category: request.category,
            status: request.status,
          }
        : null,
      otherUser: otherUser
        ? {
            _id: otherUser._id,
            name: otherUser.name,
            photos: otherUser.photos,
          }
        : null,
      offer: offer
        ? {
            _id: offer._id,
            price: offer.price,
            message: offer.message,
          }
        : null,
      isRequester: conversation.requesterId === user._id,
      currentUserId: user._id,
    };
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("helpConversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    // Check user is part of conversation
    if (
      conversation.requesterId !== user._id &&
      conversation.offererId !== user._id
    ) {
      return [];
    }

    const messages = await ctx.db
      .query("helpMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Sort by createdAt ascending (oldest first for chat view)
    messages.sort((a, b) => a.createdAt - b.createdAt);

    // Apply limit from the end if specified
    const limited = args.limit ? messages.slice(-args.limit) : messages;

    return limited.map((msg) => ({
      ...msg,
      isMine: msg.senderId === user._id,
    }));
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("helpConversations"),
    content: v.string(),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check user is part of conversation
    if (
      conversation.requesterId !== user._id &&
      conversation.offererId !== user._id
    ) {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    // Create message
    const messageId = await ctx.db.insert("helpMessages", {
      conversationId: args.conversationId,
      senderId: user._id,
      content: args.content,
      messageType: args.messageType || "text",
      createdAt: now,
    });

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
    });

    return { success: true, messageId };
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    conversationId: v.id("helpConversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check user is part of conversation
    if (
      conversation.requesterId !== user._id &&
      conversation.offererId !== user._id
    ) {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    // Mark all unread messages from other user as read
    const unreadMessages = await ctx.db
      .query("helpMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("senderId"), user._id),
          q.eq(q.field("readAt"), undefined)
        )
      )
      .collect();

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { readAt: now });
    }

    return { success: true, count: unreadMessages.length };
  },
});

// Create a conversation (called when offer is accepted)
export const createConversation = mutation({
  args: {
    requestId: v.id("helpRequests"),
    offerId: v.id("helpOffers"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    // Check if conversation already exists
    const existing = await ctx.db
      .query("helpConversations")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .first();

    if (existing) {
      return { success: true, conversationId: existing._id };
    }

    const now = Date.now();

    const conversationId = await ctx.db.insert("helpConversations", {
      requestId: args.requestId,
      offerId: args.offerId,
      requesterId: request.authorId,
      offererId: offer.offererId,
      createdAt: now,
    });

    return { success: true, conversationId };
  },
});
