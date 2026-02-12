import { View, Text, TouchableOpacity, Platform, Image, Animated, PanResponder, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useCallback, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { CrewCard } from '@/components/CrewCard';

// Try to load Mapbox
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

export default function RouteMeshScreen() {
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const crews = useQuery(api.crews.getCrewsForUser, convexUser?._id ? {} : "skip");

  const myTrips = (convexUser?.futureTrips || []).filter(
    (t): t is typeof t & { latitude: number; longitude: number } =>
      t.latitude != null && t.longitude != null
  );

  const myLocation = convexUser?.latitude && convexUser?.longitude
    ? { latitude: convexUser.latitude, longitude: convexUser.longitude }
    : null;

  // Collect all points for bounds
  const allPoints: { latitude: number; longitude: number }[] = [];
  if (myLocation) allPoints.push(myLocation);
  myTrips.forEach(t => allPoints.push({ latitude: t.latitude, longitude: t.longitude }));
  (crews || []).forEach(crew => {
    if (crew.destinationLatitude && crew.destinationLongitude) {
      allPoints.push({ latitude: crew.destinationLatitude, longitude: crew.destinationLongitude });
    }
    crew.members.forEach(m => {
      if (m.latitude && m.longitude) allPoints.push({ latitude: m.latitude, longitude: m.longitude });
    });
  });

  // Build my route GeoJSON
  const myRouteCoords: [number, number][] = [];
  if (myLocation) myRouteCoords.push([myLocation.longitude, myLocation.latitude]);
  myTrips.forEach(t => myRouteCoords.push([t.longitude, t.latitude]));

  const myRouteGeoJSON = myRouteCoords.length >= 2 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: myRouteCoords,
    },
  } : null;

  // Compute bounds
  const lats = allPoints.map(p => p.latitude);
  const lngs = allPoints.map(p => p.longitude);
  const ne: [number, number] | null = lats.length > 0 ? [Math.max(...lngs), Math.max(...lats)] : null;
  const sw: [number, number] | null = lats.length > 0 ? [Math.min(...lngs), Math.min(...lats)] : null;

  const defaultCenter: [number, number] = myLocation
    ? [myLocation.longitude, myLocation.latitude]
    : myTrips.length > 0
      ? [myTrips[0].longitude, myTrips[0].latitude]
      : [0, 20];

  if (!mapboxAvailable || !Mapbox) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="ml-3" style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 18, color: '#000' }}>
            route mesh
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="map-outline" size={48} color="#D1D5DB" />
          <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 16, color: '#6B7280', marginTop: 12 }}>
            map requires dev build
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const MarkerComponent = Platform.OS === 'android' ? Mapbox.MarkerView : Mapbox.PointAnnotation;
  const cameraRef = useRef<any>(null);
  const zoomRef = useRef(4);

  const handleZoom = useCallback((delta: number) => {
    zoomRef.current = Math.max(1, Math.min(18, zoomRef.current + delta));
    cameraRef.current?.zoomTo(zoomRef.current, 300);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Header overlay */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 54 : 58,
        paddingHorizontal: 20,
        paddingBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.9)',
              justifyContent: 'center',
              alignItems: 'center',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
                android: { elevation: 4 },
              }),
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
              android: { elevation: 4 },
            }),
          }}>
            <Ionicons name="git-network-outline" size={16} color="#fd6b03" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#000' }}>
              route mesh
            </Text>
            {crews && crews.length > 0 && (
              <View style={{
                backgroundColor: '#fd6b03',
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 1,
                marginLeft: 8,
              }}>
                <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'InstrumentSans_600SemiBold' }}>
                  {crews.length}
                </Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Full-screen interactive map */}
      <View style={{ flex: 1 }}>
        <Mapbox.MapView
          style={{ flex: 1 }}
          styleURL="mapbox://styles/mapbox/outdoors-v12"
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
        >
          {ne && sw && allPoints.length >= 2 ? (
            <Mapbox.Camera
              ref={cameraRef}
              bounds={{ ne, sw, paddingTop: 120, paddingBottom: 100, paddingLeft: 50, paddingRight: 50 }}
              animationDuration={0}
            />
          ) : (
            <Mapbox.Camera
              ref={cameraRef}
              centerCoordinate={defaultCenter}
              zoomLevel={4}
              animationDuration={0}
            />
          )}

          {/* My route line */}
          {myRouteGeoJSON && (
            <Mapbox.ShapeSource id="my-route" shape={myRouteGeoJSON}>
              <Mapbox.LineLayer
                id="my-route-line"
                style={{
                  lineColor: '#fd6b03',
                  lineWidth: 3,
                  lineDasharray: [2, 2],
                  lineOpacity: 0.9,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Crew member route lines */}
          {(crews || []).map((crew, crewIdx) =>
            crew.members.map((member, memberIdx) => {
              if (!member.latitude || !member.longitude) return null;
              if (!crew.destinationLatitude || !crew.destinationLongitude) return null;
              const coords: [number, number][] = [
                [member.longitude, member.latitude],
                ...member.futureTrips.map((t): [number, number] => [t.longitude, t.latitude]),
                [crew.destinationLongitude, crew.destinationLatitude],
              ];
              if (coords.length < 2) return null;
              const colorIdx = (crewIdx * 3 + memberIdx + 1) % ROUTE_COLORS.length;
              const geoJSON = {
                type: 'Feature' as const,
                properties: {},
                geometry: { type: 'LineString' as const, coordinates: coords },
              };
              const id = `crew-${crewIdx}-member-${memberIdx}`;
              return (
                <Mapbox.ShapeSource key={id} id={id} shape={geoJSON}>
                  <Mapbox.LineLayer
                    id={`${id}-line`}
                    style={{
                      lineColor: ROUTE_COLORS[colorIdx],
                      lineWidth: 2,
                      lineDasharray: [3, 2],
                      lineOpacity: 0.6,
                    }}
                  />
                </Mapbox.ShapeSource>
              );
            })
          )}

          {/* My current location marker */}
          {myLocation && (
            <MarkerComponent
              id="my-location"
              coordinate={[myLocation.longitude, myLocation.latitude]}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#10B981',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#fff',
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
                  android: { elevation: 4 },
                }),
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>you</Text>
              </View>
            </MarkerComponent>
          )}

          {/* My trip stop markers with city labels */}
          {myTrips.map((trip, index) => {
            const cityName = trip.location.split(',')[0].trim();
            return (
              <MarkerComponent
                key={`my-trip-${index}`}
                id={`my-trip-${index}`}
                coordinate={[trip.longitude, trip.latitude]}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginBottom: 4,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'InstrumentSans_600SemiBold' }}>
                      {cityName}
                    </Text>
                  </View>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#fd6b03',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                    ...Platform.select({
                      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
                      android: { elevation: 4 },
                    }),
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{index + 1}</Text>
                  </View>
                </View>
              </MarkerComponent>
            );
          })}

          {/* Crew member markers with name + photo */}
          {(crews || []).map((crew, crewIdx) =>
            crew.members.map((member, memberIdx) => {
              if (!member.latitude || !member.longitude) return null;
              const colorIdx = (crewIdx * 3 + memberIdx + 1) % ROUTE_COLORS.length;
              const destCity = crew.destinationShort;
              return (
                <MarkerComponent
                  key={`crew-member-${crewIdx}-${memberIdx}`}
                  id={`crew-member-${crewIdx}-${memberIdx}`}
                  coordinate={[member.longitude, member.latitude]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/user/${member.userId}` as any)}
                    style={{ alignItems: 'center' }}
                  >
                    <View style={{
                      backgroundColor: ROUTE_COLORS[colorIdx],
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginBottom: 4,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'InstrumentSans_600SemiBold' }}>
                        {member.name} → {destCity}
                      </Text>
                    </View>
                    {member.photo ? (
                      <Image
                        source={{ uri: member.photo }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          borderWidth: 3,
                          borderColor: ROUTE_COLORS[colorIdx],
                          backgroundColor: '#E5E7EB',
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: ROUTE_COLORS[colorIdx],
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#fff',
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </MarkerComponent>
              );
            })
          )}
        </Mapbox.MapView>

        {/* Zoom controls */}
        <View style={{
          position: 'absolute',
          right: 16,
          top: '45%',
          borderRadius: 12,
          overflow: 'hidden',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
            android: { elevation: 4 },
          }),
        }}>
          <TouchableOpacity
            onPress={() => handleZoom(1)}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'rgba(255,255,255,0.95)',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}
          >
            <Ionicons name="add" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleZoom(-1)}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'rgba(255,255,255,0.95)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="remove" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Draggable bottom sheet */}
      {crews && crews.length > 0 && (
        <BottomSheet crews={crews} router={router} />
      )}
    </View>
  );
}

/* ─── Draggable Bottom Sheet ─── */

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 80;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.55;
const SNAP_THRESHOLD = 60;

function BottomSheet({
  crews,
  router,
}: {
  crews: any[];
  router: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
        onPanResponderGrant: () => {
          translateY.setOffset(offsetY.current);
          translateY.setValue(0);
        },
        onPanResponderMove: (_, g) => {
          // Clamp: negative = drag up (expand), positive = drag down (collapse)
          const maxUp = -(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);
          const clamped = Math.max(maxUp - offsetY.current, Math.min(-offsetY.current, g.dy));
          translateY.setValue(clamped);
        },
        onPanResponderRelease: (_, g) => {
          translateY.flattenOffset();
          const currentY = offsetY.current + g.dy;
          const shouldExpand = g.dy < -SNAP_THRESHOLD || (expanded && g.dy < SNAP_THRESHOLD);
          const target = shouldExpand ? -(EXPANDED_HEIGHT - COLLAPSED_HEIGHT) : 0;

          offsetY.current = target;
          setExpanded(shouldExpand);
          Animated.spring(translateY, {
            toValue: target,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        },
      }),
    [expanded, translateY],
  );

  const toggleSheet = useCallback(() => {
    const willExpand = !expanded;
    const target = willExpand ? -(EXPANDED_HEIGHT - COLLAPSED_HEIGHT) : 0;
    offsetY.current = target;
    setExpanded(willExpand);
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [expanded, translateY]);

  const bottomPad = Platform.OS === 'ios' ? 34 : 20;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: EXPANDED_HEIGHT + bottomPad,
        transform: [{ translateY }],
        // Start with only collapsed portion visible
        top: SCREEN_HEIGHT - COLLAPSED_HEIGHT - bottomPad,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 10 },
          }),
        }}
      >
        {/* Drag handle + header */}
        <View {...panResponder.panHandlers}>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleSheet}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
              <View style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#D1D5DB',
              }} />
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingBottom: 10,
            }}>
              <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#374151' }}>
                {crews.length} cohort{crews.length !== 1 ? 's' : ''} on your route
              </Text>
              <Ionicons
                name={expanded ? 'chevron-down' : 'chevron-up'}
                size={18}
                color="#9CA3AF"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Scrollable crew cards */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 16 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={expanded}
        >
          {crews.map(crew => (
            <CrewCard
              key={crew.crewId}
              crew={crew}
              onPress={() => router.push(`/crew/${crew.crewId}` as any)}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
