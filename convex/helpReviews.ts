import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

// Submit a review for a completed help request (only the requester can review)
export const create = mutation({
  args: {
    requestId: v.id("helpRequests"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    if (args.comment && args.comment.length > 200) {
      throw new Error("Comment must be 200 characters or less");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "completed") {
      throw new Error("Can only review completed requests");
    }

    if (request.authorId !== user._id) {
      throw new Error("Only the requester can leave a review");
    }

    // Check for existing review on this request
    const existing = await ctx.db
      .query("helpReviews")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .first();

    if (existing) {
      throw new Error("You have already reviewed this request");
    }

    // Get the helper (offerer) from the accepted offer
    if (!request.acceptedOfferId) {
      throw new Error("No accepted offer found for this request");
    }

    const offer = await ctx.db.get(request.acceptedOfferId);
    if (!offer) {
      throw new Error("Accepted offer not found");
    }

    await ctx.db.insert("helpReviews", {
      reviewerId: user._id,
      reviewedId: offer.offererId,
      requestId: args.requestId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all reviews for a user (for builder profile)
export const getForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    const reviews = await ctx.db
      .query("helpReviews")
      .withIndex("by_reviewed", (q) => q.eq("reviewedId", args.userId))
      .collect();

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    // Batch-fetch reviewers
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId))];
    const reviewers = await Promise.all(reviewerIds.map((id) => ctx.db.get(id)));
    const reviewerMap = new Map(
      reviewers.filter(Boolean).map((u) => [u!._id, u])
    );

    return reviews.map((review) => {
      const reviewer = reviewerMap.get(review.reviewerId);
      return {
        ...review,
        reviewer: reviewer
          ? {
              _id: reviewer._id,
              name: reviewer.name,
              photos: reviewer.photos,
            }
          : null,
      };
    });
  },
});

// Get average rating and count for a user
export const getAverageRating = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    const reviews = await ctx.db
      .query("helpReviews")
      .withIndex("by_reviewed", (q) => q.eq("reviewedId", args.userId))
      .collect();

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Math.round((total / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});

// Check if a review exists for a specific request
export const getForRequest = query({
  args: { requestId: v.id("helpRequests") },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    return await ctx.db
      .query("helpReviews")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .first();
  },
});
