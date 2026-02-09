import { View, Text, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { mockUsers, mockActivities } from '@/data/mockData';
import { useMemo, useState } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 8) / 2; // px-6 padding (48) + gap (8)

const lifestyleLabels: Record<string, string> = {
  'van-life': 'van life',
  'backpacker': 'backpacker',
  'digital-nomad': 'digital nomad',
  'rv-life': 'rv life',
  'boat-life': 'boat life',
  'house-sitting': 'house sitting',
  'slow-travel': 'slow travel',
  'perpetual-traveler': 'perpetual traveler',
  'seasonal-worker': 'seasonal worker',
  'expat': 'expat',
  'hostel-hopper': 'hostel hopper',
  'workaway': 'workaway',
};

const interestLabels: Record<string, { label: string; emoji: string }> = {
  'hiking': { label: 'hiking', emoji: '🥾' },
  'photography': { label: 'photography', emoji: '📸' },
  'surfing': { label: 'surfing', emoji: '🏄' },
  'yoga': { label: 'yoga', emoji: '🧘' },
  'coffee': { label: 'coffee', emoji: '☕' },
  'cooking': { label: 'cooking', emoji: '👨‍🍳' },
  'music': { label: 'music', emoji: '🎵' },
  'reading': { label: 'reading', emoji: '📚' },
  'diving': { label: 'diving', emoji: '🤿' },
  'climbing': { label: 'climbing', emoji: '🧗' },
  'camping': { label: 'camping', emoji: '⛺' },
  'languages': { label: 'languages', emoji: '🗣️' },
  'art': { label: 'art', emoji: '🎨' },
  'writing': { label: 'writing', emoji: '✍️' },
  'fitness': { label: 'fitness', emoji: '💪' },
  'gaming': { label: 'gaming', emoji: '🎮' },
  'wine': { label: 'wine', emoji: '🍷' },
  'nightlife': { label: 'nightlife', emoji: '🌃' },
  'sustainability': { label: 'sustainability', emoji: '♻️' },
  'meditation': { label: 'meditation', emoji: '🧠' },
  'remote-work': { label: 'remote work', emoji: '💼' },
  'coworking': { label: 'coworking', emoji: '🏢' },
  'movies': { label: 'movies', emoji: '🎬' },
  'food': { label: 'food', emoji: '🍜' },
  'design': { label: 'design', emoji: '🎨' },
};

// Generate deterministic trip dates from user id
function getMockTripDate(userId: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  const month = ((Math.abs(hash + index * 7) % 4) + 2); // Feb-May
  const day = (Math.abs(hash + index * 13) % 28) + 1;
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  return `${months[month]} ${day}`;
}

function getMockTripEndDate(userId: string, index: number): string | undefined {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 3) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  // ~60% of trips have an end date
  if (Math.abs(hash + index) % 5 < 2) return undefined;
  const month = ((Math.abs(hash + index * 11) % 4) + 3); // Mar-Jun
  const day = (Math.abs(hash + index * 17) % 28) + 1;
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return `${months[month]} ${day}`;
}

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  // Try fetching from Convex (real user)
  const isMockUser = userId?.startsWith('user_');
  const convexUser = useQuery(
    api.users.getById,
    !isMockUser && userId ? { id: userId as Id<"users"> } : "skip"
  );

  // Find mock user if applicable
  const mockUser = isMockUser ? mockUsers.find((u) => u.id === userId) : null;

  // Normalize data to match own profile page structure
  const profileData = useMemo(() => {
    if (convexUser) {
      return {
        name: convexUser.name,
        age: calculateAge(convexUser.birthday),
        username: convexUser.username,
        photos: convexUser.photos,
        currentLocation: convexUser.currentLocation,
        instagram: convexUser.instagram,
        lifestyle: convexUser.lifestyle,
        interests: convexUser.interests,
        futureTrips: convexUser.futureTrips || (convexUser.futureTrip ? [{ location: convexUser.futureTrip }] : []),
      };
    }
    if (mockUser) {
      return {
        name: mockUser.name,
        age: mockUser.age,
        username: undefined,
        photos: mockUser.photos,
        currentLocation: mockUser.location,
        instagram: mockUser.instagram,
        lifestyle: mockUser.lifestyle,
        interests: mockUser.interests,
        futureTrips: mockUser.futureTrip ? [{ location: mockUser.futureTrip, startDate: getMockTripDate(mockUser.id, 0), endDate: getMockTripEndDate(mockUser.id, 0) }] : [],
      };
    }
    return null;
  }, [convexUser, mockUser]);

  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'builder'>('about');

  // Get events this user is attending or hosting (deterministic based on name)
  const userEvents = useMemo(() => {
    if (!profileData) return [];
    const name = profileData.name.toLowerCase();
    // Include events they host
    const hosted = mockActivities.filter(a => a.host.name.toLowerCase() === name);
    // Deterministically assign some events based on name hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash |= 0;
    }
    const start = Math.abs(hash) % mockActivities.length;
    const count = 1 + (Math.abs(hash) % 3); // 1-3 extra events
    const attending: typeof mockActivities = [];
    for (let i = 0; i < count; i++) {
      const act = mockActivities[(start + i) % mockActivities.length];
      if (!hosted.some(h => h.id === act.id)) {
        attending.push(act);
      }
    }
    return [...hosted, ...attending];
  }, [profileData]);

  if (!profileData) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-4 pb-6 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
          <Text
            className="text-gray-400 mt-4"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header — back button + name */}
      <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
        >
          profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Photo + Info (centered, same as own profile) */}
        <View className="px-6 pb-6 items-center">
          <View className="relative">
            {profileData.photos.length > 0 ? (
              <Image
                source={{ uri: profileData.photos[0] }}
                className="w-28 h-28 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
            )}
          </View>

          <Text
            className="text-2xl text-black mt-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {profileData.name.toLowerCase()}, {profileData.age}
          </Text>

          {profileData.username && (
            <Text
              className="text-gray-500 mt-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              @{profileData.username}
            </Text>
          )}

          {profileData.instagram && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="logo-instagram" size={16} color="#E4405F" />
              <Text
                className="text-gray-700 ml-1"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {profileData.instagram}
              </Text>
            </View>
          )}
        </View>

        {/* Tab Toggle */}
        <View className="px-6 mb-6">
          <View className="flex-row bg-gray-100 rounded-full p-1">
            {(['about', 'events', 'builder'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-full items-center"
                style={{ backgroundColor: activeTab === tab ? '#fff' : 'transparent' }}
              >
                <Text
                  className={activeTab === tab ? 'text-black' : 'text-gray-400'}
                  style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 13 }}
                >
                  {tab === 'builder' ? 'builder' : tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === 'events' ? (
          <View className="px-6 mb-6">
            {userEvents.length > 0 ? (
              userEvents.map((activity) => {
                const isHost = activity.host.name.toLowerCase() === profileData.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={activity.id}
                    className="flex-row items-center py-3 border-b border-gray-50"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/event/${activity.id}` as any)}
                  >
                    <Image
                      source={{ uri: activity.image }}
                      className="w-14 h-14 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className="text-black"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          numberOfLines={1}
                        >
                          {activity.title}
                        </Text>
                        {isHost && (
                          <View className="bg-orange-100 rounded-full px-2 py-0.5 ml-2">
                            <Text
                              className="text-orange-600 text-xs"
                              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                            >
                              host
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-gray-500 text-sm"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {activity.date} at {activity.time}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                        <Text
                          className="text-gray-400 text-xs ml-1"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          {activity.location}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="items-center py-12">
                <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
                <Text
                  className="text-gray-400 mt-4 text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  no upcoming events
                </Text>
              </View>
            )}
          </View>
        ) : activeTab === 'builder' ? (
          <View className="px-6 mb-6">
            <View className="items-center py-12">
              <Ionicons name="hammer-outline" size={48} color="#E5E7EB" />
              <Text
                className="text-gray-400 mt-4 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                no builder activity yet
              </Text>
            </View>
          </View>
        ) : (
        <>
        {/* Journey Route (read-only, same card style as own profile) */}
        <View className="px-6 mb-6">
          <View
            className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            <View className="p-5">
              {/* Current location */}
              <View className="flex-row items-center mb-1">
                <View className="items-center" style={{ width: 40 }}>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#111827' }}
                  >
                    <Ionicons name="navigate" size={18} color="#fff" />
                  </View>
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="text-xs text-gray-400 uppercase"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    now
                  </Text>
                  <Text
                    className="text-black text-lg"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {profileData.currentLocation || 'location not set'}
                  </Text>
                </View>
              </View>

              {/* Future trips */}
              {profileData.futureTrips.map((trip, index) => (
                <View key={index}>
                  <View className="items-center" style={{ width: 40, paddingVertical: 2 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        className="w-1 rounded-full my-0.5"
                        style={{ height: 4, backgroundColor: '#FDBA74' }}
                      />
                    ))}
                  </View>
                  <View className="flex-row items-center">
                    <View className="items-center" style={{ width: 40 }}>
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#FED7AA' }}
                      >
                        <Ionicons name="airplane" size={18} color="#EA580C" />
                      </View>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-xs text-gray-400 uppercase"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        next{index > 0 ? ` +${index}` : ''}
                      </Text>
                      <Text
                        className="text-black text-lg"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        numberOfLines={1}
                      >
                        {trip.location.split(',')[0]}
                      </Text>
                      {trip.startDate && (
                        <Text
                          className="text-xs text-gray-400 mt-0.5"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Lifestyle tags (same as own profile) */}
        {profileData.lifestyle.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              lifestyle
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profileData.lifestyle.map((style) => (
                <View key={style} className="bg-gray-100 px-3 py-2 rounded-full">
                  <Text
                    className="text-gray-700"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {lifestyleLabels[style] || style}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests tags with emojis (same as own profile) */}
        {profileData.interests.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              interests
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profileData.interests.map((interest) => {
                const info = interestLabels[interest];
                return (
                  <View key={interest} className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center">
                    {info && <Text className="mr-1">{info.emoji}</Text>}
                    <Text
                      className="text-gray-700"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {info?.label || interest}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Extra photos */}
        {profileData.photos.length > 1 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              photos
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profileData.photos.slice(1).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        )}
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
