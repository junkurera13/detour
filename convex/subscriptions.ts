import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const DETOUR_PLUS_ENTITLEMENT = "detour_plus";

function getRevenueCatSecretKey() {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) {
    throw new Error("REVENUECAT_SECRET_API_KEY is not configured");
  }
  return key;
}

function getRevenueCatProjectId() {
  const id = process.env.REVENUECAT_PROJECT_ID;
  if (!id) {
    throw new Error("REVENUECAT_PROJECT_ID is not configured");
  }
  return id;
}

// V2 API response types
type RevenueCatV2EntitlementItem = {
  entitlement_identifier: string;
  expires_date?: string | null;
};

type RevenueCatV2EntitlementsResponse = {
  items: RevenueCatV2EntitlementItem[];
};

async function fetchDetourPlusStatus(appUserId: string) {
  const secretKey = getRevenueCatSecretKey();
  const projectId = getRevenueCatProjectId();
  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${projectId}/customers/${encodeURIComponent(appUserId)}/active_entitlements`,
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

  const json = (await response.json()) as RevenueCatV2EntitlementsResponse;
  const hasDetourPlus = json.items.some(
    (item) => item.entitlement_identifier === DETOUR_PLUS_ENTITLEMENT
  );
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
