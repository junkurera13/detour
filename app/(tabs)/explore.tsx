import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal, Switch, TextInput, Share, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { useEvents } from '@/context/EventsContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

// Interest ID to label mapping
const interestLabels: Record<string, string> = {
  'grab-coffee': 'grab coffee',
  'try-street-food': 'try street food',
  'cook-together': 'cook together',
  'hit-night-markets': 'hit night markets',
  'go-wine-tasting': 'go wine tasting',
  'try-local-beer': 'try local beer',
  'brunch-dates': 'brunch dates',
  'find-hidden-gems': 'find hidden gems',
  'go-hiking': 'go hiking',
  'go-surfing': 'go surfing',
  'go-diving': 'go diving',
  'go-camping': 'go camping',
  'go-climbing': 'go climbing',
  'go-cycling': 'go cycling',
  'beach-days': 'beach days',
  'go-skating': 'go skating',
  'go-skiing': 'go skiing',
  'explore-the-city': 'explore the city',
  'road-trips': 'road trips',
  'play-pickleball': 'play pickleball',
  'play-padel': 'play padel',
  'play-soccer': 'play soccer',
  'play-basketball': 'play basketball',
  'play-tennis': 'play tennis',
  'play-volleyball': 'play volleyball',
  'play-golf': 'play golf',
  'grab-drinks': 'grab drinks',
  'go-dancing': 'go dancing',
  'see-live-music': 'see live music',
  'go-clubbing': 'go clubbing',
  'do-karaoke': 'do karaoke',
  'see-comedy': 'see comedy',
  'go-to-festivals': 'go to festivals',
  'hit-the-gym': 'hit the gym',
  'do-yoga': 'do yoga',
  'go-running': 'go running',
  'do-crossfit': 'do crossfit',
  'try-muay-thai': 'try muay thai',
  'morning-stretches': 'morning stretches',
  'visit-museums': 'visit museums',
  'take-photos': 'take photos',
  'find-street-art': 'find street art',
  'watch-films': 'watch films',
  'learn-languages': 'learn languages',
  'take-a-class': 'take a class',
  'browse-markets': 'browse markets',
  'cowork-at-cafes': 'cowork at cafes',
  'brainstorm-ideas': 'brainstorm ideas',
  'make-content': 'make content',
  'jam-together': 'jam together',
  'build-stuff': 'build stuff',
  'watch-sunsets': 'watch sunsets',
  'read-together': 'read together',
  'play-board-games': 'play board games',
  'chill-at-the-beach': 'chill at the beach',
  'meditate': 'meditate',
  'spa-days': 'spa days',
  // Activity categories
  'surfing': 'surfing',
  'coffee': 'coffee',
  'yoga': 'yoga',
  'food': 'food',
  'fitness': 'fitness',
  'photography': 'photography',
  'music': 'music',
  'entrepreneur': 'entrepreneur',
  'diving': 'diving',
  'cooking': 'cooking',
  'hiking': 'hiking',
  'climbing': 'climbing',
  'community': 'community',
  'coworking': 'coworking',
  'dancing': 'dancing',
  'other': 'other',
};

interface Activity {
  id: string;
  title: string;
  category: string;
  photo: string;
  host: { name: string; photo: string };
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  tags: string[];
}

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

const dayFilters = [
  { id: 'any', label: 'any day' },
  { id: 'today', label: 'today' },
  { id: 'tomorrow', label: 'tomorrow' },
  { id: 'this-week', label: 'this week' },
  { id: 'this-weekend', label: 'this weekend' },
  { id: 'next-week', label: 'next week' },
];

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function matchesDayFilter(dateStr: string, filter: string): boolean {
  if (filter === 'any') return true;
  const d = dateStr.toLowerCase();
  if (filter === 'today') return d === 'today';
  if (filter === 'tomorrow') return d === 'tomorrow';
  if (filter === 'this-weekend') return d === 'saturday' || d === 'sunday';
  if (filter === 'next-week') return d.startsWith('next');
  if (filter === 'this-week') {
    return d === 'today' || d === 'tomorrow' || (weekdays.includes(d) && !d.startsWith('next'));
  }
  return true;
}

// Sort order for date strings
function dateSortValue(dateStr: string): number {
  const d = dateStr.toLowerCase();
  if (d === 'today') return 0;
  if (d === 'tomorrow') return 1;
  const dayIndex = weekdays.indexOf(d);
  if (dayIndex >= 0) return 2 + dayIndex;
  if (d.startsWith('next')) return 10;
  return 20;
}

export default function ExploreScreen() {
  const { data } = useOnboarding();
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [prefsVisible, setPrefsVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('any');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [activityDistance, setActivityDistance] = useState(25);
  const [prefLocation, setPrefLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [myEventsVisible, setMyEventsVisible] = useState(false);
  const [myEventsTab, setMyEventsTab] = useState<'upcoming' | 'hosting' | 'saved' | 'happened'>('upcoming');
  const [createVisible, setCreateVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({
    coverImage: '',
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    tags: [] as string[],
  });
  const { savedIds, toggleSave, isSaved } = useEvents();

  // Real Convex data
  const convexActivities = useQuery(api.activities.list);
  const createActivity = useMutation(api.activities.create);
  const userId = convexUser?._id;

  // Map Convex activities to local Activity interface
  const activities: Activity[] = useMemo(() => {
    if (!convexActivities) return [];
    return convexActivities.map((a) => ({
      id: a._id,
      title: a.title.toLowerCase(),
      category: a.category,
      photo: a.image || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop',
      host: { name: a.host.name, photo: a.host.photo },
      date: a.date,
      time: a.time,
      location: a.location,
      attendees: a.attendeeIds.length,
      maxAttendees: a.maxAttendees || 20,
      tags: a.tags || [],
    }));
  }, [convexActivities]);

  // My events
  const joinedEvents = useMemo(() => {
    if (!convexActivities || !userId) return [];
    return convexActivities
      .filter((a) => a.attendeeIds.includes(userId))
      .map((a) => ({
        id: a._id,
        title: a.title.toLowerCase(),
        category: a.category,
        photo: a.image || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop',
        host: { name: a.host.name, photo: a.host.photo },
        date: a.date,
        time: a.time,
        location: a.location,
        attendees: a.attendeeIds.length,
        maxAttendees: a.maxAttendees || 20,
        tags: a.tags || [],
      }));
  }, [convexActivities, userId]);

  const hostedEvents = useMemo(() => {
    if (!convexActivities || !userId) return [];
    return convexActivities
      .filter((a) => a.hostId === userId)
      .map((a) => ({
        id: a._id,
        title: a.title.toLowerCase(),
        category: a.category,
        photo: a.image || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop',
        host: { name: a.host.name, photo: a.host.photo },
        date: a.date,
        time: a.time,
        location: a.location,
        attendees: a.attendeeIds.length,
        maxAttendees: a.maxAttendees || 20,
        tags: a.tags || [],
      }));
  }, [convexActivities, userId]);

  const savedEvents = useMemo(() => activities.filter(a => savedIds.includes(a.id)), [activities, savedIds]);

  // Get user's interests for filter pills
  const userInterests = useMemo(() => data.interests || [], [data.interests]);

  // Search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { activities: [] as Activity[], hosts: [] as { name: string; photo: string; activityCount: number }[] };

    const matchedActivities = activities.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.host.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      (interestLabels[a.category] || a.category).toLowerCase().includes(q)
    );

    const hostMap = new Map<string, { name: string; photo: string; activityCount: number }>();
    for (const a of matchedActivities) {
      const existing = hostMap.get(a.host.name);
      if (existing) {
        existing.activityCount++;
      } else {
        hostMap.set(a.host.name, { name: a.host.name, photo: a.host.photo, activityCount: 1 });
      }
    }

    if (q.length >= 2) {
      for (const a of activities) {
        if (a.host.name.toLowerCase().includes(q) && !hostMap.has(a.host.name)) {
          hostMap.set(a.host.name, { name: a.host.name, photo: a.host.photo, activityCount: 1 });
        }
      }
    }

    return {
      activities: matchedActivities,
      hosts: Array.from(hostMap.values()),
    };
  }, [searchQuery, activities]);

  // Filter activities
  const baseLocation = convexUser?.currentLocation || data.currentLocation || '';
  const userLocation = prefLocation || baseLocation;
  const filteredActivities = useMemo(() => {
    let result = activities;

    if (!showAllActivities && userInterests.length > 0) {
      result = result.filter(activity =>
        userInterests.some(interest =>
          activity.category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(activity.category.toLowerCase()) ||
          activity.tags.some(tag =>
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (selectedInterest) {
      result = result.filter(activity =>
        activity.category === selectedInterest ||
        activity.tags.includes(selectedInterest)
      );
    }
    if (dayFilter !== 'any') {
      result = result.filter(activity => matchesDayFilter(activity.date, dayFilter));
    }
    if (showNearbyOnly && userLocation) {
      const loc = userLocation.toLowerCase();
      result = result.filter(activity => {
        const actLoc = activity.location.toLowerCase();
        return loc.split(',').some(part => actLoc.includes(part.trim())) ||
               actLoc.split(',').some(part => loc.includes(part.trim()));
      });
    }
    return result;
  }, [activities, selectedInterest, dayFilter, showAllActivities, showNearbyOnly, activityDistance, userLocation, userInterests]);

  const isLoading = convexActivities === undefined;

  const handlePublishEvent = async () => {
    if (!newEvent.title.trim()) {
      Alert.alert('Missing title', 'Please give your event a name.');
      return;
    }
    try {
      await createActivity({
        title: newEvent.title,
        description: newEvent.description || 'No description provided.',
        date: newEvent.startDate || 'TBD',
        time: newEvent.startTime || 'TBD',
        endDate: newEvent.endDate || undefined,
        endTime: newEvent.endTime || undefined,
        location: newEvent.location || 'TBD',
        category: newEvent.tags[0] || 'other',
        tags: newEvent.tags.length > 0 ? newEvent.tags : undefined,
        image: newEvent.coverImage || undefined,
      });
      Alert.alert('Event published!', `"${newEvent.title}" has been created.`, [
        { text: 'OK', onPress: () => setCreateVisible(false) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', lineHeight: Platform.OS === 'android' ? 60 : undefined }}
        >
          activity
        </Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
            onPress={() => { setSearchQuery(''); setSearchVisible(true); }}
          >
            <Ionicons name="search-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
            onPress={() => setPrefsVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
            onPress={() => setMyEventsVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Section header */}
        <View className="px-6 mb-4">
          <Text
            className="text-lg text-black"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            {showAllActivities ? 'all activities' : 'recommended for you'}
          </Text>
        </View>

        {/* Interest filter pills */}
        {userInterests.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedInterest(null)}
              className="mr-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: selectedInterest === null ? '#fd6b03' : '#F3F4F6' }}
            >
              <Text
                className={`text-sm ${selectedInterest === null ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                all
              </Text>
            </TouchableOpacity>
            {userInterests.map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => setSelectedInterest(interest)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: selectedInterest === interest ? '#fd6b03' : '#F3F4F6' }}
              >
                <Text
                  className={`text-sm ${selectedInterest === interest ? 'text-white' : 'text-black'}`}
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  {interestLabels[interest] || interest}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Activity cards */}
        <View className="px-6">
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#fd6b03" />
              <Text
                className="text-gray-400 mt-4"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                loading activities...
              </Text>
            </View>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                className="mb-4 rounded-2xl overflow-hidden bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.9}
                onPress={() => { setMenuOpenId(null); router.push(`/event/${activity.id}`); }}
              >
                {/* Activity photo with category badge */}
                <View className="relative">
                  <Image
                    source={{ uri: activity.photo }}
                    style={{ width: '100%', height: 160 }}
                    resizeMode="cover"
                  />
                  {/* Share & more buttons */}
                  <View className="absolute top-3 right-3 flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => Share.share({ message: `Check out "${activity.title}" on Detour!` })}
                      className="w-8 h-8 rounded-full bg-black/40 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setMenuOpenId(menuOpenId === activity.id ? null : activity.id)}
                      className="w-8 h-8 rounded-full bg-black/40 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {/* Dropdown menu */}
                  {menuOpenId === activity.id && (
                    <View
                      className="absolute top-14 right-3 bg-white rounded-xl py-2"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 8,
                        minWidth: 180,
                      }}
                    >
                      <TouchableOpacity
                        className="flex-row items-center px-4 py-3"
                        onPress={() => { if (menuOpenId) toggleSave(menuOpenId); setMenuOpenId(null); }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={menuOpenId && isSaved(menuOpenId) ? 'bookmark' : 'bookmark-outline'} size={18} color="#374151" />
                        <Text
                          className="text-gray-800 ml-3"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {menuOpenId && isSaved(menuOpenId) ? 'unsave event' : 'save event'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-row items-center px-4 py-3"
                        onPress={() => setMenuOpenId(null)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-off-outline" size={18} color="#374151" />
                        <Text
                          className="text-gray-800 ml-3"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          show fewer like this
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-row items-center px-4 py-3"
                        onPress={() => setMenuOpenId(null)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="flag-outline" size={18} color="#EF4444" />
                        <Text
                          className="text-red-500 ml-3"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          report
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Activity details */}
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-lg text-black flex-1"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      numberOfLines={1}
                    >
                      {activity.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 4 }} />
                  </View>

                  {/* Date/time row */}
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text
                      className="text-sm text-gray-500 ml-2"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {activity.date} at {activity.time}
                    </Text>
                  </View>

                  {/* Location row */}
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text
                      className="text-sm text-gray-500 ml-2"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {activity.location}
                    </Text>
                  </View>

                  {/* Host row */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: activity.host.photo }}
                        style={{ width: 28, height: 28 }}
                        className="rounded-full"
                      />
                      <Text
                        className="text-sm text-gray-600 ml-2"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        hosted by <Text style={{ fontFamily: 'InstrumentSans_500Medium' }}>{activity.host.name}</Text>
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-500 ml-1"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {activity.attendees} going
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="py-12">
              <Text
                className="text-gray-500 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {showAllActivities ? 'no activities found' : 'no activities match your interests yet'}
              </Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Floating Action Button — Host Event */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: '#fd6b03' }}
        activeOpacity={0.8}
        onPress={() => {
          setNewEvent({ coverImage: '', title: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '', tags: [] });
          setCreateVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Preferences Modal */}
      <Modal
        visible={prefsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrefsVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <Text
              className="text-2xl text-black"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              preferences
            </Text>
            <TouchableOpacity
              onPress={() => setPrefsVisible(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="px-6 pt-4">
            {/* Location */}
            <View className="pb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-lg text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  location
                </Text>
                {prefLocation !== '' && prefLocation !== baseLocation && !isEditingLocation && (
                  <TouchableOpacity
                    onPress={() => setPrefLocation('')}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-sm"
                      style={{ fontFamily: 'InstrumentSans_500Medium', color: '#fd6b03' }}
                    >
                      reset
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditingLocation ? (
                <LocationAutocomplete
                  value={prefLocation || baseLocation}
                  onSelect={(location) => {
                    setPrefLocation(location.fullName);
                    setIsEditingLocation(false);
                  }}
                  placeholder="search for a city..."
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditingLocation(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center"
                >
                  <Ionicons name="location" size={18} color="#fd6b03" />
                  <Text
                    className="ml-3 text-black flex-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 15 }}
                  >
                    {userLocation || 'Tap to set location'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Day filter */}
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              when
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {dayFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setDayFilter(filter.id)}
                  className="px-4 py-2.5 rounded-full"
                  style={{ backgroundColor: dayFilter === filter.id ? '#111827' : '#F3F4F6' }}
                >
                  <Text
                    className={dayFilter === filter.id ? 'text-white' : 'text-black'}
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Show nearby only toggle */}
            <View className="flex-row items-center justify-between py-4">
              <Text
                className="text-lg text-black"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                show nearby only
              </Text>
              <Switch
                value={showNearbyOnly}
                onValueChange={setShowNearbyOnly}
                trackColor={{ false: '#E5E7EB', true: '#fd6b03' }}
                thumbColor="#fff"
              />
            </View>

            {/* Distance selector - only when nearby is on */}
            {showNearbyOnly && (
              <View className="pb-6 pt-2">
                <View className="bg-gray-50 rounded-2xl overflow-hidden px-4 py-4">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-black"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      max distance
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => {
                          const idx = DISTANCE_OPTIONS.indexOf(activityDistance);
                          if (idx > 0) setActivityDistance(DISTANCE_OPTIONS[idx - 1]);
                        }}
                        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                        disabled={activityDistance === DISTANCE_OPTIONS[0]}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={activityDistance === DISTANCE_OPTIONS[0] ? '#D1D5DB' : '#000'}
                        />
                      </TouchableOpacity>
                      <Text
                        className="mx-4 text-black min-w-[50px] text-center"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {activityDistance} km
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const idx = DISTANCE_OPTIONS.indexOf(activityDistance);
                          if (idx < DISTANCE_OPTIONS.length - 1) setActivityDistance(DISTANCE_OPTIONS[idx + 1]);
                        }}
                        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                        disabled={activityDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1]}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={activityDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1] ? '#D1D5DB' : '#000'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-3 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-3">
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="search activities or people..."
                placeholderTextColor="#9CA3AF"
                autoFocus
                className="flex-1 ml-2 text-black"
                style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setSearchVisible(false)}>
              <Text
                className="text-orange-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {searchQuery.trim().length === 0 ? (
              <View className="items-center pt-20 px-6">
                <Ionicons name="search" size={48} color="#E5E7EB" />
                <Text
                  className="text-gray-400 mt-4 text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  search for activities, locations, or hosts
                </Text>
              </View>
            ) : (
              <>
                {searchResults.hosts.length > 0 && (
                  <View className="px-6 mb-6">
                    <Text
                      className="text-lg text-black mb-3"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      people
                    </Text>
                    {searchResults.hosts.map((host) => (
                      <View
                        key={host.name}
                        className="flex-row items-center py-3 border-b border-gray-50"
                      >
                        <Image
                          source={{ uri: host.photo }}
                          className="w-12 h-12 rounded-full"
                          resizeMode="cover"
                        />
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-black"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          >
                            {host.name}
                          </Text>
                          <Text
                            className="text-gray-500 text-sm"
                            style={{ fontFamily: 'InstrumentSans_400Regular' }}
                          >
                            {host.activityCount} {host.activityCount === 1 ? 'activity' : 'activities'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {searchResults.activities.length > 0 && (
                  <View className="px-6">
                    <Text
                      className="text-lg text-black mb-3"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      activities
                    </Text>
                    {searchResults.activities.map((activity) => (
                      <View
                        key={activity.id}
                        className="flex-row items-center py-3 border-b border-gray-50"
                      >
                        <Image
                          source={{ uri: activity.photo }}
                          className="w-14 h-14 rounded-xl"
                          resizeMode="cover"
                        />
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-black"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                            numberOfLines={1}
                          >
                            {activity.title}
                          </Text>
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
                      </View>
                    ))}
                  </View>
                )}

                {searchResults.activities.length === 0 && searchResults.hosts.length === 0 && (
                  <View className="items-center pt-20 px-6">
                    <Ionicons name="search" size={48} color="#E5E7EB" />
                    <Text
                      className="text-gray-400 mt-4 text-center"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      no results for &ldquo;{searchQuery}&rdquo;
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* My Events Modal */}
      <Modal
        visible={myEventsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMyEventsVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <Text
              className="text-2xl text-black"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              my events
            </Text>
            <TouchableOpacity
              onPress={() => setMyEventsVisible(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="px-6 pb-4">
            <View className="flex-row gap-2">
              {(['upcoming', 'hosting', 'saved', 'happened'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setMyEventsTab(tab)}
                  className="px-4 py-2.5 rounded-full"
                  style={{ backgroundColor: myEventsTab === tab ? '#111827' : '#F3F4F6' }}
                >
                  <Text
                    className={myEventsTab === tab ? 'text-white' : 'text-black'}
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {(() => {
              const events =
                myEventsTab === 'upcoming' ? joinedEvents :
                myEventsTab === 'hosting' ? hostedEvents :
                myEventsTab === 'saved' ? savedEvents :
                [];
              const emptyIcon =
                myEventsTab === 'upcoming' ? 'calendar-outline' as const :
                myEventsTab === 'hosting' ? 'megaphone-outline' as const :
                myEventsTab === 'saved' ? 'bookmark-outline' as const :
                'time-outline' as const;
              const emptyMsg =
                myEventsTab === 'upcoming' ? 'no upcoming events yet. join an activity to see it here.' :
                myEventsTab === 'hosting' ? 'you haven\'t hosted any events yet. create one to get started.' :
                myEventsTab === 'saved' ? 'no saved events. tap the 3-dot menu on an event to save it.' :
                'no past events yet. your history will show up here.';

              if (events.length === 0) {
                return (
                  <View className="items-center pt-20 px-6">
                    <Ionicons name={emptyIcon} size={48} color="#E5E7EB" />
                    <Text
                      className="text-gray-400 mt-4 text-center"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {emptyMsg}
                    </Text>
                  </View>
                );
              }

              return (
                <View className="px-6">
                  {events.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      className="flex-row items-center py-3 border-b border-gray-50"
                      activeOpacity={0.7}
                      onPress={() => router.push(`/event/${activity.id}`)}
                    >
                      <Image
                        source={{ uri: activity.photo }}
                        className="w-14 h-14 rounded-xl"
                        resizeMode="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          className="text-black"
                          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          numberOfLines={1}
                        >
                          {activity.title}
                        </Text>
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
                  ))}
                </View>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => setCreateVisible(false)}>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                cancel
              </Text>
            </TouchableOpacity>
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              create event
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cover Image */}
              <TouchableOpacity
                className="mx-6 mb-6 rounded-2xl overflow-hidden"
                style={{ height: 180, backgroundColor: '#F3F4F6' }}
                activeOpacity={0.7}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [16, 9],
                    quality: 0.8,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setNewEvent((prev) => ({ ...prev, coverImage: result.assets[0].uri }));
                  }
                }}
              >
                {newEvent.coverImage ? (
                  <Image
                    source={{ uri: newEvent.coverImage }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                    <Text
                      className="text-gray-400 mt-2"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      add cover image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title */}
              <View className="mx-6 mb-5">
                <Text
                  className="text-xs text-gray-400 uppercase tracking-wider mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  title
                </Text>
                <TextInput
                  value={newEvent.title}
                  onChangeText={(t) => setNewEvent((prev) => ({ ...prev, title: t }))}
                  placeholder="give your event a name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 rounded-xl px-4 py-3.5 text-black"
                  style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
                />
              </View>

              {/* Description */}
              <View className="mx-6 mb-5">
                <Text
                  className="text-xs text-gray-400 uppercase tracking-wider mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  description
                </Text>
                <TextInput
                  value={newEvent.description}
                  onChangeText={(t) => setNewEvent((prev) => ({ ...prev, description: t }))}
                  placeholder="tell people what this event is about"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 rounded-xl px-4 py-3.5 text-black"
                  style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16, minHeight: 100, textAlignVertical: 'top' }}
                />
              </View>

              {/* Details section */}
              <View className="mx-6 mb-5">
                <Text
                  className="text-xs text-gray-400 uppercase tracking-wider mb-3"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  details
                </Text>

                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3.5 mb-3">
                  <Ionicons name="location-outline" size={20} color="#fd6b03" />
                  <TextInput
                    value={newEvent.location}
                    onChangeText={(t) => setNewEvent((prev) => ({ ...prev, location: t }))}
                    placeholder="add location"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-black"
                    style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
                  />
                </View>

                <View className="bg-gray-50 rounded-xl px-4 py-3.5 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar-outline" size={20} color="#fd6b03" />
                    <Text
                      className="text-black ml-3"
                      style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 16 }}
                    >
                      starts
                    </Text>
                  </View>
                  <View className="flex-row gap-3 ml-8">
                    <TextInput
                      value={newEvent.startDate}
                      onChangeText={(t) => setNewEvent((prev) => ({ ...prev, startDate: t }))}
                      placeholder="date (e.g. Feb 15)"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 text-black"
                      style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14 }}
                    />
                    <TextInput
                      value={newEvent.startTime}
                      onChangeText={(t) => setNewEvent((prev) => ({ ...prev, startTime: t }))}
                      placeholder="time (e.g. 6:00 PM)"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 text-black"
                      style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14 }}
                    />
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl px-4 py-3.5">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={20} color="#fd6b03" />
                    <Text
                      className="text-black ml-3"
                      style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 16 }}
                    >
                      ends
                    </Text>
                  </View>
                  <View className="flex-row gap-3 ml-8">
                    <TextInput
                      value={newEvent.endDate}
                      onChangeText={(t) => setNewEvent((prev) => ({ ...prev, endDate: t }))}
                      placeholder="date (e.g. Feb 15)"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 text-black"
                      style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14 }}
                    />
                    <TextInput
                      value={newEvent.endTime}
                      onChangeText={(t) => setNewEvent((prev) => ({ ...prev, endTime: t }))}
                      placeholder="time (e.g. 8:00 PM)"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 text-black"
                      style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 14 }}
                    />
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View className="mx-6 mb-5">
                <Text
                  className="text-xs text-gray-400 uppercase tracking-wider mb-3"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  tags
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(interestLabels).map(([id, label]) => {
                    const selected = newEvent.tags.includes(id);
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => {
                          setNewEvent((prev) => ({
                            ...prev,
                            tags: selected
                              ? prev.tags.filter((t) => t !== id)
                              : prev.tags.length < 5 ? [...prev.tags, id] : prev.tags,
                          }));
                        }}
                        className="px-3 py-2 rounded-full"
                        style={{ backgroundColor: selected ? '#fd6b03' : '#F3F4F6' }}
                      >
                        <Text
                          className={`text-sm ${selected ? 'text-white' : 'text-gray-600'}`}
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text
                  className="text-xs text-gray-400 mt-2"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  select up to 5 tags
                </Text>
              </View>
            </ScrollView>

            {/* Publish button */}
            <View className="px-6 pb-6 pt-3 border-t border-gray-100">
              <TouchableOpacity
                className="w-full py-4 rounded-full items-center justify-center"
                style={{ backgroundColor: newEvent.title.trim() ? '#fd6b03' : '#FDBA74' }}
                activeOpacity={0.8}
                onPress={handlePublishEvent}
              >
                <Text
                  className="text-white text-base"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  publish event
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
