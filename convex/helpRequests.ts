import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedSubscriber } from "./auth";

export const HELP_CATEGORIES = ["repairs", "electrical", "build", "plumbing", "other"] as const;

// Get all open help requests (for feed)
export const listOpen = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);
    const limit = args.limit ?? 50;

    // Fast path: no category filter uses status+created index with bounded reads.
    let limited;
    if (!args.category) {
      limited = await ctx.db
        .query("helpRequests")
        .withIndex("by_status_created", (q) => q.eq("status", "open"))
        .order("desc")
        .take(limit);
    } else {
      // Category filter still needs in-memory status filtering due index shape.
      const byCategory = await ctx.db
        .query("helpRequests")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      limited = byCategory
        .filter((r) => r.status === "open")
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    }

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
    await getAuthenticatedSubscriber(ctx);
    const request = await ctx.db.get(args.id);
    if (!request) return null;

    const author = await ctx.db.get(request.authorId);
    const offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", request._id))
      .filter((q) => q.neq(q.field("status"), "withdrawn"))
      .collect();

    // Find conversation if request is in progress or completed
    let conversationId = null;
    if (request.status === "in_progress" || request.status === "completed") {
      const conversation = await ctx.db
        .query("helpConversations")
        .withIndex("by_request", (q) => q.eq("requestId", args.id))
        .first();
      if (conversation) {
        conversationId = conversation._id;
      }
    }

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
      conversationId,
    };
  },
});

// Get requests created by current user
export const getMyRequests = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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

    // Enrich with offer count, helper info, and conversation ID
    const enriched = await Promise.all(
      requests.map(async (request) => {
        const offers = await ctx.db
          .query("helpOffers")
          .withIndex("by_request", (q) => q.eq("requestId", request._id))
          .filter((q) => q.neq(q.field("status"), "withdrawn"))
          .collect();

        let conversationId = null;
        let helper = null;
        let acceptedPrice = null;

        if (request.status === "in_progress" || request.status === "completed") {
          const conversation = await ctx.db
            .query("helpConversations")
            .withIndex("by_request", (q) => q.eq("requestId", request._id))
            .first();
          if (conversation) {
            conversationId = conversation._id;
          }

          // Get accepted offer and helper info
          if (request.acceptedOfferId) {
            const acceptedOffer = await ctx.db.get(request.acceptedOfferId);
            if (acceptedOffer) {
              acceptedPrice = acceptedOffer.price || null;
              const helperUser = await ctx.db.get(acceptedOffer.offererId);
              if (helperUser) {
                helper = {
                  _id: helperUser._id,
                  name: helperUser.name,
                  photos: helperUser.photos,
                };
              }
            }
          }
        }

        return {
          ...request,
          offerCount: offers.length,
          conversationId,
          helper,
          acceptedPrice,
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
    budget: v.optional(v.number()),
    isUrgent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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
      budget: args.budget,
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
    budget: v.optional(v.number()),
    isUrgent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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
    const user = await getAuthenticatedSubscriber(ctx);

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
      progressStep: "negotiation",
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

    // Create a conversation between requester and offerer
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

// Cancel a help request
export const cancel = mutation({
  args: { id: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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

// Delete a help request (only author, only while open)
export const deleteRequest = mutation({
  args: { id: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    if (request.status !== "open") {
      throw new Error("Can only delete open requests");
    }

    // Delete all offers for this request
    const offers = await ctx.db
      .query("helpOffers")
      .withIndex("by_request", (q) => q.eq("requestId", args.id))
      .collect();

    for (const offer of offers) {
      await ctx.db.delete(offer._id);
    }

    // Delete the request
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Mark request as completed
export const complete = mutation({
  args: { id: v.id("helpRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

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

// Advance the progress step of a help request
export const advanceProgress = mutation({
  args: {
    requestId: v.id("helpRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "in_progress") {
      throw new Error("Request is not in progress");
    }

    const isRequester = request.authorId === user._id;
    const acceptedOffer = request.acceptedOfferId
      ? await ctx.db.get(request.acceptedOfferId)
      : null;
    const isOfferer = acceptedOffer?.offererId === user._id;

    if (!isRequester && !isOfferer) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    const step = request.progressStep || "negotiation";

    if (step === "negotiation" && isOfferer) {
      await ctx.db.patch(args.requestId, {
        progressStep: "working",
        updatedAt: now,
      });
      return { success: true, newStep: "working" };
    }

    if (step === "working" && isRequester) {
      await ctx.db.patch(args.requestId, {
        progressStep: "payment",
        updatedAt: now,
      });
      return { success: true, newStep: "payment" };
    }

    if (step === "payment" && isOfferer) {
      await ctx.db.patch(args.requestId, {
        progressStep: "completed",
        status: "completed",
        updatedAt: now,
      });
      return { success: true, newStep: "completed" };
    }

    throw new Error("You cannot advance this step");
  },
});

// Get personalized "for you" requests matching user's location + builder specialties
export const listForYou = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const specialties = user.builderSpecialties ?? [];
    const location = user.currentLocation?.toLowerCase().trim() ?? "";

    if (specialties.length === 0 && !location) return [];

    // Get all open requests
    const openRequests = await ctx.db
      .query("helpRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter: match location AND matching category, exclude own requests
    const matched = openRequests.filter((r) => {
      if (r.authorId === user._id) return false;

      const reqLocation = (r.location || "").toLowerCase().trim();
      const matchesLocation =
        location !== "" &&
        reqLocation !== "" &&
        (reqLocation.includes(location) || location.includes(reqLocation));

      const matchesCategory =
        specialties.length > 0 && specialties.includes(r.category);

      return matchesLocation && matchesCategory;
    });

    // Sort: urgent first, then newest
    matched.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return b.createdAt - a.createdAt;
    });

    const limited = args.limit ? matched.slice(0, args.limit) : matched;

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

// Get builder profile stats for the current user
export const getBuilderStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);

    // Get all requests by this user
    const myRequests = await ctx.db
      .query("helpRequests")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    // Get all offers by this user
    const myOffers = await ctx.db
      .query("helpOffers")
      .withIndex("by_offerer", (q) => q.eq("offererId", user._id))
      .collect();

    // Count by status
    const openRequests = myRequests.filter((r) => r.status === "open");
    const completedRequests = myRequests.filter((r) => r.status === "completed");
    const inProgressRequests = myRequests.filter((r) => r.status === "in_progress");
    const acceptedOffers = myOffers.filter((o) => o.status === "accepted");

    // Use user-set specialties if available, otherwise derive from activity
    let specialties: string[];
    if (user.builderSpecialties && user.builderSpecialties.length > 0) {
      specialties = user.builderSpecialties;
    } else {
      const offeredRequestIds = myOffers.map((o) => o.requestId);
      const offeredRequests = await Promise.all(
        [...new Set(offeredRequestIds)].map((id) => ctx.db.get(id))
      );
      const offerCategories = offeredRequests
        .filter(Boolean)
        .map((r) => r!.category);
      const requestCategories = myRequests.map((r) => r.category);
      const allCategories = [...offerCategories, ...requestCategories];
      const categoryCounts: Record<string, number> = {};
      for (const cat of allCategories) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      specialties = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);
    }

    return {
      totalRequests: myRequests.length,
      openRequests: openRequests.length,
      inProgressRequests: inProgressRequests.length,
      completedRequests: completedRequests.length,
      totalOffers: myOffers.length,
      acceptedOffers: acceptedOffers.length,
      specialties,
      // Current active requests (open or in progress) for display
      activeRequests: [...openRequests, ...inProgressRequests]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3)
        .map((r) => ({
          _id: r._id,
          title: r.title,
          category: r.category,
          status: r.status,
          isUrgent: r.isUrgent,
        })),
    };
  },
});
