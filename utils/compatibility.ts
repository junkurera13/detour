export interface CompatibilityUser {
  interests: string[];
  currentLocation: string;
  latitude?: number;
  longitude?: number;
  futureTrips?: { location: string }[];
  lifestyle: string[];
  pets?: { type: string; name: string }[];
}

const NEARBY_THRESHOLD_KM = 50;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CompatibilityBreakdown {
  route: { score: number; sameCity: boolean; sharedTrips: string[] };
  interests: { score: number; shared: string[]; total: number };
  lifestyle: { score: number; shared: string[]; total: number };
  travellingWith: { score: number; sharedTypes: string[] };
}

export interface CompatibilityResult {
  score: number;
  breakdown: CompatibilityBreakdown;
}

const WEIGHT_ROUTE = 0.35;
const WEIGHT_INTERESTS = 0.35;
const WEIGHT_LIFESTYLE = 0.25;
const WEIGHT_TRAVELLING_WITH = 0.05;
const MIN_SCORE = 30;

function overlapItems(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => setB.has(s.toLowerCase()));
}

export function computeCompatibility(userA: CompatibilityUser, userB: CompatibilityUser): CompatibilityResult {
  // Route overlap (35%) — same city worth 0.7, shared future trips worth up to 0.3
  const citiesA = (userA.futureTrips || []).map((t) => t.location.split(',')[0].trim().toLowerCase());
  const citiesB = (userB.futureTrips || []).map((t) => t.location.split(',')[0].trim().toLowerCase());
  const sharedTripCities = citiesA.filter((c) => citiesB.includes(c));
  const maxCities = Math.max(citiesA.length, citiesB.length);
  const tripRatio = maxCities > 0 ? sharedTripCities.length / maxCities : 0;
  // Use coordinates if available (within 50km = nearby), fall back to city name match
  const sameCity =
    (userA.latitude != null && userA.longitude != null && userB.latitude != null && userB.longitude != null)
      ? haversineKm(userA.latitude, userA.longitude, userB.latitude, userB.longitude) <= NEARBY_THRESHOLD_KM
      : userA.currentLocation.split(',')[0].trim().toLowerCase() ===
        userB.currentLocation.split(',')[0].trim().toLowerCase();
  const routeRatio = Math.min(1, (sameCity ? 0.7 : 0) + tripRatio * 0.3);

  // Shared interests (35%)
  const sharedInterestItems = overlapItems(userA.interests, userB.interests);
  const minInterests = Math.min(userA.interests.length, userB.interests.length);
  const interestRatio = minInterests > 0 ? sharedInterestItems.length / minInterests : 0;

  // Lifestyle match (25%)
  const sharedLifestyleItems = overlapItems(userA.lifestyle, userB.lifestyle);
  const minLifestyle = Math.min(userA.lifestyle.length, userB.lifestyle.length);
  const lifestyleRatio = minLifestyle > 0 ? sharedLifestyleItems.length / minLifestyle : 0;

  // Travelling with (5%) — both have pets = 100%, one has / other doesn't = 0%, neither = neutral
  const petsA = (userA.pets || []);
  const petsB = (userB.pets || []);
  const hasPetsA = petsA.length > 0;
  const hasPetsB = petsB.length > 0;
  const sharedPetTypes = hasPetsA && hasPetsB
    ? [...new Set(petsA.map(p => p.type.toLowerCase()))].filter(t => new Set(petsB.map(p => p.type.toLowerCase())).has(t))
    : [];
  const travellingWithRatio = (!hasPetsA && !hasPetsB) ? 1 : (hasPetsA && hasPetsB) ? 1 : 0;

  const raw =
    routeRatio * WEIGHT_ROUTE +
    interestRatio * WEIGHT_INTERESTS +
    lifestyleRatio * WEIGHT_LIFESTYLE +
    travellingWithRatio * WEIGHT_TRAVELLING_WITH;

  // Scale to 0-100 with a floor of MIN_SCORE
  const scaled = MIN_SCORE + raw * (100 - MIN_SCORE);
  const score = Math.round(Math.min(100, Math.max(0, scaled)));

  return {
    score,
    breakdown: {
      route: {
        score: Math.round(routeRatio * 100),
        sameCity,
        sharedTrips: sharedTripCities,
      },
      interests: {
        score: Math.round(interestRatio * 100),
        shared: sharedInterestItems,
        total: minInterests,
      },
      lifestyle: {
        score: Math.round(lifestyleRatio * 100),
        shared: sharedLifestyleItems,
        total: minLifestyle,
      },
      travellingWith: {
        score: Math.round(travellingWithRatio * 100),
        sharedTypes: sharedPetTypes,
      },
    },
  };
}
