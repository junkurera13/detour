import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const NEARBY_THRESHOLD_KM = 50;
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

// Fuzzy city match: split on comma, take first part, lowercase, compare
function citiesOverlap(loc1: string, loc2: string): boolean {
  const parts1 = loc1.toLowerCase().split(",").map((p) => p.trim());
  const parts2 = loc2.toLowerCase().split(",").map((p) => p.trim());
  return parts1.some((p1) =>
    parts2.some((p2) => p1.includes(p2) || p2.includes(p1))
  );
}

interface TripWithCoords {
  location: string;
  latitude?: number;
  longitude?: number;
}

// Check if two trips overlap using coordinates (preferred) or city-name matching (fallback)
function tripsOverlap(trip1: TripWithCoords, trip2: TripWithCoords): boolean {
  // Use coordinate-based matching when both have coordinates
  if (
    trip1.latitude != null && trip1.longitude != null &&
    trip2.latitude != null && trip2.longitude != null
  ) {
    return haversineKm(trip1.latitude, trip1.longitude, trip2.latitude, trip2.longitude) <= NEARBY_THRESHOLD_KM;
  }
  // Fall back to city-name matching
  return citiesOverlap(trip1.location, trip2.location);
}

// Find the first overlapping city between trip lists
function findOverlappingCity(
  trips1: TripWithCoords[],
  trips2: TripWithCoords[]
): string | null {
  for (const t1 of trips1) {
    for (const t2 of trips2) {
      if (tripsOverlap(t1, t2)) {
        return t1.location.split(",")[0].trim();
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

      // Build other user's location list (trips + current location)
      const otherTrips: TripWithCoords[] = [
        ...(other.futureTrips || []).map((t) => ({
          location: t.location,
          latitude: t.latitude,
          longitude: t.longitude,
        })),
        {
          location: other.currentLocation,
          latitude: other.latitude,
          longitude: other.longitude,
        },
      ];

      const overlappingCity = findOverlappingCity(userTrips, otherTrips);

      if (overlappingCity) {
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
