import { View, Text, ScrollView, Image, TouchableOpacity, Modal, Animated, Alert, Platform, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { mockActivities } from '@/data/mockData';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { isDemoUser } from '@/utils/isDemoUser';
import { useEvents } from '@/context/EventsContext';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';

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

// Format a Date to a short display string like "Mar 15"
function formatDateShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Format a trip date string (ISO or short like "Mar 15") to "Feb 14"
function formatTripDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateStr;
}

// Parse a short date string like "Mar 15" back to a Date
function parseDateShort(str: string): Date | null {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = str.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const month = months[parts[0]];
  const day = parseInt(parts[1], 10);
  if (month === undefined || isNaN(day)) return null;
  const year = new Date().getFullYear();
  return new Date(year, month, day);
}

function parseTripDate(str?: string): Date | null {
  if (!str) return null;
  const value = str.trim();
  if (!value) return null;

  const short = parseDateShort(value);
  if (short) return short;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
  'solar': { label: 'solar', emoji: '☀️' },
  'insulation': { label: 'insulation', emoji: '🧱' },
  'water-systems': { label: 'water systems', emoji: '💧' },
  'flooring': { label: 'flooring', emoji: '🪵' },
  'cabinetry': { label: 'cabinetry', emoji: '🗄️' },
  'windows-ventilation': { label: 'windows & ventilation', emoji: '🪟' },
  'other': { label: 'other', emoji: '📦' },
};

const settingsItems = [
  { id: 'edit', label: 'edit profile', icon: 'create-outline' },
  { id: 'settings', label: 'settings', icon: 'settings-outline' },
  { id: 'privacy', label: 'privacy', icon: 'shield-outline' },
  { id: 'help', label: 'help & support', icon: 'help-circle-outline' },
  { id: 'subscription', label: 'manage subscription', icon: 'card-outline' },
];

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ProfileScreen() {
  const { data: onboardingData } = useOnboarding();
  const { convexUser: user, convexAuthenticated } = useAuthenticatedUser();
  const { openCustomerCenter } = useRevenueCat();
  const router = useRouter();
  const builderStats = useQuery(api.helpRequests.getBuilderStats, convexAuthenticated ? {} : "skip");
  const updateUser = useMutation(api.users.update);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'builder'>('about');
  const isDemo = isDemoUser(user?.email);
  const { joinedIds } = useEvents();
  const myEvents = useMemo(() => {
    if (isDemo) return mockActivities.filter(a => joinedIds.includes(a.id));
    return [];
  }, [joinedIds, isDemo]);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [editingStopText, setEditingStopText] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'start' | 'end' } | null>(null);
  const [editingBuilder, setEditingBuilder] = useState(false);
  const [editBuilderBio, setEditBuilderBio] = useState('');
  const [editBuilderSpecialties, setEditBuilderSpecialties] = useState<string[]>([]);
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const profileViewers = useQuery(api.profileViews.getRecentViewers, convexAuthenticated ? {} : "skip");
  const slideAnim = useRef(new Animated.Value(400)).current;
  const viewersSlideAnim = useRef(new Animated.Value(400)).current;

  // Compute age from whichever source is available
  const age = useMemo(() => {
    if (user?.birthday) return calculateAge(user.birthday);
    const bday = onboardingData.birthday;
    if (bday) return calculateAge(bday instanceof Date ? bday.toISOString() : bday);
    return null;
  }, [user?.birthday, onboardingData.birthday]);

  // Use Convex user data if available, fallback to onboarding data
  const profileData = useMemo(() => {
    if (user) {
      return {
        name: user.name,
        age,
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
      age,
      username: onboardingData.username,
      photos: onboardingData.photos,
      currentLocation: onboardingData.currentLocation,
      instagram: onboardingData.instagram,
      lifestyle: onboardingData.lifestyle,
      interests: onboardingData.interests,
      futureTrips: onboardingData.futureTrips || [],
    };
  }, [user, onboardingData, age]);

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

  const handleShareProfile = async () => {
    const name = profileData.name || 'a detour user';
    const location = profileData.currentLocation ? ` currently in ${profileData.currentLocation}` : '';
    const username = profileData.username ? ` (@${profileData.username})` : '';
    const trips = profileData.futureTrips.length > 0
      ? `\nnext stop: ${profileData.futureTrips[0].location}`
      : '';

    try {
      await Share.share({
        message: `check out ${name}${username} on detour${location}${trips}\n\nhttps://detour.app`,
      });
    } catch {
      // user cancelled or share failed — no action needed
    }
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

  // Build a clean trip array with only schema-valid fields: location, startDate.
  // Convex v.object() is strict — extra keys cause validation failures.
  const buildCleanTrips = () =>
    profileData.futureTrips.map((t) => {
      const trip: { location: string; startDate?: string } = {
        location: t.location,
      };
      if (t.startDate) trip.startDate = t.startDate;
      return trip;
    });

  const handleSaveStopLocation = async (index: number, locationText: string) => {
    if (!user) return;
    const text = locationText.trim();
    if (!text) return;
    const trips = buildCleanTrips();
    if (index < trips.length) {
      trips[index].location = text;
    } else {
      trips.push({ location: text });
    }
    try {
      await updateUser({ id: user._id, futureTrips: trips });
    } catch (e) {
      console.error('handleSaveStopLocation:', e);
      Alert.alert('error', 'failed to update trip');
    }
    setEditingLocationIndex(null);
    setEditingStopText('');
  };

  const handleSaveStopDate = async (index: number, _field: 'start' | 'end', date: Date) => {
    if (!user || index >= profileData.futureTrips.length) return;
    const trips = buildCleanTrips();
    trips[index].startDate = formatDateShort(date);
    try {
      await updateUser({ id: user._id, futureTrips: trips });
    } catch (e) {
      console.error('handleSaveStopDate:', e);
      Alert.alert('error', 'failed to update date');
    }
  };

  const handleRemoveStop = async (index: number) => {
    if (!user) return;
    const trips = buildCleanTrips();
    trips.splice(index, 1);
    try {
      await updateUser({ id: user._id, futureTrips: trips });
    } catch (e) {
      console.error('handleRemoveStop:', e);
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
          {profileViewers && profileViewers.length > 0 ? (
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 rounded-full px-2 py-1"
              onPress={() => {
                setViewersModalVisible(true);
                Animated.spring(viewersSlideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 65,
                  friction: 11,
                }).start();
              }}
            >
              {profileViewers.slice(0, 4).map((viewer, index) => (
                <Image
                  key={viewer!._id}
                  source={{ uri: viewer!.photos[0] }}
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
          ) : (
            <Ionicons name="footsteps-outline" size={24} color="#000" />
          )}
          <TouchableOpacity onPress={handleShareProfile}>
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
          </View>

          <Text
            className="text-2xl text-black mt-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {profileData.name.toLowerCase() || 'your name'}{profileData.age != null ? `, ${profileData.age}` : ''}
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
                  {profileData.futureTrips.length > 0 && (
                    <View className="items-center" style={{ width: 40, paddingVertical: 2 }}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          className="w-1 rounded-full my-0.5"
                          style={{ height: 4, backgroundColor: '#FDBA74' }}
                        />
                      ))}
                    </View>
                  )}
                  {profileData.futureTrips.map((trip, index) => (
                    <View key={index}>
                      <View className="flex-row items-center">
                        <View className="items-center" style={{ width: 40 }}>
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{ backgroundColor: '#FED7AA' }}
                          >
                            <Ionicons name="airplane" size={18} color="#EA580C" />
                          </View>
                        </View>
                        {editingLocationIndex === index ? (
                          <View className="ml-3 flex-1">
                            <LocationAutocomplete
                              value={editingStopText}
                              placeholder="search for a city..."
                              onSelect={(location) => handleSaveStopLocation(index, location.fullName)}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                              <TouchableOpacity onPress={() => { setEditingLocationIndex(null); setEditingStopText(''); }} style={{ paddingVertical: 4 }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'InstrumentSans_500Medium' }}>cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  Alert.alert('remove stop?', trip.location, [
                                    { text: 'cancel', style: 'cancel' },
                                    { text: 'remove', style: 'destructive', onPress: () => { handleRemoveStop(index); setEditingLocationIndex(null); } },
                                  ]);
                                }}
                                style={{ paddingVertical: 4 }}
                              >
                                <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: 'InstrumentSans_500Medium' }}>delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View className="ml-3 flex-1" style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                className="text-xs text-gray-400 uppercase"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                              >
                                next{index > 0 ? ` +${index}` : ''}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                  className="text-black text-lg"
                                  style={{ fontFamily: 'InstrumentSans_600SemiBold', flexShrink: 1 }}
                                  numberOfLines={1}
                                >
                                  {trip.location.split(',')[0]}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => { setEditingLocationIndex(index); setEditingStopText(trip.location); }}
                                  style={{ marginLeft: 6, padding: 2 }}
                                >
                                  <Ionicons name="pencil" size={12} color="#D1D5DB" />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                              <TouchableOpacity onPress={() => setDatePickerTarget({ index, field: 'start' })}>
                                <Text style={{ fontSize: 12, color: trip.startDate ? '#000' : '#D1D5DB', fontFamily: 'InstrumentSans_400Regular' }}>
                                  {formatTripDate(trip.startDate) || 'date'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                      {datePickerTarget?.index === index && (
                        <View style={{ marginLeft: 52, marginTop: 4, marginBottom: 4 }}>
                          <DateTimePicker
                            value={parseTripDate(trip.startDate) || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'compact' : 'default'}
                            minimumDate={new Date()}
                            onChange={(_: DateTimePickerEvent, date?: Date) => {
                              const target = datePickerTarget;
                              setDatePickerTarget(null);
                              if (date && target) handleSaveStopDate(target.index, target.field, date);
                            }}
                          />
                        </View>
                      )}
                      {index < profileData.futureTrips.length - 1 && (
                        <View className="items-center" style={{ width: 40, paddingVertical: 2 }}>
                          {[0, 1, 2, 3].map((i) => (
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
                      <View className="items-center" style={{ width: 40, paddingVertical: 2 }}>
                        {[0, 1, 2, 3].map((i) => (
                          <View
                            key={i}
                            className="w-1 rounded-full my-0.5"
                            style={{ height: 4, backgroundColor: '#FDBA74' }}
                          />
                        ))}
                      </View>
                      {editingLocationIndex === profileData.futureTrips.length ? (
                        <View>
                          <View className="flex-row items-center">
                            <View className="items-center" style={{ width: 40 }}>
                              <View
                                className="w-7 h-7 rounded-full items-center justify-center"
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
                          </View>
                          <View style={{ marginTop: 8 }}>
                            <LocationAutocomplete
                              value={editingStopText}
                              placeholder="search for a city..."
                              onSelect={(location) => handleSaveStopLocation(profileData.futureTrips.length, location.fullName)}
                            />
                            <TouchableOpacity onPress={() => { setEditingLocationIndex(null); setEditingStopText(''); }} style={{ marginTop: 6, paddingVertical: 4 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'InstrumentSans_500Medium' }}>cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          className="flex-row items-center"
                          onPress={() => { setEditingLocationIndex(profileData.futureTrips.length); setEditingStopText(''); }}
                        >
                          <View className="items-center" style={{ width: 40 }}>
                            <View
                              className="w-7 h-7 rounded-full items-center justify-center"
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
              <View className="bg-gray-50 rounded-3xl p-5">
                {editingBuilder ? (
                  <>
                    {/* Edit mode */}
                    <View className="mb-4">
                      <Text
                        className="text-base text-gray-500 mb-2"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        bio
                      </Text>
                      <TextInput
                        className="bg-gray-50 rounded-2xl px-4 py-3 text-black text-lg"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        value={editBuilderBio}
                        onChangeText={(text) => setEditBuilderBio(text.slice(0, 80))}
                        placeholder="e.g. electrician by trade, happy to help"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={80}
                      />
                      <Text
                        className="text-gray-400 text-xs mt-1 text-right"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {editBuilderBio.length}/80
                      </Text>
                    </View>

                    <View className="mb-4">
                      <Text
                        className="text-base text-gray-500 mb-2"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        specialties
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {Object.entries(helpCategoryLabels).map(([id, info]) => {
                          const selected = editBuilderSpecialties.includes(id);
                          return (
                            <TouchableOpacity
                              key={id}
                              onPress={() => setEditBuilderSpecialties((prev) =>
                                prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
                              )}
                              className={`px-4 py-2.5 rounded-full flex-row items-center border-2 ${
                                selected ? 'bg-white border-orange-primary' : 'bg-white border-transparent'
                              }`}
                            >
                              <Text className="mr-1.5 text-base">{info.emoji}</Text>
                              <Text
                                className={`text-base ${selected ? 'text-orange-primary' : 'text-black'}`}
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                              >
                                {info.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setEditingBuilder(false)}
                        className="flex-1 py-3 rounded-full bg-white items-center"
                      >
                        <Text
                          className="text-black text-base"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        >
                          cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          if (!user) return;
                          setSavingBuilder(true);
                          try {
                            const args: Record<string, unknown> = { id: user._id };
                            const bio = editBuilderBio.trim();
                            if (bio) args.builderBio = bio;
                            if (editBuilderSpecialties.length > 0) args.builderSpecialties = editBuilderSpecialties;
                            await updateUser(args as any);
                            setEditingBuilder(false);
                          } catch {
                            Alert.alert('error', 'failed to save. please try again.');
                          } finally {
                            setSavingBuilder(false);
                          }
                        }}
                        disabled={savingBuilder}
                        className="flex-1 py-3 rounded-full bg-orange-primary items-center"
                        style={{ opacity: savingBuilder ? 0.5 : 1 }}
                      >
                        <Text
                          className="text-white text-base"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        >
                          {savingBuilder ? 'saving...' : 'save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {/* View mode */}
                    <TouchableOpacity
                      onPress={() => {
                        setEditBuilderBio(user?.builderBio || '');
                        setEditBuilderSpecialties(user?.builderSpecialties || []);
                        setEditingBuilder(true);
                      }}
                      className="absolute top-4 right-4 z-10"
                    >
                      <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Bio */}
                    <Text
                      className="text-base text-gray-500 mb-2"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      about
                    </Text>
                    {user?.builderBio ? (
                      <View className="mb-5">
                        <Text
                          className="text-black text-lg"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {user.builderBio}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditBuilderBio('');
                          setEditBuilderSpecialties(user?.builderSpecialties || []);
                          setEditingBuilder(true);
                        }}
                        className="mb-5"
                      >
                        <Text
                          className="text-gray-400 text-lg"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          tap to add a builder bio...
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Specialties */}
                    {builderStats && builderStats.specialties.length > 0 ? (
                      <View className="mb-5">
                        <Text
                          className="text-base text-gray-500 mb-2"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          specialties
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {builderStats.specialties.map((cat) => {
                            const info = helpCategoryLabels[cat];
                            return (
                              <View key={cat} className="bg-white px-4 py-2.5 rounded-full flex-row items-center">
                                {info && <Text className="mr-1.5 text-base">{info.emoji}</Text>}
                                <Text
                                  className="text-black text-base"
                                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                >
                                  {info?.label || cat}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditBuilderBio(user?.builderBio || '');
                          setEditBuilderSpecialties([]);
                          setEditingBuilder(true);
                        }}
                        className="mb-5"
                      >
                        <Text
                          className="text-gray-400 text-base"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          tap to add specialties...
                        </Text>
                      </TouchableOpacity>
                    )}

                  </>
                )}
              </View>

              {/* Stats bento */}
              {builderStats && (
                <View className="bg-gray-50 rounded-3xl p-5 mt-3">
                  <View className="flex-row mb-5">
                    <View className="flex-1 items-center py-3 bg-white rounded-2xl mr-2">
                      <Text
                        className="text-2xl text-black"
                        style={{ fontFamily: 'InstrumentSans_700Bold' }}
                      >
                        {builderStats.completedRequests}
                      </Text>
                      <Text
                        className="text-sm text-gray-500 mt-1"
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
                        className="text-sm text-gray-500 mt-1"
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
                        className="text-base text-gray-500 mb-2"
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
                                className="text-black text-base"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                numberOfLines={1}
                              >
                                {req.title}
                              </Text>
                              <Text
                                className="text-gray-400 text-sm"
                                style={{ fontFamily: 'InstrumentSans_400Regular' }}
                              >
                                {req.status === 'open' ? 'open' : 'in progress'}
                              </Text>
                            </View>
                            {req.isUrgent && (
                              <View className="bg-red-100 px-2 py-1 rounded-full">
                                <Text
                                  className="text-red-600 text-sm"
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

                  {/* Empty state */}
                  {builderStats.activeRequests.length === 0 && builderStats.totalRequests === 0 && (
                    <View className="items-center py-4">
                      <Ionicons name="hammer-outline" size={32} color="#D1D5DB" />
                      <Text
                        className="text-gray-400 text-base mt-2 text-center"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        no help activity yet
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* Viewers Modal */}
      <Modal
        visible={viewersModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          Animated.timing(viewersSlideAnim, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setViewersModalVisible(false));
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => {
              Animated.timing(viewersSlideAnim, {
                toValue: 400,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setViewersModalVisible(false));
            }}
          />
          <Animated.View
            style={{ transform: [{ translateY: viewersSlideAnim }] }}
            className="bg-white rounded-t-3xl px-6 pb-10 pt-4"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text
              className="text-xl text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              profile viewers
            </Text>

            {profileViewers && profileViewers.length > 0 ? (
              <View>
                {profileViewers.map((viewer) => (
                  <TouchableOpacity
                    key={viewer!._id}
                    className="flex-row items-center py-3 border-b border-gray-50"
                    activeOpacity={0.7}
                    onPress={() => {
                      setViewersModalVisible(false);
                      viewersSlideAnim.setValue(400);
                      router.push(`/user/${viewer!._id}` as any);
                    }}
                  >
                    {viewer!.photos.length > 0 ? (
                      <Image
                        source={{ uri: viewer!.photos[0] }}
                        className="w-12 h-12 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-black text-base"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {viewer!.name.toLowerCase()}
                      </Text>
                      <Text
                        className="text-gray-400 text-sm"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {timeAgo(viewer!.viewedAt)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center py-8">
                <Ionicons name="eye-outline" size={40} color="#E5E7EB" />
                <Text
                  className="text-gray-400 mt-3"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  no profile views yet
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

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
