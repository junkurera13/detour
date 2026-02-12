import { View, Text, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator, Dimensions, Alert, Modal, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useMemo, useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { computeCompatibility } from '@/utils/compatibility';
import { CompatibilityBadge } from '@/components/ui/CompatibilityBadge';

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

const setupLabels: Record<string, { label: string; emoji: string }> = {
  'converted-van': { label: 'converted van', emoji: '🚐' },
  'suv-car': { label: 'suv / car', emoji: '🚗' },
  'truck-camper': { label: 'truck camper', emoji: '🛻' },
  'rv-motorhome': { label: 'rv / motorhome', emoji: '🏕️' },
  'trailer': { label: 'trailer', emoji: '🏠' },
  'bike-motorcycle': { label: 'bike / motorcycle', emoji: '🏍️' },
  'on-foot': { label: 'on foot', emoji: '🥾' },
  'boat-sailboat': { label: 'boat / sailboat', emoji: '⛵' },
  'no-vehicle': { label: 'no vehicle', emoji: '✈️' },
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
  const { convexUser: currentUser } = useAuthenticatedUser();
  // Fetch from Convex
  const convexUser = useQuery(
    api.users.getById,
    userId ? { id: userId as Id<"users"> } : "skip"
  );

  // Check if already matched with this user
  const myMatches = useQuery(
    api.matches.getByUser,
    currentUser?._id ? {} : "skip"
  );
  const isAlreadyMatched = useMemo(() => {
    if (!myMatches || !userId) return false;
    return myMatches.some((m) => m.otherUser?._id === userId);
  }, [myMatches, userId]);

  // Record profile view
  const recordView = useMutation(api.profileViews.record);
  useEffect(() => {
    if (userId) {
      recordView({ viewedId: userId as Id<"users"> }).catch((e) => console.warn('Failed to record profile view:', e));
    }
  }, [userId, recordView]);

  // Normalize data to match own profile page structure
  const profileData = useMemo(() => {
    if (convexUser) {
      return {
        name: convexUser.name,
        age: calculateAge(convexUser.birthday),
        username: convexUser.username,
        photos: convexUser.photos,
        currentLocation: convexUser.currentLocation,
        latitude: convexUser.latitude,
        longitude: convexUser.longitude,
        instagram: convexUser.instagram,
        lifestyle: convexUser.lifestyle,
        rigType: convexUser.rigType,
        rigName: convexUser.rigName,
        interests: convexUser.interests,
        futureTrips: convexUser.futureTrips || (convexUser.futureTrip ? [{ location: convexUser.futureTrip }] : []),
        pets: convexUser.pets || [],
        datingGoals: convexUser.datingGoals || [],
      };
    }
    return null;
  }, [convexUser]);

  const compatibilityResult = useMemo(() => {
    if (!currentUser || !profileData) return null;
    return computeCompatibility(currentUser, {
      interests: profileData.interests,
      currentLocation: profileData.currentLocation,
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      futureTrips: profileData.futureTrips,
      lifestyle: profileData.lifestyle,
      pets: profileData.pets,
      datingGoals: profileData.datingGoals,
    });
  }, [currentUser, profileData]);

  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'builder'>('about');
  const [menuVisible, setMenuVisible] = useState(false);
  const menuSlideAnim = useRef(new Animated.Value(400)).current;

  // Crossing paths detection
  const crossingPath = useMemo(() => {
    if (!currentUser || !profileData) return null;
    const myTrips = currentUser.futureTrips || [];
    const theirTrips = profileData.futureTrips || [];
    if (myTrips.length === 0 || theirTrips.length === 0) return null;
    const myCities = myTrips.map((t: { location: string }) => t.location.split(',')[0].trim().toLowerCase());
    for (const trip of theirTrips) {
      const city = trip.location.split(',')[0].trim().toLowerCase();
      if (myCities.includes(city)) {
        return trip.location.split(',')[0].trim();
      }
    }
    return null;
  }, [currentUser, profileData]);
  const blockUser = useMutation(api.blocks.blockUser);
  const reportUser = useMutation(api.reports.create);
  const createSwipe = useMutation(api.swipes.create);
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (!currentUser || !userId || liked || likeLoading) return;
    setLikeLoading(true);
    try {
      const result = await createSwipe({
        swipedId: userId as Id<"users">,
        action: 'like',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLiked(true);
      if (result.isMatch) {
        Alert.alert('it\'s a match!', `you and ${profileData?.name || 'this person'} liked each other.`, [
          { text: 'ok', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch {
      // Already swiped or other error — go back
      router.back();
    } finally {
      setLikeLoading(false);
    }
  };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuSlideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => setMenuVisible(false));
  };

  const handleBlock = () => {
    closeMenu();
    Alert.alert('block user?', `${profileData?.name || 'this user'} won't be able to see your profile or message you.`, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'block',
        style: 'destructive',
        onPress: async () => {
          if (!currentUser || !userId) return;
          try {
            await blockUser({ blockedId: userId as Id<"users"> });
            router.back();
          } catch {
            Alert.alert('error', 'failed to block user');
          }
        },
      },
    ]);
  };

  const handleReport = () => {
    closeMenu();
    Alert.alert('report and block this user?', 'this will report them for review and block them.', [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'report & block',
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          try {
            await reportUser({ reportedId: userId as Id<"users">, reason: 'reported from profile' });
            Alert.alert('reported', 'thanks for letting us know. this user has been blocked.');
            router.back();
          } catch {
            Alert.alert('reported', 'thanks for letting us know. this user has been blocked.');
          }
        },
      },
    ]);
  };

  // Fetch events this user is hosting or attending from Convex
  const userEventsQuery = useQuery(
    api.activities.getByUserId,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  const userEvents = userEventsQuery || [];

  if (!profileData) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-4 pb-6 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
        >
          profile
        </Text>
        <TouchableOpacity
          onPress={openMenu}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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

          <View className="flex-row items-center mt-4">
            <Text
              className="text-2xl text-black"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              {profileData.name.toLowerCase()}, {profileData.age}
            </Text>
            {compatibilityResult != null && (
              <View style={{ marginLeft: 8 }}>
                <CompatibilityBadge score={compatibilityResult.score} size="md" breakdown={compatibilityResult.breakdown} />
              </View>
            )}
          </View>

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

          {crossingPath && (
            <View className="flex-row items-center mt-3 bg-orange-50 px-4 py-2 rounded-full">
              <Ionicons name="git-compare-outline" size={16} color="#EA580C" />
              <Text
                className="text-orange-600 ml-2"
                style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 13 }}
              >
                crossing paths in {crossingPath}
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
                    key={activity._id}
                    className="flex-row items-center py-3 border-b border-gray-50"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/event/${activity._id}`)}
                  >
                    {activity.image ? (
                      <Image
                        source={{ uri: activity.image }}
                        className="w-14 h-14 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-xl bg-orange-100 items-center justify-center">
                        <Ionicons name="calendar" size={24} color="#EA580C" />
                      </View>
                    )}
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
                          {(() => {
                            const d = new Date(trip.startDate);
                            return !isNaN(d.getTime())
                              ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : trip.startDate;
                          })()}
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

        {/* Setup */}
        {profileData.rigType && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              setup
            </Text>
            <View className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center self-start">
              <Text className="mr-1">{setupLabels[profileData.rigType]?.emoji}</Text>
              <Text
                className="text-gray-700"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {setupLabels[profileData.rigType]?.label || profileData.rigType}
              </Text>
            </View>
            {profileData.rigName ? (
              <Text
                className="text-gray-500 mt-2"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                &ldquo;{profileData.rigName}&rdquo;
              </Text>
            ) : null}
          </View>
        )}

        {/* Travelling with (pets) */}
        <View className="px-6 mb-6">
          <Text
            className="text-lg text-black mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            travelling with
          </Text>
          {profileData.pets.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {profileData.pets.map((pet, index) => {
                const emojiMap: Record<string, string> = { dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐰', fish: '🐟', reptile: '🦎' };
                return (
                  <View key={index} className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center">
                    <Text className="mr-1">{emojiMap[pet.type] || '🐾'}</Text>
                    <Text
                      className="text-gray-700"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {pet.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              no pets
            </Text>
          )}
        </View>

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

      {/* Report / Block menu */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeMenu} />
          <Animated.View
            style={{ transform: [{ translateY: menuSlideAnim }] }}
            className="bg-white rounded-t-3xl px-6 pb-10 pt-4"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 bg-gray-50 rounded-t-2xl border-b border-gray-100"
              activeOpacity={0.7}
              onPress={handleReport}
            >
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Ionicons name="flag-outline" size={20} color="#000" />
              </View>
              <Text
                className="flex-1 text-black ml-3"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                report
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 bg-gray-50 rounded-b-2xl"
              activeOpacity={0.7}
              onPress={handleBlock}
            >
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Ionicons name="ban-outline" size={20} color="#EF4444" />
              </View>
              <Text
                className="flex-1 text-red-500 ml-3"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                block
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Floating like button — matches nearby page style */}
      {!isAlreadyMatched && <TouchableOpacity
        onPress={handleLike}
        disabled={liked || likeLoading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Like this person"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#fd6b03',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        {likeLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="heart" size={32} color="#fff" />
        )}
      </TouchableOpacity>}
    </SafeAreaView>
  );
}
