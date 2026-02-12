import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

export const send = mutation({
  args: {
    activityId: v.id("activities"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }
    if (args.content.length > 5000) {
      throw new Error("Message too long");
    }

    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    // Verify user is host or attendee
    const isHost = activity.hostId === user._id;
    const isAttendee = activity.attendeeIds.includes(user._id);
    if (!isHost && !isAttendee) {
      throw new Error("Not a participant in this activity");
    }

    const messageId = await ctx.db.insert("activityMessages", {
      activityId: args.activityId,
      senderId: user._id,
      content: args.content,
      messageType: "text",
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const getByActivity = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedSubscriber(ctx);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) return [];

    // Verify user is host or attendee
    const isHost = activity.hostId === user._id;
    const isAttendee = activity.attendeeIds.includes(user._id);
    if (!isHost && !isAttendee) return [];

    const messages = await ctx.db
      .query("activityMessages")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .order("asc")
      .collect();

    // Batch-fetch senders
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)));
    const senderMap = new Map(
      senders.filter(Boolean).map((s) => [s!._id, s]),
    );

    return messages.map((message) => ({
      ...message,
      sender: senderMap.has(message.senderId)
        ? {
            _id: senderMap.get(message.senderId)!._id,
            name: senderMap.get(message.senderId)!.name,
            photo: (senderMap.get(message.senderId)!.photos || [])[0] || "",
          }
        : null,
    }));
  },
});
