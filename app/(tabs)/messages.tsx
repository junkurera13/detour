import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';


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
  const { user } = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const requests = useQuery(api.helpRequests.listOpen, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const hasBuilderProfile = (user?.builderSpecialties?.length ?? 0) > 0;

  const forYouRequests = useQuery(
    api.helpRequests.listForYou,
    hasBuilderProfile ? { limit: 5 } : "skip"
  );

  // Filter out "for you" requests from the main feed to avoid duplicates
  const forYouIds = useMemo(() => {
    return new Set((forYouRequests ?? []).map((r) => r._id));
  }, [forYouRequests]);

  const filteredRequests = useMemo(() => {
    if (!requests) return undefined;
    if (!forYouRequests || forYouRequests.length === 0) return requests;
    return requests.filter((r) => !forYouIds.has(r._id));
  }, [requests, forYouRequests, forYouIds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex will automatically refetch, just need to show spinner briefly
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handlePostPress = () => {
    router.push('/help/create');
  };

  const handleRequestPress = (requestId: string) => {
    router.push(`/help/${requestId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text
            className="text-5xl text-black"
            style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
          >
            help
          </Text>
          <Text
            className="text-black text-xs ml-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            beta
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push('/help/chats')}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/help/my-requests')}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="document-text-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/help/my-offers')}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="hand-right-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View className="pb-6">
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
      ) : requests.length === 0 && (!forYouRequests || forYouRequests.length === 0) ? (
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
          {/* For You Section */}
          {hasBuilderProfile && forYouRequests !== undefined && (
            <View className="mb-4">
              <View className="px-6 mb-3 flex-row items-center">
                <Ionicons name="sparkles" size={18} color="#fd6b03" />
                <Text
                  className="text-lg text-black ml-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  for you
                </Text>
                <Text
                  className="text-gray-400 text-sm ml-2"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  matches your skills & location
                </Text>
              </View>
              {forYouRequests.length === 0 ? (
                <View className="mx-6 mb-3 p-4 rounded-2xl bg-gray-50 items-center">
                  <Text
                    className="text-gray-500 text-center"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    no requests near you yet
                  </Text>
                </View>
              ) : forYouRequests.map((request) => (
                <TouchableOpacity
                  key={request._id}
                  onPress={() => handleRequestPress(request._id)}
                  className="mx-6 mb-3 p-4 rounded-2xl border"
                  style={{ backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }}
                  activeOpacity={0.7}
                >
                  {/* Author Row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      {request.author?.photos?.[0] ? (
                        <Image
                          source={{ uri: request.author.photos[0] }}
                          className="w-10 h-10 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                      )}
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
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {formatTime(request.createdAt)}
                    </Text>
                  </View>

                  {/* Title */}
                  <View className="flex-row items-center mb-2">
                    <Text
                      className="text-black text-lg flex-1"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {request.title}
                    </Text>
                    {request.isUrgent && (
                      <Ionicons name="warning" size={22} color="#DC2626" style={{ marginLeft: 6 }} />
                    )}
                  </View>

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
                      <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FDBA74' }}>
                        <Text
                          className="text-white"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.category}
                        </Text>
                      </View>
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
                </TouchableOpacity>
              ))}

              {/* Divider between for you and all requests */}
              {forYouRequests.length > 0 && filteredRequests && filteredRequests.length > 0 && (
                <View className="mx-6 mt-2 mb-1 border-b border-gray-200" />
              )}
            </View>
          )}

          {/* All Requests Section */}
          {filteredRequests && filteredRequests.length > 0 && (
            <>
              {hasBuilderProfile && forYouRequests && forYouRequests.length > 0 && (
                <View className="px-6 mb-3">
                  <Text
                    className="text-lg text-black"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {selectedCategory === 'all' ? 'all requests' : selectedCategory}
                  </Text>
                </View>
              )}
              {filteredRequests.map((request) => (
                <TouchableOpacity
                  key={request._id}
                  onPress={() => handleRequestPress(request._id)}
                  className="mx-6 mb-4 p-4 bg-gray-50 rounded-2xl"
                  activeOpacity={0.7}
                >
                  {/* Author Row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      {request.author?.photos?.[0] ? (
                        <Image
                          source={{ uri: request.author.photos[0] }}
                          className="w-10 h-10 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                      )}
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
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {formatTime(request.createdAt)}
                    </Text>
                  </View>

                  {/* Title */}
                  <View className="flex-row items-center mb-2">
                    <Text
                      className="text-black text-lg flex-1"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {request.title}
                    </Text>
                    {request.isUrgent && (
                      <Ionicons name="warning" size={22} color="#DC2626" style={{ marginLeft: 6 }} />
                    )}
                  </View>

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
                      <View className="bg-gray-200 px-3 py-1 rounded-full">
                        <Text
                          className="text-gray-700"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.category}
                        </Text>
                      </View>
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
                </TouchableOpacity>
              ))}
            </>
          )}
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
