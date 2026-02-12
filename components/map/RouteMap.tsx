import { View, Text, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Try to load Mapbox — fails gracefully in Expo Go (no native module)
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
  // Native module not available (Expo Go)
}

interface RouteMapProps {
  currentLocation?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  futureTrips?: {
    latitude?: number;
    longitude?: number;
    location: string;
  }[];
  style?: ViewStyle;
}

function MapPlaceholder({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{
      height: 200,
      borderRadius: 16,
      backgroundColor: '#E8F4E8',
      justifyContent: 'center',
      alignItems: 'center',
    }, style]}>
      <Ionicons name="map-outline" size={36} color="#9CA3AF" />
      <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 14, color: '#6B7280', marginTop: 8 }}>
        map requires dev build
      </Text>
      <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
        run eas build --profile development
      </Text>
    </View>
  );
}

export function RouteMap({ currentLocation, futureTrips = [], style }: RouteMapProps) {
  // Filter trips with coordinates
  const tripsWithCoords = futureTrips.filter(
    (t): t is typeof t & { latitude: number; longitude: number } =>
      t.latitude != null && t.longitude != null
  );

  // All points for bounds fitting
  const allPoints: { latitude: number; longitude: number }[] = [];
  if (currentLocation) allPoints.push(currentLocation);
  allPoints.push(...tripsWithCoords.map(t => ({ latitude: t.latitude, longitude: t.longitude })));

  if (allPoints.length === 0) {
    return (
      <View style={[{ height: 200, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#9CA3AF' }}>
          add stops to see your route
        </Text>
      </View>
    );
  }

  if (!mapboxAvailable || !Mapbox) {
    return <MapPlaceholder style={style} />;
  }

  const center = {
    latitude: allPoints.reduce((s, p) => s + p.latitude, 0) / allPoints.length,
    longitude: allPoints.reduce((s, p) => s + p.longitude, 0) / allPoints.length,
  };

  // Route line from current location through all trips
  const lineCoords: [number, number][] = [];
  if (currentLocation) lineCoords.push([currentLocation.longitude, currentLocation.latitude]);
  tripsWithCoords.forEach(t => lineCoords.push([t.longitude, t.latitude]));

  const routeGeoJSON = lineCoords.length >= 2 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: lineCoords,
    },
  } : null;

  // Compute bounds
  const lats = allPoints.map(p => p.latitude);
  const lngs = allPoints.map(p => p.longitude);
  const bounds = allPoints.length >= 2
    ? { ne: [Math.max(...lngs), Math.max(...lats)] as [number, number], sw: [Math.min(...lngs), Math.min(...lats)] as [number, number] }
    : null;

  return (
    <View style={[{ height: 200, borderRadius: 16, overflow: 'hidden' }, style]}>
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
        {bounds ? (
          <Mapbox.Camera
            bounds={{ ne: bounds.ne, sw: bounds.sw, paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40 }}
            animationDuration={0}
          />
        ) : (
          <Mapbox.Camera
            centerCoordinate={[center.longitude, center.latitude]}
            zoomLevel={10}
            animationDuration={0}
          />
        )}

        {/* Route line */}
        {routeGeoJSON && (
          <Mapbox.ShapeSource id="user-route" shape={routeGeoJSON}>
            <Mapbox.LineLayer
              id="user-route-line"
              style={{
                lineColor: '#fd6b03',
                lineWidth: 3,
                lineDasharray: [2, 2],
                lineOpacity: 0.7,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Current location marker */}
        {currentLocation && (
          <Mapbox.PointAnnotation
            id="current-location"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
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
              <Text style={{ fontSize: 14 }}>📍</Text>
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Trip markers (numbered) */}
        {tripsWithCoords.map((trip, index) => (
          <Mapbox.PointAnnotation
            key={`trip-${index}`}
            id={`trip-${index}`}
            coordinate={[trip.longitude, trip.latitude]}
          >
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
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}
