import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const result = [];
    for (const activity of activities) {
      const host = await ctx.db.get(activity.hostId);
      result.push({
        ...activity,
        host: host
          ? { _id: host._id, name: host.name, photo: host.photos[0] || "" }
          : { _id: activity.hostId, name: "Unknown", photo: "" },
      });
    }
    return result;
  },
});

export const getById = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) return null;

    const host = await ctx.db.get(activity.hostId);

    const attendees = [];
    for (const attendeeId of activity.attendeeIds) {
      const user = await ctx.db.get(attendeeId);
      if (user) {
        attendees.push({
          _id: user._id,
          name: user.name,
          photo: user.photos[0] || "",
        });
      }
    }

    return {
      ...activity,
      host: host
        ? { _id: host._id, name: host.name, photo: host.photos[0] || "" }
        : null,
      attendees,
    };
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Events hosted by this user
    const hosted = await ctx.db
      .query("activities")
      .withIndex("by_host", (q) => q.eq("hostId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // All active events (to find ones user is attending)
    const allActive = await ctx.db
      .query("activities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const attending = allActive.filter(
      (a) => a.hostId !== args.userId && a.attendeeIds.includes(args.userId)
    );

    const combined = [...hosted, ...attending];

    const result = [];
    for (const activity of combined) {
      const host = await ctx.db.get(activity.hostId);
      result.push({
        ...activity,
        host: host
          ? { _id: host._id, name: host.name, photo: host.photos[0] || "" }
          : { _id: activity.hostId, name: "Unknown", photo: "" },
      });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    endDate: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const activityId = await ctx.db.insert("activities", {
      hostId: user._id,
      title: args.title,
      description: args.description,
      image: args.image,
      date: args.date,
      time: args.time,
      endDate: args.endDate,
      endTime: args.endTime,
      location: args.location,
      category: args.category || "other",
      tags: args.tags,
      maxAttendees: args.maxAttendees,
      attendeeIds: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return activityId;
  },
});

export const join = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    if (activity.attendeeIds.includes(user._id)) {
      return { alreadyJoined: true };
    }

    if (
      activity.maxAttendees &&
      activity.attendeeIds.length >= activity.maxAttendees
    ) {
      return { full: true };
    }

    await ctx.db.patch(args.activityId, {
      attendeeIds: [...activity.attendeeIds, user._id],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const leave = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    await ctx.db.patch(args.activityId, {
      attendeeIds: activity.attendeeIds.filter((id) => id !== user._id),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
