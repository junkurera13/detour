import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { mockHelpRequests } from '@/data/mockData';

const categories = [
  { id: 'all', label: 'all' },
  { id: 'repairs', label: 'repairs' },
  { id: 'electrical', label: 'electrical' },
  { id: 'build', label: 'build' },
  { id: 'plumbing', label: 'plumbing' },
  { id: 'other', label: 'other' },
];

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function HelpScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const realRequests = useQuery(api.helpRequests.listOpen, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  // Use real data if available, otherwise fall back to mock data
  const requests = useMemo(() => {
    if (realRequests === undefined) return undefined; // Still loading
    if (realRequests && realRequests.length > 0) return realRequests;

    // Filter mock data by category if needed
    const filtered = selectedCategory === 'all'
      ? mockHelpRequests
      : mockHelpRequests.filter(r => r.category === selectedCategory);
    return filtered;
  }, [realRequests, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex will automatically refetch, just need to show spinner briefly
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handlePostPress = () => {
    router.push('/help/create' as any);
  };

  const handleRequestPress = (requestId: string) => {
    router.push(`/help/${requestId}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          help
        </Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push('/help/my-requests' as any)}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="document-text-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/help/my-offers' as any)}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="hand-right-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View className="pb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: selectedCategory === category.id ? '#000' : '#F3F4F6' }}
            >
              <Text
                className={`text-sm ${selectedCategory === category.id ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {requests === undefined ? (
        // Loading state
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
        </View>
      ) : requests.length === 0 ? (
        // Empty state
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="hand-left-outline" size={48} color="#9CA3AF" />
          </View>
          <Text
            className="text-xl text-black text-center mb-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            no requests yet
          </Text>
          <Text
            className="text-gray-500 text-center"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            be the first to post a help request{'\n'}or check back later
          </Text>
        </View>
      ) : (
        // Request list
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fd6b03" />
          }
        >
          {requests.map((request) => (
            <TouchableOpacity
              key={request._id}
              onPress={() => handleRequestPress(request._id)}
              className="mx-6 mb-4 p-4 bg-gray-50 rounded-2xl"
              activeOpacity={0.7}
            >
              {/* Author Row */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{ uri: request.author?.photos?.[0] || 'https://via.placeholder.com/40' }}
                    className="w-10 h-10 rounded-full"
                    resizeMode="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-black"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {request.author?.name || 'Unknown'}
                    </Text>
                    {request.location && (
                      <Text
                        className="text-gray-500 text-sm"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {request.location}
                      </Text>
                    )}
                  </View>
                </View>
                {request.isUrgent && (
                  <View className="bg-red-100 px-2 py-1 rounded-full">
                    <Text
                      className="text-red-600 text-xs"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      urgent
                    </Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text
                className="text-black text-lg mb-2"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {request.title}
              </Text>

              {/* Description */}
              <Text
                className="text-gray-600 mb-3"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
                numberOfLines={2}
              >
                {request.description}
              </Text>

              {/* Footer */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-gray-200 px-3 py-1 rounded-full mr-2">
                    <Text
                      className="text-gray-700"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {request.category}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="hand-wave-outline" size={16} color="#9CA3AF" />
                    <Text
                      className="text-gray-500 text-sm ml-1"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {request.offerCount} {request.offerCount === 1 ? 'offer' : 'offers'}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {formatTime(request.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handlePostPress}
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: '#fd6b03' }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
