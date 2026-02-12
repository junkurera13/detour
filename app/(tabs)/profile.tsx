import { View, Text, ScrollView, Image, TouchableOpacity, Animated, Alert, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { calculateAge, formatDateShort, formatTripDate } from '@/utils/profile';
import { ViewersModal } from '@/components/profile/ViewersModal';
import { SettingsMenu, SettingsItem } from '@/components/profile/SettingsMenu';
import { InviteCodesModal } from '@/components/profile/InviteCodesModal';
import { BuilderProfile } from '@/components/profile/BuilderProfile';
import { EventsList } from '@/components/profile/EventsList';


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
};

const settingsItems: SettingsItem[] = [
  { id: 'edit', label: 'edit profile', icon: 'create-outline' },
  { id: 'settings', label: 'settings', icon: 'settings-outline' },
  { id: 'subscription', label: 'manage subscription', icon: 'card-outline' },
  { id: 'account', label: 'account', icon: 'person-circle-outline' },
];

export default function ProfileScreen() {
  const { data: onboardingData } = useOnboarding();
  const { convexUser: user, convexAuthenticated } = useAuthenticatedUser();
  const { openCustomerCenter } = useRevenueCat();
  const router = useRouter();
  const builderStats = useQuery(api.helpRequests.getBuilderStats, convexAuthenticated ? {} : "skip");
  const myActivities = useQuery(api.activities.getByUserId, user?._id ? { userId: user._id } : "skip");
  const updateUser = useMutation(api.users.update);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'builder'>('about');
  const [editingCurrentLocation, setEditingCurrentLocation] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [editingStopText, setEditingStopText] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'start' | 'end' } | null>(null);
  const [editingBuilder, setEditingBuilder] = useState(false);
  const [editBuilderBio, setEditBuilderBio] = useState('');
  const [editBuilderSpecialties, setEditBuilderSpecialties] = useState<string[]>([]);
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const profileViewers = useQuery(api.profileViews.getRecentViewers, convexAuthenticated ? {} : "skip");
  const myInviteCodes = useQuery(api.inviteCodes.getMyInviteCodes, convexAuthenticated ? {} : "skip");
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const viewersSlideAnim = useRef(new Animated.Value(400)).current;
  const inviteSlideAnim = useRef(new Animated.Value(400)).current;

  const availableInvites = useMemo(() => {
    if (!myInviteCodes) return 0;
    return myInviteCodes.filter(c => c.currentUses === 0 && c.isActive).length;
  }, [myInviteCodes]);

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
        rigType: user.rigType,
        rigName: user.rigName,
        interests: user.interests,
        futureTrips: user.futureTrips || [],
        pets: user.pets || [],
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
      rigType: onboardingData.rigType,
      rigName: onboardingData.rigName,
      interests: onboardingData.interests,
      futureTrips: onboardingData.futureTrips || [],
      pets: [],
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

  const handleShareInviteCode = async (code: string) => {
    try {
      await Share.share({
        message: `join me on detour! use my invite code: ${code}\n\nhttps://detour.app`,
      });
    } catch {
      // user cancelled or share failed
    }
  };

  const handleSettingsAction = async (id: string) => {
    closeMenu();
    if (id === 'subscription') {
      await openCustomerCenter();
    } else if (id === 'settings') {
      router.push('/settings');
    } else if (id === 'edit') {
      router.push('/edit-profile');
    } else if (id === 'account') {
      router.push('/account');
    }
  };

  // Build a clean trip array with only schema-valid fields: location, startDate.
  // Convex v.object() is strict — extra keys cause validation failures.
  const buildCleanTrips = () =>
    profileData.futureTrips.map((t) => ({
      location: t.location,
      ...(t.date ? { date: t.date } : {}),
      ...(t.startDate ? { startDate: t.startDate } : {}),
      ...(t.endDate ? { endDate: t.endDate } : {}),
      ...(t.latitude != null ? { latitude: t.latitude } : {}),
      ...(t.longitude != null ? { longitude: t.longitude } : {}),
      ...(t.stopType ? { stopType: t.stopType } : {}),
    }));

  const handleSaveCurrentLocation = async (location: { fullName: string; coordinates?: { latitude: number; longitude: number } }) => {
    if (!user) return;
    const text = location.fullName.trim();
    if (!text) return;
    try {
      await updateUser({
        currentLocation: text,
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
      });
    } catch (e) {
      console.error('handleSaveCurrentLocation:', e);
      Alert.alert('error', 'failed to update location');
    }
    setEditingCurrentLocation(false);
  };

  const handleSaveStopLocation = async (index: number, location: { fullName: string; coordinates?: { latitude: number; longitude: number } }) => {
    if (!user) return;
    const text = location.fullName.trim();
    if (!text) return;
    const trips = buildCleanTrips();
    const stopData = {
      location: text,
      ...(location.coordinates ? { latitude: location.coordinates.latitude, longitude: location.coordinates.longitude } : {}),
    };
    if (index < trips.length) {
      trips[index] = { ...trips[index], ...stopData };
    } else {
      trips.push(stopData);
    }
    try {
      await updateUser({ futureTrips: trips });
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
    trips[index].startDate = date.toISOString().slice(0, 10);
    try {
      await updateUser({ futureTrips: trips });
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
      await updateUser({ futureTrips: trips });
    } catch (e) {
      console.error('handleRemoveStop:', e);
      Alert.alert('error', 'failed to remove trip');
    }
  };

  const handleSaveBuilder = async () => {
    if (!user) return;
    setSavingBuilder(true);
    try {
      await updateUser({
        ...(editBuilderBio.trim() ? { builderBio: editBuilderBio.trim() } : {}),
        ...(editBuilderSpecialties.length > 0 ? { builderSpecialties: editBuilderSpecialties } : {}),
      });
      setEditingBuilder(false);
    } catch {
      Alert.alert('error', 'failed to save. please try again.');
    } finally {
      setSavingBuilder(false);
    }
  };

  return (
    <ErrorBoundary>
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text
            className="text-5xl text-black"
            style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
          >
            profile
          </Text>
          {myInviteCodes && myInviteCodes.length > 0 && (
            <TouchableOpacity
              className="ml-3 flex-row items-center rounded-full px-3 py-1.5"
              style={{ borderWidth: 1.5, borderColor: '#fd6b03' }}
              onPress={() => {
                setInviteModalVisible(true);
                Animated.spring(inviteSlideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 65,
                  friction: 11,
                }).start();
              }}
            >
              <Ionicons name="ticket-outline" size={16} color="#fd6b03" />
              <Text
                className="text-orange-primary text-sm ml-1.5"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {availableInvites}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          {profileViewers && profileViewers.length > 0 ? (
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 rounded-full px-2 py-1"
              accessibilityRole="button"
              accessibilityLabel="Who viewed your profile"
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
                  accessibilityLabel={`${viewer!.name} profile photo`}
                />
              ))}
            </TouchableOpacity>
          ) : (
            <Ionicons name="footsteps-outline" size={24} color="#000" />
          )}
          <TouchableOpacity onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Share profile">
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} accessibilityRole="button" accessibilityLabel="Settings menu">
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
                accessibilityLabel={`${profileData.name || 'Your'} profile photo`}
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
          <EventsList
            events={myActivities}
            profileName={profileData.name}
            router={router}
          />
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
                    {editingCurrentLocation ? (
                      <View className="ml-3 flex-1">
                        <LocationAutocomplete
                          value={profileData.currentLocation}
                          placeholder="search for a city..."
                          onSelect={(location) => handleSaveCurrentLocation(location)}
                        />
                        <TouchableOpacity onPress={() => setEditingCurrentLocation(false)} style={{ paddingVertical: 4, marginTop: 4 }}>
                          <Text style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'InstrumentSans_500Medium' }}>cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="ml-3 flex-1" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text
                            className="text-xs text-gray-400 uppercase"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            now
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                              className="text-black text-lg"
                              style={{ fontFamily: 'InstrumentSans_600SemiBold', flexShrink: 1 }}
                              numberOfLines={1}
                            >
                              {profileData.currentLocation || 'location not set'}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setEditingCurrentLocation(true)}
                              style={{ marginLeft: 6, padding: 2 }}
                              accessibilityRole="button"
                              accessibilityLabel="Edit current location"
                            >
                              <Ionicons name="pencil" size={12} color="#D1D5DB" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
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
                              onSelect={(location) => handleSaveStopLocation(index, location)}
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
                                  accessibilityRole="button"
                                  accessibilityLabel="Edit trip location"
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
                              onSelect={(location) => handleSaveStopLocation(profileData.futureTrips.length, location)}
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
                    {setupLabels[profileData.rigType]?.label || profileData.rigType}{profileData.rigName ? ` (${profileData.rigName})` : ''}
                  </Text>
                </View>
              </View>
            )}

            <View className="px-6 mb-6">
              <Text
                className="text-lg text-black mb-3"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                travelling with
              </Text>
              {profileData.pets.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {profileData.pets.map((pet, idx) => {
                    const emojiMap: Record<string, string> = { dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐰', fish: '🐟', reptile: '🦎', other: '🐾' };
                    return (
                      <View key={idx} className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center">
                        <Text className="mr-1">{emojiMap[pet.type] || '🐾'}</Text>
                        <Text
                          className="text-gray-700"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {pet.name} ({pet.type})
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
          <BuilderProfile
            user={user ? { builderBio: user.builderBio, builderSpecialties: user.builderSpecialties } : null}
            userId={user?._id}
            builderStats={builderStats}
            editingBuilder={editingBuilder}
            setEditingBuilder={setEditingBuilder}
            editBuilderBio={editBuilderBio}
            setEditBuilderBio={setEditBuilderBio}
            editBuilderSpecialties={editBuilderSpecialties}
            setEditBuilderSpecialties={setEditBuilderSpecialties}
            savingBuilder={savingBuilder}
            onSave={handleSaveBuilder}
          />
        )}

      </ScrollView>

      <ViewersModal
        visible={viewersModalVisible}
        onClose={() => setViewersModalVisible(false)}
        slideAnim={viewersSlideAnim}
        viewers={profileViewers}
        router={router}
      />

      <SettingsMenu
        visible={menuVisible}
        onClose={closeMenu}
        slideAnim={slideAnim}
        onAction={handleSettingsAction}
        settingsItems={settingsItems}
      />

      <InviteCodesModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        slideAnim={inviteSlideAnim}
        inviteCodes={myInviteCodes}
        onShareCode={handleShareInviteCode}
        router={router}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}
