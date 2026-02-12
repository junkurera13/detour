import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { StopMap } from '@/components/map/StopMap';
import type { StopMarker } from '@/components/map/StopMap';

const categories = [
  { id: 'all', label: 'all', icon: 'grid-outline' as const },
  { id: 'campsite', label: 'campsite', icon: 'bonfire-outline' as const },
  { id: 'coworking', label: 'co-working', icon: 'wifi-outline' as const },
  { id: 'beach', label: 'beach', icon: 'sunny-outline' as const },
  { id: 'rest-area', label: 'rest area', icon: 'car-outline' as const },
  { id: 'hostel', label: 'hostel', icon: 'bed-outline' as const },
  { id: 'parking', label: 'parking', icon: 'car-outline' as const },
  { id: 'other', label: 'other', icon: 'ellipsis-horizontal-outline' as const },
];

const categoryEmoji: Record<string, string> = {
  campsite: '🏕️',
  coworking: '💻',
  beach: '🏖️',
  'rest-area': '🅿️',
  hostel: '🛏️',
  parking: '🅿️',
  water: '💧',
  'dump-station': '🚮',
  other: '📍',
};

export default function StopsScreen() {
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const stops = useQuery(api.nomadStops.list, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    limit: 50,
  });

  const userLat = convexUser?.latitude;
  const userLng = convexUser?.longitude;

  // Build markers for map
  const mapStops: StopMarker[] = (stops ?? [])
    .map((s) => ({
      id: s._id,
      name: s.name,
      category: s.category,
      latitude: s.latitude,
      longitude: s.longitude,
    }));

  const center = userLat && userLng
    ? { latitude: userLat, longitude: userLng }
    : mapStops.length > 0
      ? { latitude: mapStops[0].latitude, longitude: mapStops[0].longitude }
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text
            className="text-2xl text-black"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            nomad stops
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter chips — wrapped in a View to prevent vertical stretch on Android */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 8, alignItems: 'center' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#fd6b03' : '#F3F4F6',
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#fff' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontFamily: 'InstrumentSans_500Medium',
                    fontSize: 13,
                    color: isSelected ? '#fff' : '#6B7280',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {viewMode === 'map' ? (
        /* Map view */
        <View className="flex-1">
          <StopMap
            stops={mapStops}
            center={center}
            zoom={8}
            style={{ flex: 1, borderRadius: 0 }}
            interactive
            onStopPress={(stopId) => router.push(`/stops/${stopId}`)}
          />
        </View>
      ) : (
        /* List view */
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {!stops ? (
            <Text
              className="text-center text-gray-400 mt-10"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              loading stops...
            </Text>
          ) : stops.length === 0 ? (
            <View className="items-center mt-20">
              <Ionicons name="map-outline" size={48} color="#D1D5DB" />
              <Text
                className="text-gray-400 mt-4 text-center"
                style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 16 }}
              >
                no stops yet
              </Text>
              <Text
                className="text-gray-300 mt-1 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14 }}
              >
                be the first to pin a spot!
              </Text>
            </View>
          ) : (
            stops.map((stop) => (
              <TouchableOpacity
                key={stop._id}
                onPress={() => router.push(`/stops/${stop._id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#F3F4F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {categoryEmoji[stop.category] || '📍'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_600SemiBold',
                      fontSize: 15,
                      color: '#000',
                    }}
                    numberOfLines={1}
                  >
                    {stop.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_400Regular',
                      fontSize: 13,
                      color: '#9CA3AF',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {stop.category} {stop.address ? `· ${stop.address}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB - Create stop */}
      <TouchableOpacity
        onPress={() => router.push('/stops/create')}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#fd6b03',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
