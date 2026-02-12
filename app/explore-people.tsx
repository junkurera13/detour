import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { StopMap } from '@/components/map/StopMap';

// Lifestyle ID to label mapping
const lifestyleLabels: Record<string, string> = {
  'van-life': 'van lifer',
  'backpacker': 'backpacker',
  'digital-nomad': 'digital nomad',
  'rv-life': 'rv lifer',
  'boat-life': 'boat lifer',
  'house-sitting': 'house sitter',
  'slow-travel': 'slow traveler',
  'perpetual-traveler': 'perpetual traveler',
  'seasonal-worker': 'seasonal worker',
  'expat': 'expat',
  'hostel-hopper': 'hostel hopper',
  'workaway': 'workaway volunteer',
  'yoga-retreat': 'yoga retreater',
  'wellness': 'wellness nomad',
  'entrepreneur': 'entrepreneur',
  'adventure': 'adventurer',
  'photographer': 'photographer',
  'language-learner': 'language learner',
};

// Plural forms for section titles
const lifestylePlurals: Record<string, string> = {
  'van-life': 'van lifers',
  'backpacker': 'backpackers',
  'digital-nomad': 'digital nomads',
  'rv-life': 'rv lifers',
  'boat-life': 'boat lifers',
  'house-sitting': 'house sitters',
  'slow-travel': 'slow travelers',
  'perpetual-traveler': 'perpetual travelers',
  'seasonal-worker': 'seasonal workers',
  'expat': 'expats',
  'hostel-hopper': 'hostel hoppers',
  'workaway': 'workaway volunteers',
  'yoga-retreat': 'yoga retreaters',
  'wellness': 'wellness nomads',
  'entrepreneur': 'entrepreneurs',
  'adventure': 'adventurers',
  'photographer': 'photographers',
  'language-learner': 'language learners',
};

// Interest ID to label mapping
const interestLabels: Record<string, string> = {
  'grab-coffee': 'coffee',
  'try-street-food': 'street food',
  'cook-together': 'cooking',
  'go-hiking': 'hiking',
  'go-surfing': 'surfing',
  'go-diving': 'diving',
  'go-camping': 'camping',
  'go-climbing': 'climbing',
  'go-cycling': 'cycling',
  'beach-days': 'beach',
  'go-dancing': 'dancing',
  'see-live-music': 'live music',
  'hit-the-gym': 'gym',
  'do-yoga': 'yoga',
  'go-running': 'running',
  'visit-museums': 'museums',
  'take-photos': 'photography',
  'find-street-art': 'street art',
  'cowork-at-cafes': 'coworking',
  'brainstorm-ideas': 'brainstorming',
  'make-content': 'content',
  'build-stuff': 'building',
  'watch-sunsets': 'sunsets',
  'read-together': 'reading',
  'play-board-games': 'board games',
  'meditate': 'meditation',
};

function getAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type ExploreUser = Pick<
  Doc<"users">,
  | "_id"
  | "name"
  | "birthday"
  | "photos"
  | "interests"
  | "currentLocation"
  | "lifestyle"
  | "futureTrips"
  | "futureTrip"
  | "gender"
>;

// Get all future trip locations from a user (handles both legacy and new format)
function getUserFutureTripLocations(user: ExploreUser): string[] {
  const locations: string[] = [];
  if (user.futureTrips) {
    for (const trip of user.futureTrips) {
      locations.push(trip.location);
    }
  }
  if (user.futureTrip) {
    locations.push(user.futureTrip);
  }
  return locations;
}

// Get arrival label from a user's real futureTrips data for a target location
function getArrivalLabel(user: ExploreUser, targetLocation: string): string {
  const trips = user.futureTrips || [];
  const matchingTrip = trips.find(trip => locationsOverlap(trip.location, targetLocation));
  if (matchingTrip?.startDate) {
    const date = new Date(matchingTrip.startDate);
    return `arrives ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return 'dates TBD';
}

// Get the first shared trip city between two users' futureTrips
function getSharedTripCity(userTrips: { location: string }[], otherUser: ExploreUser): string | null {
  const otherTrips = getUserFutureTripLocations(otherUser);
  for (const trip of userTrips) {
    const city = trip.location.split(',')[0].trim().toLowerCase();
    for (const otherLoc of otherTrips) {
      const otherCity = otherLoc.split(',')[0].trim().toLowerCase();
      if (city.includes(otherCity) || otherCity.includes(city)) {
        return trip.location.split(',')[0].trim();
      }
    }
  }
  return null;
}

// Get companion subtitle with real trip date if available
function getCompanionSubtitle(user: ExploreUser, sharedCity: string): string {
  const trips = user.futureTrips || [];
  const matchingTrip = trips.find(trip => locationsOverlap(trip.location, sharedCity));
  if (matchingTrip?.startDate) {
    const date = new Date(matchingTrip.startDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return user.currentLocation.split(',')[0];
}

// Check if two locations overlap (fuzzy match on city/country parts)
function locationsOverlap(loc1: string, loc2: string): boolean {
  const parts1 = loc1.toLowerCase().split(',').map(p => p.trim());
  const parts2 = loc2.toLowerCase().split(',').map(p => p.trim());
  return parts1.some(p1 => parts2.some(p2 => p1.includes(p2) || p2.includes(p1)));
}

// Check if two interest strings are related (fuzzy match)
function interestsMatch(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return true;
  return al.includes(bl) || bl.includes(al);
}

// Count shared interests between user arrays (fuzzy)
function sharedInterestCount(a: string[], b: string[]): number {
  return a.filter(ai => b.some(bi => interestsMatch(ai, bi))).length;
}

interface PersonCardProps {
  user: ExploreUser;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
}

function PersonCard({ user, subtitle, onPress, badge, badgeColor = '#fd6b03' }: PersonCardProps) {
  const age = getAge(user.birthday);
  return (
    <TouchableOpacity
      className="mr-3"
      style={{ width: 130 }}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="rounded-2xl overflow-hidden bg-gray-50">
        <Image
          source={{ uri: user.photos[0] }}
          style={{ width: 130, height: 150 }}
          resizeMode="cover"
        />
        <View className="p-2.5">
          <Text
            className="text-sm text-black"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            numberOfLines={1}
          >
            {user.name}, {age}
          </Text>
          <Text
            className="text-xs text-gray-500 mt-0.5"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
          {badge && (
            <Text
              className="text-xs mt-1.5"
              style={{ fontFamily: 'InstrumentSans_500Medium', color: badgeColor }}
              numberOfLines={1}
            >
              {badge}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExplorePeopleScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { convexUser } = useAuthenticatedUser();

  const allUsers = useQuery(
    api.users.getAllApprovedUsers,
    convexUser?._id ? { currentUserId: convexUser._id, limit: 300 } : "skip"
  );

  const userLocation = convexUser?.currentLocation || data.currentLocation || '';
  const userLifestyle = convexUser?.lifestyle || data.lifestyle || [];
  const userInterests = useMemo(() => convexUser?.interests || data.interests || [], [convexUser?.interests, data.interests]);
  const futureTrips = convexUser?.futureTrips ?? data.futureTrips;
  const legacyFutureTrip = convexUser?.futureTrip;
  const firstTripLocation = futureTrips?.[0]?.location || legacyFutureTrip || '';

  const isLoading = allUsers === undefined;

  // Filter by dating preference (nearby is dating only)
  const datingPref = useMemo(() => convexUser?.datingPreference || data.datingPreference || [], [convexUser?.datingPreference, data.datingPreference]);
  const users = useMemo(() => {
    const all = allUsers || [];
    if (datingPref.length === 0 || datingPref.includes('everyone')) return all;
    const prefToGender: Record<string, string> = { women: 'woman', men: 'man' };
    return all.filter((u) => {
      const g = u.gender.toLowerCase();
      return datingPref.some((p) => g === (prefToGender[p] || p));
    });
  }, [allUsers, datingPref]);

  // 1. Heading your way — people whose futureTrips match the user's current location
  const headingYourWay = useMemo(() => {
    if (!userLocation || users.length === 0) return [];
    return users.filter(u => {
      const futureLocs = getUserFutureTripLocations(u);
      return futureLocs.some(loc => locationsOverlap(loc, userLocation));
    });
  }, [userLocation, users]);

  // 2. Travel companions — people whose futureTrips overlap with YOUR futureTrips
  const userFutureTrips = useMemo(() => futureTrips || [], [futureTrips]);
  const headingYourWayIds = useMemo(() => new Set(headingYourWay.map(u => u._id)), [headingYourWay]);
  const travelCompanions = useMemo(() => {
    if (userFutureTrips.length === 0 || users.length === 0) return [];
    const userTripCities = userFutureTrips.map(t => t.location.split(',')[0].trim().toLowerCase());
    return users
      .filter(u => !headingYourWayIds.has(u._id))
      .map(u => {
        const otherTrips = getUserFutureTripLocations(u);
        const otherCities = otherTrips.map(loc => loc.split(',')[0].trim().toLowerCase());
        const shared = userTripCities.filter(city =>
          otherCities.some(oc => city.includes(oc) || oc.includes(city))
        );
        return { user: u, sharedCount: shared.length };
      })
      .filter(x => x.sharedCount > 0)
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .map(x => x.user);
  }, [userFutureTrips, users, headingYourWayIds]);

  // 3. Recent crossings — people in the same current location (renamed from 2)
  const recentCrossings = useMemo(() => {
    if (!userLocation || users.length === 0) return [];
    return users.filter(u => locationsOverlap(u.currentLocation, userLocation));
  }, [userLocation, users]);

  // 4. Other X — people with the same primary lifestyle type
  const primaryLifestyle = userLifestyle[0] || '';
  const sameLifestyle = useMemo(() => {
    if (!primaryLifestyle || users.length === 0) return [];
    return users.filter(u => u.lifestyle.includes(primaryLifestyle));
  }, [primaryLifestyle, users]);

  // 5. Same interests — people who share interests, sorted by overlap count
  const sameInterests = useMemo(() => {
    if (userInterests.length === 0 || users.length === 0) return [];
    return users
      .map(u => ({ user: u, shared: sharedInterestCount(u.interests, userInterests) }))
      .filter(x => x.shared > 0)
      .sort((a, b) => b.shared - a.shared)
      .map(x => x.user);
  }, [userInterests, users]);

  const navigateToUser = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  // Get shared interests as display text
  const getSharedLabel = (user: ExploreUser): string => {
    const shared = user.interests.filter(ai => userInterests.some(bi => interestsMatch(ai, bi)));
    if (shared.length === 0) return '';
    const labels = shared.slice(0, 2).map(i => interestLabels[i] || i);
    if (shared.length > 2) return `${labels.join(', ')} +${shared.length - 2}`;
    return labels.join(', ');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
        >
          explore
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
          <Text
            className="text-gray-400 mt-4"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            loading people...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Map Preview — tap to open full stops screen */}
          <TouchableOpacity
            onPress={() => router.push('/stops')}
            activeOpacity={0.9}
            className="mx-6 mt-4 mb-6"
          >
            <View style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <StopMap
                routeStops={
                  (convexUser?.futureTrips || [])
                    .filter((t): t is typeof t & { latitude: number; longitude: number } =>
                      t.latitude != null && t.longitude != null
                    )
                    .map(t => ({ latitude: t.latitude, longitude: t.longitude, location: t.location }))
                }
                center={
                  convexUser?.latitude && convexUser?.longitude
                    ? { latitude: convexUser.latitude, longitude: convexUser.longitude }
                    : undefined
                }
                zoom={6}
                style={{ height: 180, borderRadius: 16 }}
                interactive={false}
                showRoute
              />
              {/* Overlay label */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="map" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#fff' }}>
                    nomad stops
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                    discover & share spots
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 1. Heading Your Way */}
          {headingYourWay.length > 0 && (
            <View className="mb-8 pt-4">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="airplane" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  heading your way
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {headingYourWay.map(user => (
                  <PersonCard
                    key={user._id}
                    user={user}
                    subtitle={getArrivalLabel(user, userLocation)}
                    onPress={() => navigateToUser(user._id)}
                    badge={user.currentLocation.split(',')[0]}
                    badgeColor="#3B82F6"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* If no heading your way but user has a future trip, show who's already there */}
          {headingYourWay.length === 0 && firstTripLocation && (
            <View className="mb-8 pt-4">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="airplane" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  heading your way
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {users
                  .filter(u =>
                    locationsOverlap(u.currentLocation, firstTripLocation) ||
                    getUserFutureTripLocations(u).some(l => locationsOverlap(l, firstTripLocation))
                  )
                  .slice(0, 10)
                  .map(user => (
                    <PersonCard
                      key={user._id}
                      user={user}
                      subtitle={getArrivalLabel(user, firstTripLocation)}
                      onPress={() => navigateToUser(user._id)}
                      badge={user.currentLocation.split(',')[0]}
                      badgeColor="#3B82F6"
                    />
                  ))}
              </ScrollView>
            </View>
          )}

          {/* 2. Travel Companions */}
          {travelCompanions.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="compass" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  travel companions
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {travelCompanions.map(user => {
                  const sharedCity = getSharedTripCity(userFutureTrips, user);
                  return (
                    <PersonCard
                      key={user._id}
                      user={user}
                      subtitle={sharedCity ? getCompanionSubtitle(user, sharedCity) : user.currentLocation.split(',')[0]}
                      onPress={() => navigateToUser(user._id)}
                      badge={sharedCity ? `heading to ${sharedCity}` : undefined}
                      badgeColor="#0D9488"
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 3. Recent Crossings */}
          {recentCrossings.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="swap-horizontal" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  recent crossings
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {recentCrossings.map(user => (
                  <PersonCard
                    key={user._id}
                    user={user}
                    subtitle={user.currentLocation.split(',')[0]}
                    onPress={() => navigateToUser(user._id)}
                    badge={lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                    badgeColor="#8B5CF6"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 4. Other X (same lifestyle type) */}
          {sameLifestyle.length > 0 && primaryLifestyle && (
            <View className="mb-8">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="people" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  other {lifestylePlurals[primaryLifestyle] || primaryLifestyle + 's'}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {sameLifestyle.map(user => (
                  <PersonCard
                    key={user._id}
                    user={user}
                    subtitle={user.currentLocation.split(',')[0]}
                    onPress={() => navigateToUser(user._id)}
                    badge={lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                    badgeColor="#fd6b03"

                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 5. Same Interests */}
          {sameInterests.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center px-6 mb-4">
                <Ionicons name="sparkles" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  same interests
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {sameInterests.map(user => (
                  <PersonCard
                    key={user._id}
                    user={user}
                    subtitle={user.currentLocation.split(',')[0]}
                    onPress={() => navigateToUser(user._id)}
                    badge={getSharedLabel(user)}
                    badgeColor="#059669"

                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Empty state if nothing to show */}
          {headingYourWay.length === 0 && !firstTripLocation && recentCrossings.length === 0 && sameLifestyle.length === 0 && sameInterests.length === 0 && (
            <View className="items-center pt-20 px-6">
              <Ionicons name="compass-outline" size={48} color="#E5E7EB" />
              <Text
                className="text-gray-400 mt-4 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                complete your profile to discover people with similar interests and travel plans
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
