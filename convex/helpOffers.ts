import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Get offers for a request (only visible to request author)
export const getByRequest = query({
  args: { requestId: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return [];

    const request = await ctx.db.get(args.requestId);
    if (!request) return [];

    // Only request author can see offers
    if (request.authorId !== user._id) return [];

    const offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .collect();

    // Sort by createdAt ascending (oldest first)
    offers.sort((a, b) => a.createdAt - b.createdAt);

    // Enrich with offerer info
    const enriched = await Promise.all(
      offers.map(async (offer) => {
        const offerer = await ctx.db.get(offer.offererId);
        return {
          ...offer,
          offerer: offerer
            ? {
                _id: offerer._id,
                name: offerer.name,
                photos: offerer.photos,
                currentLocation: offerer.currentLocation,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// Get offers made by current user
export const getMyOffers = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return [];

    let offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .collect();

    // Filter by status if specified
    if (args.status) {
      offers = offers.filter((o) => o.status === args.status);
    }

    // Sort by createdAt descending (newest first)
    offers.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with request info
    const enriched = await Promise.all(
      offers.map(async (offer) => {
        const request = await ctx.db.get(offer.requestId);
        return {
          ...offer,
          request: request
            ? {
                _id: request._id,
                title: request.title,
                category: request.category,
                status: request.status,
                isUrgent: request.isUrgent,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// Check if current user has offered on a request
export const hasUserOffered = query({
  args: { requestId: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return false;

    const offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .filter((q) => q.eq(q.field("requestId"), args.requestId))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .collect();

    return offers.length > 0;
  },
});

// Get user's offer for a specific request
export const getUserOfferForRequest = query({
  args: { requestId: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) return null;

    const offer = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .filter((q) => q.eq(q.field("requestId"), args.requestId))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .first();

    return offer;
  },
});

// Create a new offer
export const create = mutation({
  args: {
    requestId: v.id("helpRequests"),
    price: v.number(), // in cents
    message: v.string(),
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

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "open") {
      throw new Error("Request is not open for offers");
    }

    // Can't offer on your own request
    if (request.authorId === user._id) {
      throw new Error("Cannot offer on your own request");
    }

    // Check if user already has an active offer on this request
    const existingOffer = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .filter((q) => q.eq(q.field("requestId"), args.requestId))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .first();

    if (existingOffer) {
      throw new Error("You already have an offer on this request");
    }

    // Validate price
    if (args.price < 0) {
      throw new Error("Price must be positive");
    }

    const now = Date.now();
    const offerId = await ctx.db.insert("helpOffers", {
      requestId: args.requestId,
      offererId: user._id,
      price: args.price,
      message: args.message,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Notify request author
    await ctx.scheduler.runAfter(0, internal.notifications.sendNewOfferNotification, {
      recipientId: request.authorId,
      offererName: user.name,
      requestTitle: request.title,
      requestId: args.requestId,
    });

    return { success: true, offerId };
  },
});

// Update an offer (only offerer, only while pending)
export const update = mutation({
  args: {
    id: v.id("helpOffers"),
    price: v.optional(v.number()),
    message: v.optional(v.string()),
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

    const offer = await ctx.db.get(args.id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.offererId !== user._id) {
      throw new Error("Not authorized");
    }

    if (offer.status !== "pending") {
      throw new Error("Can only update pending offers");
    }

    // Validate price if provided
    if (args.price !== undefined && args.price < 0) {
      throw new Error("Price must be positive");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    // Notify request author of updated offer
    const request = await ctx.db.get(offer.requestId);
    if (request) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendOfferUpdatedNotification, {
        recipientId: request.authorId,
        offererName: user.name,
        requestTitle: request.title,
        requestId: offer.requestId,
      });
    }

    return { success: true };
  },
});

// Withdraw an offer
export const withdraw = mutation({
  args: { id: v.id("helpOffers") },
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

    const offer = await ctx.db.get(args.id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.offererId !== user._id) {
      throw new Error("Not authorized");
    }

    if (offer.status !== "pending") {
      throw new Error("Can only withdraw pending offers");
    }

    await ctx.db.patch(args.id, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
