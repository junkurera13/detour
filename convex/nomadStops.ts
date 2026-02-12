import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

const VALID_CATEGORIES = [
  "campsite", "coworking", "beach", "rest-area", "hostel",
  "parking", "water", "dump-station", "other",
];

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    if (args.name.length > 100) {
      throw new Error("Name too long (max 100 characters)");
    }
    if (!VALID_CATEGORIES.includes(args.category)) {
      throw new Error("Invalid category");
    }

    const now = Date.now();
    const stopId = await ctx.db.insert("nomadStops", {
      creatorId: user._id,
      name: args.name,
      description: args.description,
      category: args.category,
      latitude: args.latitude,
      longitude: args.longitude,
      address: args.address,
      amenities: args.amenities,
      photos: args.photos,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return stopId;
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    let stops;
    if (args.category) {
      stops = await ctx.db
        .query("nomadStops")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(args.limit ?? 50);
    } else {
      stops = await ctx.db
        .query("nomadStops")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(args.limit ?? 50);
    }

    // Batch-fetch creators
    const creatorIds = [...new Set(stops.map((s) => s.creatorId))];
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)));
    const creatorMap = new Map(
      creators.filter(Boolean).map((u) => [u!._id, u!])
    );

    return stops.map((stop) => {
      const creator = creatorMap.get(stop.creatorId);
      return {
        ...stop,
        creatorName: creator?.name ?? "Unknown",
        creatorPhoto: creator?.photos?.[0],
      };
    });
  },
});

export const getById = query({
  args: { id: v.id("nomadStops") },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    const stop = await ctx.db.get(args.id);
    if (!stop || stop.status !== "active") return null;

    const creator = await ctx.db.get(stop.creatorId);

    // Check if current user saved this stop
    const user = await getAuthenticatedSubscriber(ctx);
    const saved = await ctx.db
      .query("stopSaves")
      .withIndex("by_pair", (q) => q.eq("userId", user._id).eq("stopId", args.id))
      .first();

    return {
      ...stop,
      creatorName: creator?.name ?? "Unknown",
      creatorPhoto: creator?.photos?.[0],
      isSaved: !!saved,
    };
  },
});

export const getNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedSubscriber(ctx);

    const radius = args.radiusKm ?? 50;
    const maxResults = args.limit ?? 30;

    const stops = await ctx.db
      .query("nomadStops")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500); // Fetch a larger pool for distance filtering

    const filtered = stops
      .map((stop) => ({
        ...stop,
        distance: haversineKm(args.latitude, args.longitude, stop.latitude, stop.longitude),
      }))
      .filter((s) => s.distance <= radius)
      .filter((s) => !args.category || s.category === args.category)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    // Batch-fetch creators
    const creatorIds = [...new Set(filtered.map((s) => s.creatorId))];
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)));
    const creatorMap = new Map(
      creators.filter(Boolean).map((u) => [u!._id, u!])
    );

    return filtered.map((stop) => {
      const creator = creatorMap.get(stop.creatorId);
      return {
        ...stop,
        creatorName: creator?.name ?? "Unknown",
        creatorPhoto: creator?.photos?.[0],
      };
    });
  },
});

export const save = mutation({
  args: { stopId: v.id("nomadStops") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const existing = await ctx.db
      .query("stopSaves")
      .withIndex("by_pair", (q) => q.eq("userId", user._id).eq("stopId", args.stopId))
      .first();

    if (existing) return { success: true, saved: true };

    await ctx.db.insert("stopSaves", {
      userId: user._id,
      stopId: args.stopId,
      createdAt: Date.now(),
    });

    return { success: true, saved: true };
  },
});

export const unsave = mutation({
  args: { stopId: v.id("nomadStops") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const existing = await ctx.db
      .query("stopSaves")
      .withIndex("by_pair", (q) => q.eq("userId", user._id).eq("stopId", args.stopId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true, saved: false };
  },
});

export const getSavedByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const saves = await ctx.db
      .query("stopSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const stops = await Promise.all(
      saves.map((save) => ctx.db.get(save.stopId))
    );

    return stops
      .filter((s): s is NonNullable<typeof s> => s != null && s.status === "active")
      .map((stop) => ({
        ...stop,
        isSaved: true,
      }));
  },
});
