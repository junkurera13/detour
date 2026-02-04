import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const HELP_CATEGORIES = ["repairs", "electrical", "build", "plumbing", "other"] as const;

// Get all open help requests (for feed)
export const listOpen = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let requestsQuery = ctx.db
      .query("helpRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"));

    const requests = await requestsQuery.collect();

    // Filter by category if specified
    const filtered = args.category
      ? requests.filter((r) => r.category === args.category)
      : requests;

    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    const limited = args.limit ? filtered.slice(0, args.limit) : filtered;

    // Enrich with author info and offer count
    const enriched = await Promise.all(
      limited.map(async (request) => {
        const author = await ctx.db.get(request.authorId);
        const offers = await ctx.db
          .query("helpOffers")
          .withIndex("by_request", (q) => q.eq("requestId", request._id))
          .filter((q) => q.neq(q.field("status"), "withdrawn"))
          .collect();

        return {
          ...request,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                photos: author.photos,
                currentLocation: author.currentLocation,
              }
            : null,
          offerCount: offers.length,
        };
      })
    );

    return enriched;
  },
});

// Get a single help request by ID
export const getById = query({
  args: { id: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) return null;

    const author = await ctx.db.get(request.authorId);
    const offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", request._id))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .collect();

    return {
      ...request,
      author: author
        ? {
            _id: author._id,
            name: author.name,
            photos: author.photos,
            currentLocation: author.currentLocation,
          }
        : null,
      offerCount: offers.length,
    };
  },
});

// Get requests created by current user
export const getMyRequests = query({
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

    let requests = await ctx.db
      .query("helpRequests")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    // Filter by status if specified
    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    // Sort by createdAt descending
    requests.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with offer count
    const enriched = await Promise.all(
      requests.map(async (request) => {
        const offers = await ctx.db
          .query("helpOffers")
          .withIndex("by_request", (q) => q.eq("requestId", request._id))
          .filter((q) => q.neq(q.field("status"), "withdrawn"))
          .collect();

        return {
          ...request,
          offerCount: offers.length,
        };
      })
    );

    return enriched;
  },
});

// Create a new help request
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    location: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    isUrgent: v.boolean(),
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

    // Validate category
    if (!HELP_CATEGORIES.includes(args.category as typeof HELP_CATEGORIES[number])) {
      throw new Error("Invalid category");
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("helpRequests", {
      authorId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      location: args.location,
      photos: args.photos,
      isUrgent: args.isUrgent,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, requestId };
  },
});

// Update a help request (only author, only while open)
export const update = mutation({
  args: {
    id: v.id("helpRequests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    isUrgent: v.optional(v.boolean()),
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

    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    if (request.status !== "open") {
      throw new Error("Can only update open requests");
    }

    // Validate category if provided
    if (args.category && !HELP_CATEGORIES.includes(args.category as typeof HELP_CATEGORIES[number])) {
      throw new Error("Invalid category");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Accept an offer
export const acceptOffer = mutation({
  args: {
    requestId: v.id("helpRequests"),
    offerId: v.id("helpOffers"),
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

    if (request.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    if (request.status !== "open") {
      throw new Error("Request is not open");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.requestId !== args.requestId) {
      throw new Error("Offer does not belong to this request");
    }

    if (offer.status !== "pending") {
      throw new Error("Offer is not pending");
    }

    const now = Date.now();

    // Update request
    await ctx.db.patch(args.requestId, {
      status: "in_progress",
      acceptedOfferId: args.offerId,
      acceptedAt: now,
      updatedAt: now,
    });

    // Accept the selected offer
    await ctx.db.patch(args.offerId, {
      status: "accepted",
      updatedAt: now,
    });

    // Reject all other pending offers
    const otherOffers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .filter((q) => q.neq(q.field("_id"), args.offerId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const otherOffer of otherOffers) {
      await ctx.db.patch(otherOffer._id, {
        status: "rejected",
        updatedAt: now,
      });

      // Notify rejected offerers
      await ctx.scheduler.runAfter(0, internal.notifications.sendOfferRejectedNotification, {
        recipientId: otherOffer.offererId,
        requestTitle: request.title,
        requestId: args.requestId,
      });
    }

    // Notify accepted offerer
    await ctx.scheduler.runAfter(0, internal.notifications.sendOfferAcceptedNotification, {
      recipientId: offer.offererId,
      requestTitle: request.title,
      requestId: args.requestId,
    });

    return { success: true };
  },
});

// Cancel a help request
export const cancel = mutation({
  args: { id: v.id("helpRequests") },
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

    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    if (request.status === "completed" || request.status === "cancelled") {
      throw new Error("Request is already closed");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: now,
    });

    // Notify all pending offerers
    const pendingOffers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", args.id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const offer of pendingOffers) {
      await ctx.db.patch(offer._id, {
        status: "rejected",
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(0, internal.notifications.sendRequestCancelledNotification, {
        recipientId: offer.offererId,
        requestTitle: request.title,
      });
    }

    return { success: true };
  },
});

// Mark request as completed
export const complete = mutation({
  args: { id: v.id("helpRequests") },
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

    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    if (request.status !== "in_progress") {
      throw new Error("Request must be in progress to complete");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
