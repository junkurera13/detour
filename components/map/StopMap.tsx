import { useEffect, useRef } from 'react';
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

// Category → color mapping
const categoryColors: Record<string, string> = {
  campsite: '#fd6b03',   // orange
  coworking: '#0D9488',  // teal
  beach: '#3B82F6',      // blue
  'rest-area': '#6B7280', // gray
  hostel: '#8B5CF6',     // purple
  parking: '#9CA3AF',    // light gray
  water: '#06B6D4',      // cyan
  'dump-station': '#78716C', // stone
  other: '#6B7280',      // gray
  city: '#fd6b03',       // orange
};

// Category → icon label
const categoryLabels: Record<string, string> = {
  campsite: '🏕️',
  coworking: '💻',
  beach: '🏖️',
  'rest-area': '🅿️',
  hostel: '🛏️',
  parking: '🅿️',
  water: '💧',
  'dump-station': '🚮',
  other: '📍',
  city: '🏙️',
};

export interface StopMarker {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  latitude: number;
  longitude: number;
  location: string;
}

interface StopMapProps {
  stops?: StopMarker[];
  routeStops?: RouteStop[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  style?: ViewStyle;
  interactive?: boolean;
  onStopPress?: (stopId: string) => void;
  showRoute?: boolean;
}

function MapPlaceholder({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{
      height: 180,
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

export function StopMap({
  stops = [],
  routeStops = [],
  center,
  zoom = 10,
  style,
  interactive = true,
  onStopPress,
  showRoute = false,
}: StopMapProps) {
  const cameraRef = useRef<any>(null);

  // Compute center from all points if not provided
  const mapCenter = center || computeCenter([
    ...stops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
    ...routeStops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
  ]);

  // Build route GeoJSON line
  const routeGeoJSON = showRoute && routeStops.length >= 2 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: routeStops.map(s => [s.longitude, s.latitude]),
    },
  } : null;

  // Auto-fit bounds when data changes
  useEffect(() => {
    if (!mapboxAvailable || !cameraRef.current) return;

    const allPoints = [
      ...stops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
      ...routeStops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
    ];

    if (allPoints.length >= 2) {
      const lats = allPoints.map(p => p.latitude);
      const lngs = allPoints.map(p => p.longitude);
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];

      cameraRef.current.fitBounds(ne, sw, [50, 50, 50, 50], 1000);
    }
  }, [stops, routeStops]);

  if (!mapboxAvailable || !Mapbox) {
    return <MapPlaceholder style={style} />;
  }

  if (!mapCenter) {
    return (
      <View style={[{ height: 180, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#9CA3AF' }}>
          no location data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ height: 180, borderRadius: 16, overflow: 'hidden' }, style]}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={[mapCenter.longitude, mapCenter.latitude]}
          zoomLevel={zoom}
          animationDuration={0}
        />

        {/* Route line */}
        {routeGeoJSON && (
          <Mapbox.ShapeSource id="route-line" shape={routeGeoJSON}>
            <Mapbox.LineLayer
              id="route-line-layer"
              style={{
                lineColor: '#fd6b03',
                lineWidth: 3,
                lineDasharray: [2, 2],
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Route stop markers (numbered) */}
        {routeStops.map((stop, index) => (
          <Mapbox.PointAnnotation
            key={`route-${index}`}
            id={`route-${index}`}
            coordinate={[stop.longitude, stop.latitude]}
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

        {/* Community stop markers */}
        {stops.map((stop) => (
          <Mapbox.PointAnnotation
            key={`stop-${stop.id}`}
            id={`stop-${stop.id}`}
            coordinate={[stop.longitude, stop.latitude]}
            onSelected={() => onStopPress?.(stop.id)}
          >
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: categoryColors[stop.category] || '#6B7280',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#fff',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
                android: { elevation: 4 },
              }),
            }}>
              <Text style={{ fontSize: 14 }}>{categoryLabels[stop.category] || '📍'}</Text>
            </View>
            <Mapbox.Callout title={stop.name} />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}

function computeCenter(points: { latitude: number; longitude: number }[]) {
  const valid = points.filter(p => p.latitude && p.longitude);
  if (valid.length === 0) return null;
  const lat = valid.reduce((sum, p) => sum + p.latitude, 0) / valid.length;
  const lng = valid.reduce((sum, p) => sum + p.longitude, 0) / valid.length;
  return { latitude: lat, longitude: lng };
}

export { categoryColors, categoryLabels };
