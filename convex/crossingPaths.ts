import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Fuzzy city match: split on comma, take first part, lowercase, compare
function citiesOverlap(loc1: string, loc2: string): boolean {
  const parts1 = loc1.toLowerCase().split(",").map((p) => p.trim());
  const parts2 = loc2.toLowerCase().split(",").map((p) => p.trim());
  return parts1.some((p1) =>
    parts2.some((p2) => p1.includes(p2) || p2.includes(p1))
  );
}

// Find the first overlapping city name between two location lists
function findOverlappingCity(
  locs1: string[],
  locs2: string[]
): string | null {
  for (const loc1 of locs1) {
    for (const loc2 of locs2) {
      if (citiesOverlap(loc1, loc2)) {
        return loc1.split(",")[0].trim();
      }
    }
  }
  return null;
}

// Detect crossing paths and notify users when future trips overlap
export const detectAndNotify = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.userStatus !== "approved") return;

    const userTrips = user.futureTrips || [];
    if (userTrips.length === 0) return;

    const userTripLocations = userTrips.map((t) => t.location);

    // Fetch approved users (capped to avoid scanning too many)
    const candidates = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("userStatus", "approved"))
      .take(200);

    let notificationCount = 0;
    const MAX_NOTIFICATIONS = 5;

    for (const other of candidates) {
      if (other._id === args.userId) continue;
      if (notificationCount >= MAX_NOTIFICATIONS) break;

      // Check if other user's futureTrips overlap with this user's futureTrips
      const otherTripLocations = (other.futureTrips || []).map(
        (t) => t.location
      );

      // Also check other user's currentLocation against this user's trips
      const otherLocations = [
        ...otherTripLocations,
        other.currentLocation,
      ];

      const overlappingCity = findOverlappingCity(
        userTripLocations,
        otherLocations
      );

      if (overlappingCity) {
        // Notify the other user about the crossing path
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendCrossingPathsNotification,
          {
            recipientId: other._id,
            otherUserName: user.name,
            city: overlappingCity,
          }
        );
        notificationCount++;
      }
    }
  },
});
