import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { StopMap } from '@/components/map/StopMap';
import { useState } from 'react';

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

const amenityLabels: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'WiFi', icon: 'wifi' },
  water: { label: 'Water', icon: 'water' },
  electric: { label: 'Electric', icon: 'flash' },
  showers: { label: 'Showers', icon: 'water' },
  laundry: { label: 'Laundry', icon: 'shirt' },
  'pets-ok': { label: 'Pets OK', icon: 'paw' },
};

export default function StopDetailScreen() {
  const router = useRouter();
  const { stopId } = useLocalSearchParams<{ stopId: string }>();
  const [isAddingToRoute, setIsAddingToRoute] = useState(false);

  const stop = useQuery(api.nomadStops.getById, {
    id: stopId as Id<"nomadStops">,
  });

  const saveStop = useMutation(api.nomadStops.save);
  const unsaveStop = useMutation(api.nomadStops.unsave);
  const updateUser = useMutation(api.users.update);

  if (!stop) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text style={{ fontFamily: 'InstrumentSans_400Regular', color: '#9CA3AF' }}>
          loading...
        </Text>
      </SafeAreaView>
    );
  }

  const handleSaveToggle = async () => {
    try {
      if (stop.isSaved) {
        await unsaveStop({ stopId: stop._id });
      } else {
        await saveStop({ stopId: stop._id });
      }
    } catch {
      Alert.alert('Error', 'Failed to update save status');
    }
  };

  const handleAddToRoute = async () => {
    setIsAddingToRoute(true);
    try {
      await updateUser({
        futureTrips: [{
          location: stop.address || stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          stopType: stop.category,
        }],
      });
      Alert.alert('Added!', `${stop.name} has been added to your route`);
    } catch {
      Alert.alert('Error', 'Failed to add to route');
    } finally {
      setIsAddingToRoute(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={stop.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={stop.isSaved ? '#fd6b03' : '#000'}
            />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View className="px-6 mb-4">
          <StopMap
            stops={[{
              id: stop._id,
              name: stop.name,
              category: stop.category,
              latitude: stop.latitude,
              longitude: stop.longitude,
            }]}
            center={{ latitude: stop.latitude, longitude: stop.longitude }}
            zoom={13}
            interactive={false}
            style={{ height: 200, borderRadius: 16 }}
          />
        </View>

        {/* Stop info */}
        <View className="px-6">
          {/* Category badge + name */}
          <View className="flex-row items-center mb-2">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginRight: 10,
              }}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>
                {categoryEmoji[stop.category] || '📍'}
              </Text>
              <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 12, color: '#6B7280' }}>
                {stop.category}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: 'InstrumentSans_600SemiBold',
              fontSize: 24,
              color: '#000',
              marginBottom: 4,
            }}
          >
            {stop.name}
          </Text>

          {stop.address && (
            <Text
              style={{
                fontFamily: 'InstrumentSans_400Regular',
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8,
              }}
            >
              {stop.address}
            </Text>
          )}

          {/* Creator info */}
          <View className="flex-row items-center mb-6">
            {stop.creatorPhoto ? (
              <Image
                source={{ uri: stop.creatorPhoto }}
                style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
              />
            ) : (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#E5E7EB',
                  marginRight: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="person" size={14} color="#9CA3AF" />
              </View>
            )}
            <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#9CA3AF' }}>
              pinned by {stop.creatorName}
            </Text>
          </View>

          {/* Description */}
          {stop.description && (
            <View className="mb-6">
              <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#374151', lineHeight: 22 }}>
                {stop.description}
              </Text>
            </View>
          )}

          {/* Amenities */}
          {stop.amenities && stop.amenities.length > 0 && (
            <View className="mb-6">
              <Text
                style={{
                  fontFamily: 'InstrumentSans_600SemiBold',
                  fontSize: 16,
                  color: '#000',
                  marginBottom: 10,
                }}
              >
                amenities
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {stop.amenities.map((amenity) => {
                  const info = amenityLabels[amenity] || { label: amenity, icon: 'checkmark' };
                  return (
                    <View
                      key={amenity}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F0FDF4',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Ionicons
                        name={info.icon as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color="#10B981"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 13, color: '#10B981' }}>
                        {info.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Photos */}
          {stop.photos && stop.photos.length > 0 && (
            <View className="mb-6">
              <Text
                style={{
                  fontFamily: 'InstrumentSans_600SemiBold',
                  fontSize: 16,
                  color: '#000',
                  marginBottom: 10,
                }}
              >
                photos
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {stop.photos.map((photo, i) => (
                  <Image
                    key={i}
                    source={{ uri: photo }}
                    style={{ width: 200, height: 150, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          paddingBottom: 34,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          backgroundColor: '#fff',
        }}
      >
        <TouchableOpacity
          onPress={handleAddToRoute}
          disabled={isAddingToRoute}
          style={{
            backgroundColor: '#fd6b03',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isAddingToRoute ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#fff' }}>
              {isAddingToRoute ? 'adding...' : 'add to my route'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
