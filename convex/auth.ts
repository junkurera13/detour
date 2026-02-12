import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the currently authenticated user from the Convex auth context.
 * Throws if not authenticated or user not found in database.
 * Use this in all mutations/queries that need to know the current user.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
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

  return user;
}

/**
 * Get an authenticated user with approved status and an active Detour+ entitlement.
 * Use for app features that must remain subscription-gated on the server.
 */
export async function getAuthenticatedSubscriber(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (user.userStatus !== "approved") {
    throw new Error("Account is not approved");
  }

  if (!user.hasDetourPlus) {
    throw new Error("Active Detour+ subscription required");
  }

  return user;
}

/**
 * Try to get the currently authenticated user, returning null instead of throwing.
 * Useful for queries that should return empty results for unauthenticated users.
 */
export async function tryGetAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .first();
}
