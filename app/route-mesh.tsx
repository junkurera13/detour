import { View, Text, TouchableOpacity, Platform, Image, Animated, PanResponder, ScrollView, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { CrewCard } from '@/components/CrewCard';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

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

const CREW_COLORS = ['#3B82F6', '#0D9488', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'];

export default function RouteMeshScreen() {
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const crews = useQuery(api.crews.getCrewsForUser, convexUser?._id ? {} : "skip");
  const updateUser = useMutation(api.users.update);

  // Add stop modal state
  const [showAddStop, setShowAddStop] = useState(false);
  const [newStopLocation, setNewStopLocation] = useState('');
  const [newStopCoords, setNewStopCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [newStopDate, setNewStopDate] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  const handleLocateMe = async () => {
    if (locatingUser) return;
    setLocatingUser(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocatingUser(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      cameraRef.current?.setCamera({
        centerCoordinate: [pos.coords.longitude, pos.coords.latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });
    } catch {
      // silently fail
    } finally {
      setLocatingUser(false);
    }
  };

  const handleAddStop = async () => {
    if (!newStopLocation.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const existingTrips = (convexUser?.futureTrips || []).map(t => ({
        location: t.location,
        date: t.date,
        startDate: t.startDate,
        endDate: t.endDate,
        latitude: t.latitude,
        longitude: t.longitude,
        stopType: t.stopType,
      }));
      const newStop = {
        location: newStopLocation,
        startDate: newStopDate,
        latitude: newStopCoords?.latitude,
        longitude: newStopCoords?.longitude,
        stopType: 'city' as const,
      };
      await updateUser({ futureTrips: [...existingTrips, newStop] });
      setShowAddStop(false);
      setNewStopLocation('');
      setNewStopCoords(null);
      setNewStopDate(undefined);
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const allMyTrips = convexUser?.futureTrips || [];

  const myTrips = allMyTrips.filter(
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

  const cameraRef = useRef<any>(null);

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
        paddingBottom: 0,
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

        {/* Floating journey bar */}
        {(myLocation || allMyTrips.length > 0) && (
          <View style={{
            marginTop: 10,
            backgroundColor: 'rgba(255,255,255,0.93)',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
              android: { elevation: 4 },
            }),
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Current location */}
                {myLocation && (
                  <>
                    <View style={{ alignItems: 'center', width: 68 }}>
                      <Text numberOfLines={1} style={{
                        fontSize: 13,
                        fontFamily: 'InstrumentSans_600SemiBold',
                        color: '#10B981',
                        textAlign: 'center',
                      }}>
                        {(convexUser?.currentLocation || '').split(',')[0].trim() || 'here'}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontFamily: 'InstrumentSans_400Regular',
                        color: '#9CA3AF',
                        textAlign: 'center',
                        marginTop: 2,
                      }}>
                        now
                      </Text>
                    </View>
                    {allMyTrips.length > 0 && (
                      <Ionicons name="chevron-forward" size={14} color="#D1D5DB" style={{ marginHorizontal: 4 }} />
                    )}
                  </>
                )}
                {/* Trip stops */}
                {allMyTrips.map((trip, index) => {
                  const cityName = trip.location.split(',')[0].trim();
                  const tripDate = trip.startDate || trip.date;
                  let dateLabel = '';
                  if (tripDate) {
                    const parsed = new Date(tripDate);
                    dateLabel = isNaN(parsed.getTime()) ? tripDate : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  return (
                    <View key={`journey-${index}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ alignItems: 'center', width: 68 }}>
                        <Text numberOfLines={1} style={{
                          fontSize: 13,
                          fontFamily: 'InstrumentSans_500Medium',
                          color: '#374151',
                          textAlign: 'center',
                        }}>
                          {cityName}
                        </Text>
                        {dateLabel !== '' && (
                          <Text style={{
                            fontSize: 11,
                            fontFamily: 'InstrumentSans_400Regular',
                            color: '#9CA3AF',
                            textAlign: 'center',
                            marginTop: 2,
                          }}>
                            {dateLabel}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#D1D5DB" style={{ marginHorizontal: 4 }} />
                    </View>
                  );
                })}
                {/* Add stop button */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setShowAddStop(true)}
                    style={{ alignItems: 'center', width: 68 }}
                  >
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#D1D5DB',
                      borderStyle: 'dashed',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="add" size={14} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
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
              bounds={{ ne, sw, paddingTop: 160, paddingBottom: 100, paddingLeft: 50, paddingRight: 50 }}
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
              const crewColor = CREW_COLORS[crewIdx % CREW_COLORS.length];
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
                      lineColor: crewColor,
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
              <Image
                source={{ uri: (convexUser?.photos || [])[0] }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: '#fd6b03',
                  backgroundColor: '#E5E7EB',
                  ...Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
                    android: { elevation: 4 },
                  }),
                }}
              />
            </MarkerComponent>
          )}

          {/* My trip stop markers with city labels */}
          {allMyTrips.map((trip, index) => {
            if (trip.latitude == null || trip.longitude == null) return null;
            const cityName = trip.location.split(',')[0].trim();
            return (
              <MarkerComponent
                key={`my-trip-${index}`}
                id={`my-trip-${index}`}
                coordinate={[trip.longitude, trip.latitude]}
                anchor={{ x: 0.5, y: 0.75 }}
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
              const crewColor = CREW_COLORS[crewIdx % CREW_COLORS.length];
              const destCity = crew.destinationShort;
              return (
                <MarkerComponent
                  key={`crew-member-${crewIdx}-${memberIdx}`}
                  id={`crew-member-${crewIdx}-${memberIdx}`}
                  coordinate={[member.longitude, member.latitude]}
                  anchor={{ x: 0.5, y: 0.7 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/user/${member.userId}` as any)}
                    style={{ alignItems: 'center' }}
                  >
                    <View style={{
                      backgroundColor: crewColor,
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
                          borderColor: crewColor,
                          backgroundColor: '#E5E7EB',
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: crewColor,
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

      </View>

      {/* Floating locate-me button */}
      <TouchableOpacity
        onPress={handleLocateMe}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: crews && crews.length > 0 ? 110 : 30,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { elevation: 5 },
          }),
        }}
      >
        {locatingUser ? (
          <Ionicons name="locate" size={22} color="#fd6b03" />
        ) : (
          <Ionicons name="locate-outline" size={22} color="#333" />
        )}
      </TouchableOpacity>

      {/* Draggable bottom sheet */}
      {crews && crews.length > 0 && (
        <BottomSheet crews={crews} router={router} />
      )}

      {/* Add stop modal */}
      <Modal
        visible={showAddStop}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddStop(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowAddStop(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              paddingTop: 16,
              paddingHorizontal: 20,
            }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
              </View>

              {/* Title */}
              <Text style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                fontSize: 20,
                color: '#000',
                marginBottom: 20,
              }}>
                add a stop
              </Text>

              {/* Location search */}
              <LocationAutocomplete
                value={newStopLocation}
                enablePOI
                onSelect={(loc) => {
                  setNewStopLocation(loc.fullName);
                  setNewStopCoords(loc.coordinates || null);
                }}
                placeholder="search city, campsite, or spot..."
              />

              {/* Date picker */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  marginTop: 12,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={newStopDate ? '#fd6b03' : '#9CA3AF'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  flex: 1,
                  fontFamily: 'InstrumentSans_400Regular',
                  fontSize: 16,
                  color: newStopDate ? '#000' : '#9CA3AF',
                }}>
                  {newStopDate
                    ? new Date(newStopDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'add date (optional)'}
                </Text>
                {newStopDate && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setNewStopDate(undefined);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Save button */}
              <TouchableOpacity
                onPress={handleAddStop}
                disabled={!newStopLocation.trim() || isSaving}
                style={{
                  backgroundColor: newStopLocation.trim() ? '#fd6b03' : '#E5E7EB',
                  borderRadius: 9999,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 20,
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: newStopLocation.trim() ? '#fff' : '#9CA3AF',
                  fontFamily: 'InstrumentSans_600SemiBold',
                  fontSize: 16,
                }}>
                  {isSaving ? 'adding...' : 'add stop'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date picker modal — iOS */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="slide">
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 34,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={{ fontFamily: 'InstrumentSans_500Medium', color: '#6B7280' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    if (!newStopDate) setNewStopDate(new Date().toISOString());
                    setShowDatePicker(false);
                  }}>
                    <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#fd6b03' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newStopDate ? new Date(newStopDate) : new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  style={{ height: 200 }}
                  themeVariant="light"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setNewStopDate(selectedDate.toISOString());
                  }}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Date picker — Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={newStopDate ? new Date(newStopDate) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              setNewStopDate(selectedDate.toISOString());
            }
          }}
        />
      )}
    </View>
  );
}

/* ─── Draggable Bottom Sheet ─── */

const HANDLE_HEIGHT = 60;
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
  const bottomPad = Platform.OS === 'ios' ? 34 : 20;
  const sheetBodyHeight = Dimensions.get('window').height * 0.65;

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
          const clamped = Math.max(-sheetBodyHeight - offsetY.current, Math.min(-offsetY.current, g.dy));
          translateY.setValue(clamped);
        },
        onPanResponderRelease: (_, g) => {
          translateY.flattenOffset();
          const shouldExpand = g.dy < -SNAP_THRESHOLD || (expanded && g.dy < SNAP_THRESHOLD);
          const target = shouldExpand ? -sheetBodyHeight : 0;

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
    [expanded, translateY, sheetBodyHeight],
  );

  const toggleSheet = useCallback(() => {
    const willExpand = !expanded;
    const target = willExpand ? -sheetBodyHeight : 0;
    offsetY.current = target;
    setExpanded(willExpand);
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [expanded, translateY, sheetBodyHeight]);

  const collapsedVisible = HANDLE_HEIGHT + bottomPad;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: -(sheetBodyHeight),
        left: 0,
        right: 0,
        height: collapsedVisible + sheetBodyHeight,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 10 },
          }),
        }}
      >
        {/* Drag handle + header */}
        <View {...panResponder.panHandlers} style={{ height: collapsedVisible }}>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleSheet}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 14 }}>
              <View style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#D1D5DB',
              }} />
            </View>
            <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: expanded ? 20 : 15, color: '#374151' }}>
                {crews.length} crew{crews.length !== 1 ? 's' : ''} on your route
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Scrollable crew cards — only rendered when expanded */}
        {expanded && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: bottomPad + 16 }}
            showsVerticalScrollIndicator={false}
          >
            {crews.map(crew => (
              <CrewCard
                key={crew.crewId}
                crew={crew}
                onPress={() => router.push(`/crew/${crew.crewId}` as any)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}
