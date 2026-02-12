import { View, Text, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

// Try to load Mapbox for convergence map
let Mapbox: typeof import('@rnmapbox/maps').default | null = null;
let mapboxAvailable = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Mapbox = require('@rnmapbox/maps').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require('@/lib/env');
  Mapbox!.setAccessToken(env.mapboxToken);
  mapboxAvailable = true;
} catch {
  // Native module not available
}

const ROUTE_COLORS = ['#fd6b03', '#3B82F6', '#0D9488', '#8B5CF6', '#EF4444', '#F59E0B'];

const interestLabels: Record<string, string> = {
  'grab-coffee': 'coffee', 'try-street-food': 'street food', 'cook-together': 'cooking',
  'go-hiking': 'hiking', 'go-surfing': 'surfing', 'go-diving': 'diving',
  'go-camping': 'camping', 'go-climbing': 'climbing', 'go-cycling': 'cycling',
  'beach-days': 'beach', 'go-dancing': 'dancing', 'see-live-music': 'live music',
  'hit-the-gym': 'gym', 'do-yoga': 'yoga', 'go-running': 'running',
  'visit-museums': 'museums', 'take-photos': 'photography', 'find-street-art': 'street art',
  'cowork-at-cafes': 'coworking', 'brainstorm-ideas': 'brainstorming',
  'make-content': 'content', 'build-stuff': 'building', 'watch-sunsets': 'sunsets',
  'read-together': 'reading', 'play-board-games': 'board games', 'meditate': 'meditation',
};

function getAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()} - ${e.getDate()}`;
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}`;
}

export default function CrewDetailScreen() {
  const router = useRouter();
  const { crewId } = useLocalSearchParams<{ crewId: string }>();
  const { convexUser } = useAuthenticatedUser();
  const crews = useQuery(api.crews.getCrewsForUser, convexUser?._id ? {} : "skip");
  const crew = crews?.find(c => c.crewId === crewId);

  if (!crews) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', color: '#9CA3AF' }}>loading...</Text>
      </SafeAreaView>
    );
  }

  if (!crew) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', color: '#9CA3AF' }}>crew not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text style={{ fontFamily: 'InstrumentSans_500Medium', color: '#fd6b03' }}>go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const userInterests = convexUser?.interests || [];

  // Build map data for convergence map
  const allMapPoints: { latitude: number; longitude: number }[] = [];
  if (crew.destinationLatitude && crew.destinationLongitude) {
    allMapPoints.push({ latitude: crew.destinationLatitude, longitude: crew.destinationLongitude });
  }
  crew.members.forEach(m => {
    if (m.latitude && m.longitude) allMapPoints.push({ latitude: m.latitude, longitude: m.longitude });
    m.futureTrips.forEach(t => allMapPoints.push({ latitude: t.latitude, longitude: t.longitude }));
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: '#000' }}>
          route mesh
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Convergence Map */}
        <ConvergenceMap
          crew={crew}
          allPoints={allMapPoints}
          currentUserLocation={
            convexUser?.latitude && convexUser?.longitude
              ? { latitude: convexUser.latitude, longitude: convexUser.longitude }
              : undefined
          }
        />

        {/* Crew Info */}
        <View className="px-6 pt-5 pb-3">
          <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: '#000' }}>
            {crew.destinationShort}
          </Text>
          <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {formatDateRange(crew.overlapStart, crew.overlapEnd)} — {crew.overlapDays} days together
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{
              backgroundColor: '#fd6b03',
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
            }}>
              <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12 }}>
                {crew.memberCount} nomads
              </Text>
            </View>
          </View>
        </View>

        {/* Member List */}
        <View className="px-6 pt-2">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#000', marginBottom: 12 }}>
            your crew
          </Text>
          {crew.members.map((member, index) => {
            const age = getAge(member.birthday);
            const arrival = new Date(member.tripStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const sharedInterests = member.interests
              .filter(i => userInterests.includes(i))
              .slice(0, 3);

            return (
              <TouchableOpacity
                key={member.userId}
                onPress={() => router.push(`/user/${member.userId}` as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: member.photo }}
                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' }}
                  />
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
                    borderWidth: 2,
                    borderColor: '#fff',
                  }} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000' }}>
                    {member.name}, {age}
                  </Text>
                  <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {member.currentLocation.split(',')[0]} — arrives {arrival}
                  </Text>
                  {sharedInterests.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {sharedInterests.map(interest => (
                        <View
                          key={interest}
                          style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}
                        >
                          <Text style={{ color: '#fd6b03', fontFamily: 'InstrumentSans_500Medium', fontSize: 11 }}>
                            {interestLabels[interest] || interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 12, color: '#0D9488' }}>
                    {member.overlapDays}d
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#fd6b03',
            paddingVertical: 16,
            borderRadius: 9999,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16 }}>
            wave at this crew
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Convergence Map Component
function ConvergenceMap({
  crew,
  allPoints,
  currentUserLocation,
}: {
  crew: {
    destinationShort: string;
    destinationLatitude?: number;
    destinationLongitude?: number;
    members: {
      userId: string;
      name: string;
      latitude?: number;
      longitude?: number;
      futureTrips: { location: string; latitude: number; longitude: number }[];
    }[];
  };
  allPoints: { latitude: number; longitude: number }[];
  currentUserLocation?: { latitude: number; longitude: number };
}) {
  if (!mapboxAvailable || !Mapbox || allPoints.length === 0) {
    return (
      <View style={{
        height: 280,
        backgroundColor: '#E8F4E8',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name="git-network-outline" size={40} color="#9CA3AF" />
        <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 14, color: '#6B7280', marginTop: 8 }}>
          route convergence map
        </Text>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
          {crew.members.length + 1} routes converging on {crew.destinationShort}
        </Text>
      </View>
    );
  }

  // Compute bounds
  const lats = allPoints.map(p => p.latitude);
  const lngs = allPoints.map(p => p.longitude);
  if (currentUserLocation) {
    lats.push(currentUserLocation.latitude);
    lngs.push(currentUserLocation.longitude);
  }
  const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
  const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];

  const destCoord: [number, number] | null =
    crew.destinationLatitude && crew.destinationLongitude
      ? [crew.destinationLongitude, crew.destinationLatitude]
      : null;

  return (
    <View style={{ height: 280 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          bounds={{ ne, sw, paddingTop: 50, paddingBottom: 50, paddingLeft: 50, paddingRight: 50 }}
          animationDuration={0}
        />

        {/* Route lines — one per member */}
        {crew.members.map((member, index) => {
          if (!destCoord || !member.latitude || !member.longitude) return null;
          const lineCoords: [number, number][] = [
            [member.longitude, member.latitude],
          ];
          member.futureTrips.forEach(t => lineCoords.push([t.longitude, t.latitude]));
          // Ensure destination is the last point
          if (destCoord) lineCoords.push(destCoord);

          const geoJSON = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: lineCoords,
            },
          };

          return (
            <Mapbox.ShapeSource key={`route-${index}`} id={`crew-route-${index}`} shape={geoJSON}>
              <Mapbox.LineLayer
                id={`crew-route-line-${index}`}
                style={{
                  lineColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
                  lineWidth: 2.5,
                  lineDasharray: [3, 2],
                  lineOpacity: 0.8,
                }}
              />
            </Mapbox.ShapeSource>
          );
        })}

        {/* Current user marker */}
        {currentUserLocation && (
          <Mapbox.PointAnnotation
            id="current-user"
            coordinate={[currentUserLocation.longitude, currentUserLocation.latitude]}
          >
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#10B981',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#fff',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
                android: { elevation: 4 },
              }),
            }}>
              <Text style={{ fontSize: 12 }}>you</Text>
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Member markers at current location */}
        {crew.members.map((member, index) => {
          if (!member.latitude || !member.longitude) return null;
          return (
            <Mapbox.PointAnnotation
              key={`member-${member.userId}`}
              id={`member-${member.userId}`}
              coordinate={[member.longitude, member.latitude]}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
                  android: { elevation: 3 },
                }),
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {member.name.charAt(0)}
                </Text>
              </View>
            </Mapbox.PointAnnotation>
          );
        })}

        {/* Destination marker */}
        {destCoord && (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={destCoord}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#fd6b03',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: '#fff',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
                android: { elevation: 6 },
              }),
            }}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>
    </View>
  );
}
