import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const DETOUR_PLUS_ENTITLEMENT = "detour_plus";

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date?: string | null;
      }
    >;
  };
};

function getRevenueCatSecretKey() {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) {
    throw new Error("REVENUECAT_SECRET_API_KEY is not configured");
  }
  return key;
}

function isEntitlementActive(
  entitlements: Record<string, { expires_date?: string | null }> | undefined
) {
  const entitlement = entitlements?.[DETOUR_PLUS_ENTITLEMENT];
  if (!entitlement) return false;

  if (!entitlement.expires_date) return true;
  const expiresAt = Date.parse(entitlement.expires_date);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt > Date.now();
}

async function fetchDetourPlusStatus(appUserId: string) {
  const secretKey = getRevenueCatSecretKey();
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RevenueCat lookup failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as RevenueCatSubscriberResponse;
  const hasDetourPlus = isEntitlementActive(json.subscriber?.entitlements);
  return { hasDetourPlus };
}

export const syncMyEntitlement = action({
  args: {},
  handler: async (ctx): Promise<{ hasDetourPlus: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { hasDetourPlus } = await fetchDetourPlusStatus(identity.subject);
    await ctx.runMutation(internal.subscriptionMutations.setEntitlementForToken, {
      tokenIdentifier: identity.subject,
      hasDetourPlus,
      source: "client_sync",
    });

    return { hasDetourPlus };
  },
});

export const syncEntitlementByToken = internalAction({
  args: { tokenIdentifier: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{
    updated: boolean;
  }> => {
    const { hasDetourPlus } = await fetchDetourPlusStatus(args.tokenIdentifier);
    const result = await ctx.runMutation(internal.subscriptionMutations.setEntitlementForToken, {
      tokenIdentifier: args.tokenIdentifier,
      hasDetourPlus,
      source: "webhook_sync",
    });
    return { updated: result.updated };
  },
});
