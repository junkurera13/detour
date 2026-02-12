import { query } from "./_generated/server";
import { getAuthenticatedSubscriber } from "./auth";

const NEARBY_KM = 50;
const DEFAULT_STAY_DAYS = 14; // Assumed stay duration when endDate is missing

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tripsNearbySpatially(
  tripA: { location: string; latitude?: number; longitude?: number },
  tripB: { location: string; latitude?: number; longitude?: number },
): boolean {
  if (tripA.latitude != null && tripA.longitude != null && tripB.latitude != null && tripB.longitude != null) {
    return haversineKm(tripA.latitude, tripA.longitude, tripB.latitude, tripB.longitude) <= NEARBY_KM;
  }
  const cityA = tripA.location.split(",")[0].trim().toLowerCase();
  const cityB = tripB.location.split(",")[0].trim().toLowerCase();
  return cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA);
}

function computeDateOverlap(
  startA: string, endA: string, startB: string, endB: string,
): { overlap: boolean; overlapStart: string; overlapEnd: string; days: number } {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (sA > eB || sB > eA) {
    return { overlap: false, overlapStart: "", overlapEnd: "", days: 0 };
  }

  const overlapStart = new Date(Math.max(sA, sB)).toISOString().slice(0, 10);
  const overlapEnd = new Date(Math.min(eA, eB)).toISOString().slice(0, 10);
  const days = Math.ceil((Math.min(eA, eB) - Math.max(sA, sB)) / 86400000);

  return { overlap: true, overlapStart, overlapEnd, days };
}

// Infer endDate for trips that only have startDate.
// Uses the next trip's startDate as an implicit end, or adds DEFAULT_STAY_DAYS for the last stop.
interface RawTrip {
  location: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  stopType?: string;
}

interface ResolvedTrip {
  location: string;
  startDate: string;
  endDate: string;
  latitude?: number;
  longitude?: number;
  stopType?: string;
}

function resolveTrips(trips: RawTrip[]): ResolvedTrip[] {
  const resolved: ResolvedTrip[] = [];

  for (let i = 0; i < trips.length; i++) {
    const t = trips[i];
    const start = t.startDate || t.date;
    if (!start) continue; // skip trips with no date at all

    let end = t.endDate;
    if (!end) {
      // Use next trip's startDate as implicit end
      const nextTrip = trips[i + 1];
      const nextStart = nextTrip?.startDate || nextTrip?.date;
      if (nextStart) {
        end = nextStart;
      } else {
        // Last stop — assume DEFAULT_STAY_DAYS
        const d = new Date(start);
        d.setDate(d.getDate() + DEFAULT_STAY_DAYS);
        end = d.toISOString().slice(0, 10);
      }
    }

    resolved.push({
      location: t.location,
      startDate: start,
      endDate: end,
      latitude: t.latitude,
      longitude: t.longitude,
      stopType: t.stopType,
    });
  }

  return resolved;
}



export const getCrewsForUser = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedSubscriber(ctx);
    const myTrips = resolveTrips(me.futureTrips || []);
    if (myTrips.length === 0) return [];

    const candidates = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("userStatus", "approved"))
      .take(200);

    const others = candidates.filter((u) => u._id !== me._id);

    const crews: {
      crewId: string;
      destination: string;
      destinationShort: string;
      destinationLatitude?: number;
      destinationLongitude?: number;
      overlapStart: string;
      overlapEnd: string;
      overlapDays: number;
      memberCount: number;
      members: {
        userId: typeof me._id;
        name: string;
        photo: string;
        birthday: string;
        interests: string[];
        sharedInterestCount: number;
        tripStart: string;
        tripEnd: string;
        overlapStart: string;
        overlapEnd: string;
        overlapDays: number;
        currentLocation: string;
        latitude?: number;
        longitude?: number;
        futureTrips: { location: string; latitude: number; longitude: number }[];
      }[];
    }[] = [];

    for (const myTrip of myTrips) {
      const members: typeof crews[number]["members"] = [];
      const seenUserIds = new Set<string>();

      for (const other of others) {
        if (seenUserIds.has(other._id)) continue;
        const otherTrips = resolveTrips(other.futureTrips || []);

        for (const otherTrip of otherTrips) {
          if (!tripsNearbySpatially(myTrip, otherTrip)) continue;

          const temporal = computeDateOverlap(
            myTrip.startDate, myTrip.endDate,
            otherTrip.startDate, otherTrip.endDate,
          );
          if (!temporal.overlap || temporal.days < 2) continue;

          const sharedInterests = (me.interests || []).filter(
            (i) => (other.interests || []).includes(i),
          );

          members.push({
            userId: other._id,
            name: other.name,
            photo: (other.photos || [])[0] || "",
            birthday: other.birthday,
            interests: other.interests || [],
            sharedInterestCount: sharedInterests.length,
            tripStart: otherTrip.startDate,
            tripEnd: otherTrip.endDate,
            overlapStart: temporal.overlapStart,
            overlapEnd: temporal.overlapEnd,
            overlapDays: temporal.days,
            currentLocation: other.currentLocation,
            latitude: other.latitude,
            longitude: other.longitude,
            futureTrips: (other.futureTrips || [])
              .filter((t) => t.latitude != null && t.longitude != null)
              .map((t) => ({
                location: t.location,
                latitude: t.latitude!,
                longitude: t.longitude!,
              })),
          });
          seenUserIds.add(other._id);
          break; // Only count this user once per crew
        }
      }

      // Need at least 1 other person to form a cohort
      if (members.length < 1) continue;

      members.sort((a, b) => b.overlapDays - a.overlapDays);

      const destination = myTrip.location;
      const destinationShort = destination.split(",")[0].trim();
      const monthKey = myTrip.startDate.slice(0, 7);
      const crewId = `crew-${destinationShort.toLowerCase().replace(/\s+/g, "-")}-${monthKey}`;

      // Skip duplicate crews (same destination cluster)
      if (crews.some((c) => c.crewId === crewId)) continue;

      crews.push({
        crewId,
        destination,
        destinationShort,
        destinationLatitude: myTrip.latitude,
        destinationLongitude: myTrip.longitude,
        overlapStart: members.reduce(
          (latest, m) => (m.overlapStart > latest ? m.overlapStart : latest),
          myTrip.startDate,
        ),
        overlapEnd: members.reduce(
          (earliest, m) => (m.overlapEnd < earliest ? m.overlapEnd : earliest),
          myTrip.endDate,
        ),
        overlapDays: members.reduce((min, m) => Math.min(min, m.overlapDays), Infinity),
        memberCount: members.length + 1, // +1 for current user
        members: members.slice(0, 8),
      });
    }

    crews.sort((a, b) => b.memberCount - a.memberCount || b.overlapDays - a.overlapDays);
    return crews;
  },
});
