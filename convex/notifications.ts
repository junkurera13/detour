import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Expo Push API endpoint
const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

interface PushResult {
  success: boolean;
  error?: string;
  ticketId?: string;
}

// Helper function to send push notification via Expo Push API
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushResult> {
  // Skip if no push token or invalid format
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) {
    console.log("Invalid or missing push token:", pushToken);
    return { success: false, error: "Invalid push token" };
  }

  const message: PushMessage = {
    to: pushToken,
    title,
    body,
    data,
    sound: "default",
  };

  try {
    const response = await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.[0]?.status === "error") {
      console.error("Push notification error:", result.data[0].message);
      return { success: false, error: result.data[0].message };
    }

    console.log("Push notification sent:", result.data?.[0]?.id);
    return { success: true, ticketId: result.data?.[0]?.id };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error: String(error) };
  }
}

// Internal action to send push notification (for external use)
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, args): Promise<PushResult> => {
    return sendExpoPushNotification(args.pushToken, args.title, args.body, args.data);
  },
});

// Send notification when a new match is created
export const sendMatchNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    matcherName: v.string(),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    // Get recipient's push token
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      console.log("No push token for recipient:", args.recipientId);
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "It's a match! 🎉",
      `You and ${args.matcherName} liked each other!`,
      {
        type: "match",
        matchId: args.matchId,
      }
    );
  },
});

// Send notification when a new message is received
export const sendMessageNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    senderName: v.string(),
    messagePreview: v.string(),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    // Get recipient's push token
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      console.log("No push token for recipient:", args.recipientId);
      return { success: false, error: "No push token" };
    }

    // Truncate message preview
    const preview =
      args.messagePreview.length > 50
        ? args.messagePreview.substring(0, 47) + "..."
        : args.messagePreview;

    return sendExpoPushNotification(
      recipient.expoPushToken,
      args.senderName,
      preview,
      {
        type: "message",
        matchId: args.matchId,
      }
    );
  },
});

// Send notification when a new offer is received on a help request
export const sendNewOfferNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    offererName: v.string(),
    requestTitle: v.string(),
    requestId: v.id("helpRequests"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "New offer received",
      `${args.offererName} made an offer on "${args.requestTitle}"`,
      {
        type: "help_offer",
        requestId: args.requestId,
      }
    );
  },
});

// Send notification when an offer is accepted
export const sendOfferAcceptedNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    requestTitle: v.string(),
    requestId: v.id("helpRequests"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "Offer accepted! 🎉",
      `Your offer for "${args.requestTitle}" was accepted!`,
      {
        type: "help_offer_accepted",
        requestId: args.requestId,
      }
    );
  },
});

// Send notification when an offer is rejected (another offer was selected)
export const sendOfferRejectedNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    requestTitle: v.string(),
    requestId: v.id("helpRequests"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "Offer not selected",
      `Another offer was selected for "${args.requestTitle}"`,
      {
        type: "help_offer_rejected",
        requestId: args.requestId,
      }
    );
  },
});

// Send notification when a help request is cancelled
export const sendRequestCancelledNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    requestTitle: v.string(),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "Request cancelled",
      `The help request "${args.requestTitle}" was cancelled`,
      {
        type: "help_request_cancelled",
      }
    );
  },
});

// Send notification when an offer is updated
export const sendOfferUpdatedNotification = internalAction({
  args: {
    recipientId: v.id("users"),
    offererName: v.string(),
    requestTitle: v.string(),
    requestId: v.id("helpRequests"),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const recipient = await ctx.runQuery(internal.users.getByIdInternal, {
      id: args.recipientId,
    });

    if (!recipient?.expoPushToken) {
      return { success: false, error: "No push token" };
    }

    return sendExpoPushNotification(
      recipient.expoPushToken,
      "Offer updated",
      `${args.offererName} updated their offer on "${args.requestTitle}"`,
      {
        type: "help_offer_updated",
        requestId: args.requestId,
      }
    );
  },
});
