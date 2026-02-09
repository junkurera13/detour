import { View, Text, ScrollView, Image, TouchableOpacity, Modal, Animated, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { mockProfileViewers, mockActivities } from '@/data/mockData';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { useEvents } from '@/context/EventsContext';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';

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
};

const helpCategoryLabels: Record<string, { label: string; emoji: string }> = {
  'repairs': { label: 'repairs', emoji: '🔧' },
  'electrical': { label: 'electrical', emoji: '⚡' },
  'build': { label: 'build', emoji: '🪚' },
  'plumbing': { label: 'plumbing', emoji: '🚿' },
  'other': { label: 'other', emoji: '📦' },
};

const settingsItems = [
  { id: 'edit', label: 'edit profile', icon: 'create-outline' },
  { id: 'settings', label: 'settings', icon: 'settings-outline' },
  { id: 'privacy', label: 'privacy', icon: 'shield-outline' },
  { id: 'help', label: 'help & support', icon: 'help-circle-outline' },
  { id: 'subscription', label: 'manage subscription', icon: 'card-outline' },
];

// Use mock profile viewers from centralized data
const recentViewers = mockProfileViewers.slice(0, 4).map(user => ({
  id: user.id,
  photo: user.photos[0],
  name: user.name,
}));

export default function ProfileScreen() {
  const { data: onboardingData } = useOnboarding();
  const { convexUser: user, convexAuthenticated } = useAuthenticatedUser();
  const { openCustomerCenter } = useRevenueCat();
  const router = useRouter();
  const builderStats = useQuery(api.helpRequests.getBuilderStats, convexAuthenticated ? {} : "skip");
  const updateUser = useMutation(api.users.update);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'builder'>('about');
  const { joinedIds } = useEvents();
  const myEvents = useMemo(() => mockActivities.filter(a => joinedIds.includes(a.id)), [joinedIds]);
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [editingStopText, setEditingStopText] = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Use Convex user data if available, fallback to onboarding data
  const profileData = useMemo(() => {
    if (user) {
      return {
        name: user.name,
        username: user.username,
        photos: user.photos,
        currentLocation: user.currentLocation,
        instagram: user.instagram,
        lifestyle: user.lifestyle,
        interests: user.interests,
        futureTrips: user.futureTrips || [],
      };
    }
    return {
      name: onboardingData.name,
      username: onboardingData.username,
      photos: onboardingData.photos,
      currentLocation: onboardingData.currentLocation,
      instagram: onboardingData.instagram,
      lifestyle: onboardingData.lifestyle,
      interests: onboardingData.interests,
      futureTrips: onboardingData.futureTrips || [],
    };
  }, [user, onboardingData]);

  useEffect(() => {
    if (menuVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [menuVisible, slideAnim]);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const handleSettingsAction = async (id: string) => {
    closeMenu();
    if (id === 'subscription') {
      await openCustomerCenter();
    } else if (id === 'settings') {
      router.push('/settings' as any);
    } else if (id === 'edit') {
      router.push('/edit-profile' as any);
    }
  };

  const handleSaveStop = async (index: number) => {
    if (!user) return;
    const text = editingStopText.trim();
    const currentTrips = [...profileData.futureTrips];
    if (text) {
      if (index < currentTrips.length) {
        currentTrips[index] = { ...currentTrips[index], location: text };
      } else {
        currentTrips.push({ location: text });
      }
    } else if (index < currentTrips.length) {
      currentTrips.splice(index, 1);
    }
    try {
      await updateUser({
        id: user._id,
        futureTrips: currentTrips.length > 0 ? currentTrips : undefined,
      });
    } catch {
      Alert.alert('error', 'failed to update trip');
    }
    setEditingStopIndex(null);
    setEditingStopText('');
  };

  const handleRemoveStop = async (index: number) => {
    if (!user) return;
    const currentTrips = [...profileData.futureTrips];
    currentTrips.splice(index, 1);
    try {
      await updateUser({
        id: user._id,
        futureTrips: currentTrips.length > 0 ? currentTrips : undefined,
      });
    } catch {
      Alert.alert('error', 'failed to remove trip');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
        >
          profile
        </Text>
        <View className="flex-row items-center gap-3" style={{ marginTop: -8 }}>
          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-full px-2 py-1">
            {recentViewers.map((viewer, index) => (
              <Image
                key={viewer.id}
                source={{ uri: viewer.photo }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#F3F4F6',
                  marginLeft: index > 0 ? -8 : 0,
                }}
              />
            ))}
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
            <TouchableOpacity className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-3 border-white" style={{ backgroundColor: '#fd6b03' }}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text
            className="text-2xl text-black mt-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {profileData.name.toLowerCase() || 'your name'}
          </Text>

          {profileData.username && (
            <Text
              className="text-gray-500 mt-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              @{profileData.username}
            </Text>
          )}

          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
            <Text
              className="text-gray-500 ml-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {profileData.currentLocation || 'location not set'}
            </Text>
          </View>

          {profileData.instagram && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="logo-instagram" size={16} color="#E4405F" />
              <Text
                className="text-gray-700 ml-1"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                @{profileData.instagram}
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
            {myEvents.length > 0 ? (
              myEvents.map((activity) => {
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
        ) : activeTab === 'about' ? (
          <>
            {/* Journey Route */}
            <View className="px-6 mb-6">
              <View
                className="rounded-3xl overflow-hidden"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <View className="p-5">
                  <View className="flex-row items-center mb-1">
                    <View className="items-center" style={{ width: 32 }}>
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#111827' }}
                      >
                        <Ionicons name="navigate" size={16} color="#fff" />
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
                        className="text-black text-base"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        numberOfLines={1}
                      >
                        {profileData.currentLocation || 'location not set'}
                      </Text>
                    </View>
                  </View>
                  <View className="items-center" style={{ width: 32, paddingVertical: 2 }}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        className="w-1 rounded-full my-0.5"
                        style={{ height: 4, backgroundColor: '#FDBA74' }}
                      />
                    ))}
                  </View>
                  {profileData.futureTrips.map((trip, index) => (
                    <View key={index}>
                      <View className="flex-row items-center">
                        <View className="items-center" style={{ width: 32 }}>
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: '#FED7AA' }}
                          >
                            <Ionicons name="airplane" size={14} color="#EA580C" />
                          </View>
                        </View>
                        {editingStopIndex === index ? (
                          <View className="ml-3 flex-1 flex-row items-center">
                            <View className="flex-1">
                              <LocationAutocomplete
                                value={editingStopText}
                                placeholder="search for a city..."
                                onSelect={(location) => {
                                  setEditingStopText(location.fullName);
                                  handleSaveStop(index);
                                }}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                handleRemoveStop(index);
                                setEditingStopIndex(null);
                                setEditingStopText('');
                              }}
                              className="ml-2 p-1"
                            >
                              <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            className="ml-3 flex-1 flex-row items-center justify-between"
                            onPress={() => {
                              setEditingStopIndex(index);
                              setEditingStopText(trip.location);
                            }}
                            onLongPress={() => {
                              Alert.alert('remove stop?', trip.location, [
                                { text: 'cancel', style: 'cancel' },
                                { text: 'remove', style: 'destructive', onPress: () => handleRemoveStop(index) },
                              ]);
                            }}
                          >
                            <View className="flex-1">
                              <Text
                                className="text-xs text-gray-400 uppercase"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                              >
                                next{index > 0 ? ` +${index}` : ''}
                              </Text>
                              <Text
                                className="text-black text-base"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                numberOfLines={1}
                              >
                                {trip.location.split(',')[0]}
                              </Text>
                            </View>
                            <Ionicons name="pencil" size={14} color="#D1D5DB" />
                          </TouchableOpacity>
                        )}
                      </View>
                      {index < profileData.futureTrips.length - 1 && (
                        <View className="items-center" style={{ width: 32, paddingVertical: 2 }}>
                          {[0, 1, 2].map((i) => (
                            <View
                              key={i}
                              className="w-1 rounded-full my-0.5"
                              style={{ height: 4, backgroundColor: '#FDBA74' }}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                  {profileData.futureTrips.length < 5 && (
                    <>
                      <View className="items-center" style={{ width: 32, paddingVertical: 2 }}>
                        {[0, 1, 2].map((i) => (
                          <View
                            key={i}
                            className="w-1 rounded-full my-0.5"
                            style={{ height: 4, backgroundColor: '#FDBA74' }}
                          />
                        ))}
                      </View>
                      {editingStopIndex === profileData.futureTrips.length ? (
                        <View className="flex-row items-center">
                          <View className="items-center" style={{ width: 32 }}>
                            <View
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed' }}
                            >
                              <Ionicons name="add" size={16} color="#9CA3AF" />
                            </View>
                          </View>
                          <View className="ml-3 flex-1" style={{ zIndex: 10 }}>
                            <LocationAutocomplete
                              value={editingStopText}
                              placeholder="search for a city..."
                              onSelect={(location) => {
                                setEditingStopText(location.fullName);
                                handleSaveStop(profileData.futureTrips.length);
                              }}
                            />
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          className="flex-row items-center"
                          onPress={() => {
                            setEditingStopIndex(profileData.futureTrips.length);
                            setEditingStopText('');
                          }}
                        >
                          <View className="items-center" style={{ width: 32 }}>
                            <View
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed' }}
                            >
                              <Ionicons name="add" size={16} color="#9CA3AF" />
                            </View>
                          </View>
                          <Text
                            className="ml-3 text-gray-400 text-sm"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            add a stop
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

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
          </>
        ) : (
          <>
            {/* Builder Profile - Help Activity */}
            <View className="px-6 mb-6">
              {builderStats ? (
                <View className="bg-gray-50 rounded-3xl p-5">
                  {/* Bio */}
                  {user?.builderBio && (
                    <View className="mb-5">
                      <Text
                        className="text-black text-base"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        {`\u201C${user.builderBio}\u201D`}
                      </Text>
                    </View>
                  )}

                  {/* Specialties */}
                  {builderStats.specialties.length > 0 && (
                    <View className="mb-5">
                      <Text
                        className="text-sm text-gray-500 mb-2"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        specialties
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {builderStats.specialties.map((cat) => {
                          const info = helpCategoryLabels[cat];
                          return (
                            <View key={cat} className="bg-white px-3 py-2 rounded-full flex-row items-center">
                              {info && <Text className="mr-1.5">{info.emoji}</Text>}
                              <Text
                                className="text-black text-sm"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                              >
                                {info?.label || cat}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Stats grid */}
                  <View className="flex-row mb-5">
                    <View className="flex-1 items-center py-3 bg-white rounded-2xl mr-2">
                      <Text
                        className="text-2xl text-black"
                        style={{ fontFamily: 'InstrumentSans_700Bold' }}
                      >
                        {builderStats.completedRequests}
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        completed
                      </Text>
                    </View>
                    <View className="flex-1 items-center py-3 bg-white rounded-2xl">
                      <Text
                        className="text-2xl text-black"
                        style={{ fontFamily: 'InstrumentSans_700Bold' }}
                      >
                        {builderStats.totalRequests}
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        requests
                      </Text>
                    </View>
                  </View>

                  {/* Current help requests */}
                  {builderStats.activeRequests.length > 0 && (
                    <View>
                      <Text
                        className="text-sm text-gray-500 mb-2"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        current requests
                      </Text>
                      {builderStats.activeRequests.map((req) => {
                        const catInfo = helpCategoryLabels[req.category];
                        return (
                          <View
                            key={req._id}
                            className="bg-white rounded-2xl p-3 mb-2 flex-row items-center"
                          >
                            <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                              <Text>{catInfo?.emoji || '📦'}</Text>
                            </View>
                            <View className="flex-1">
                              <Text
                                className="text-black text-sm"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                numberOfLines={1}
                              >
                                {req.title}
                              </Text>
                              <Text
                                className="text-gray-400 text-xs"
                                style={{ fontFamily: 'InstrumentSans_400Regular' }}
                              >
                                {req.status === 'open' ? 'open' : 'in progress'}
                              </Text>
                            </View>
                            {req.isUrgent && (
                              <View className="bg-red-100 px-2 py-1 rounded-full">
                                <Text
                                  className="text-red-600 text-xs"
                                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                >
                                  urgent
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Empty state for no active requests */}
                  {builderStats.activeRequests.length === 0 && builderStats.totalRequests === 0 && (
                    <View className="items-center py-4">
                      <Ionicons name="hammer-outline" size={32} color="#D1D5DB" />
                      <Text
                        className="text-gray-400 text-sm mt-2 text-center"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        no help activity yet
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="bg-gray-50 rounded-3xl p-5 items-center py-8">
                  <Ionicons name="hammer-outline" size={32} color="#D1D5DB" />
                  <Text
                    className="text-gray-400 text-sm mt-2 text-center"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    no help activity yet
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={closeMenu}
          />
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="bg-white rounded-t-3xl px-6 pb-10 pt-4"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

            <View className="bg-gray-50 rounded-2xl overflow-hidden">
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  className={`flex-row items-center px-4 py-4 ${
                    index < settingsItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                  onPress={() => handleSettingsAction(item.id)}
                >
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                    <Ionicons name={item.icon as any} size={20} color="#000" />
                  </View>
                  <Text
                    className="flex-1 text-black ml-3"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
