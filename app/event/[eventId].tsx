import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { mockActivities, mockUsers } from '@/data/mockData';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEvents } from '@/context/EventsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const interestLabels: Record<string, string> = {
  'surfing': 'surfing', 'coffee': 'coffee', 'yoga': 'yoga', 'food': 'food',
  'fitness': 'fitness', 'photography': 'photography', 'music': 'music',
  'entrepreneur': 'entrepreneur', 'diving': 'diving', 'cooking': 'cooking',
  'grab-coffee': 'grab coffee', 'try-street-food': 'try street food',
  'cook-together': 'cook together', 'hit-night-markets': 'hit night markets',
  'go-wine-tasting': 'go wine tasting', 'try-local-beer': 'try local beer',
  'brunch-dates': 'brunch dates', 'find-hidden-gems': 'find hidden gems',
  'go-hiking': 'go hiking', 'go-surfing': 'go surfing', 'go-diving': 'go diving',
  'go-camping': 'go camping', 'go-climbing': 'go climbing', 'go-cycling': 'go cycling',
  'beach-days': 'beach days', 'go-skating': 'go skating', 'go-skiing': 'go skiing',
  'explore-the-city': 'explore the city', 'road-trips': 'road trips',
  'grab-drinks': 'grab drinks', 'go-dancing': 'go dancing',
  'see-live-music': 'see live music', 'go-clubbing': 'go clubbing',
  'do-karaoke': 'do karaoke', 'see-comedy': 'see comedy',
  'go-to-festivals': 'go to festivals', 'hit-the-gym': 'hit the gym',
  'do-yoga': 'do yoga', 'go-running': 'go running', 'do-crossfit': 'do crossfit',
  'try-muay-thai': 'try muay thai', 'visit-museums': 'visit museums',
  'take-photos': 'take photos', 'cowork-at-cafes': 'cowork at cafes',
  'make-content': 'make content', 'build-stuff': 'build stuff',
  'watch-sunsets': 'watch sunsets', 'play-board-games': 'play board games',
  'meditate': 'meditate', 'spa-days': 'spa days',
};

// Generate deterministic attendees for an activity based on its id
function getAttendees(activityId: string, count: number) {
  let hash = 0;
  for (let i = 0; i < activityId.length; i++) {
    hash = ((hash << 5) - hash) + activityId.charCodeAt(i);
    hash |= 0;
  }
  const start = Math.abs(hash) % mockUsers.length;
  const attendees = [];
  for (let i = 0; i < Math.min(count, mockUsers.length); i++) {
    const user = mockUsers[(start + i) % mockUsers.length];
    attendees.push({ name: user.name, photo: user.photos[0] });
  }
  return attendees;
}

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useCurrentUser();
  const { isJoined, isSaved, toggleJoin, toggleSave } = useEvents();
  const joined = eventId ? isJoined(eventId) : false;
  const saved = eventId ? isSaved(eventId) : false;

  const activity = useMemo(() => {
    return mockActivities.find((a) => a.id === eventId) || null;
  }, [eventId]);

  const baseAttendees = useMemo(() => {
    if (!activity) return [];
    return getAttendees(activity.id, activity.attendees);
  }, [activity]);

  // Include current user in attendees when joined
  const attendees = useMemo(() => {
    if (!joined) return baseAttendees;
    const me = {
      name: user?.name || 'You',
      photo: user?.photos?.[0] || '',
    };
    return [me, ...baseAttendees];
  }, [baseAttendees, joined, user]);

  const totalAttendees = activity ? activity.attendees + (joined ? 1 : 0) : 0;

  // Preview names for the "event details" card
  const previewNames = useMemo(() => {
    if (attendees.length === 0) return '';
    if (attendees.length === 1) return attendees[0].name;
    if (attendees.length === 2) return `${attendees[0].name} and ${attendees[1].name}`;
    return `${attendees[0].name}, ${attendees[1].name} and more`;
  }, [attendees]);

  if (!activity) {
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
          <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
          <Text
            className="text-gray-400 mt-4"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            event not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        bounces={false}
      >
        {/* Hero image */}
        <View className="relative">
          <Image
            source={{ uri: activity.image }}
            style={{ width: SCREEN_WIDTH, height: 280 }}
            resizeMode="cover"
          />
          {/* Back button */}
          <SafeAreaView
            edges={['top']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
          >
            <View className="px-6 pt-2 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>

        {/* Event details card — overlaps hero */}
        <View
          className="bg-white mx-4 px-5 pt-5 pb-4 rounded-2xl"
          style={{
            marginTop: -32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Text
            className="text-xs text-gray-400 uppercase tracking-wider mb-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            event details
          </Text>
          <Text
            className="text-2xl text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {activity.title}
          </Text>

          {/* Participants row */}
          <View className="flex-row items-center mb-4">
            <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center">
              <Ionicons name="people-outline" size={18} color="#fd6b03" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-black text-base"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {totalAttendees} participants
              </Text>
              <Text
                className="text-gray-400 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
                numberOfLines={1}
              >
                {previewNames}
              </Text>
            </View>
            {/* Overlapping avatars */}
            <View className="flex-row items-center" style={{ marginLeft: 8 }}>
              {attendees.slice(0, 3).map((a, i) => (
                <Image
                  key={i}
                  source={{ uri: a.photo }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#fff',
                    marginLeft: i === 0 ? 0 : -10,
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>

          {/* Date/time row */}
          <View className="flex-row items-center mb-4">
            <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center">
              <Ionicons name="calendar-outline" size={18} color="#fd6b03" />
            </View>
            <View className="ml-3">
              <Text
                className="text-black text-base"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {activity.date}, {activity.time}
              </Text>
              <Text
                className="text-gray-400 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                local time
              </Text>
            </View>
          </View>

          {/* Location row */}
          <View className="flex-row items-center mb-4">
            <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center">
              <Ionicons name="location-outline" size={18} color="#fd6b03" />
            </View>
            <View className="ml-3">
              <Text
                className="text-black text-base"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {activity.location}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 pt-3 border-t border-gray-100">
              {activity.tags.map((tag) => (
                <View key={tag} className="bg-gray-100 px-3 py-1.5 rounded-full">
                  <Text
                    className="text-gray-500 text-xs"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {interestLabels[tag] || tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* About event section */}
        <View
          className="bg-white mx-4 px-5 pt-5 pb-5 rounded-2xl mt-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            className="text-xs text-gray-400 uppercase tracking-wider mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            about event
          </Text>
          <Text
            className="text-black text-base leading-6"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {activity.description}
          </Text>
        </View>

        {/* Participants section */}
        <View
          className="bg-white mx-4 px-5 pt-5 pb-3 rounded-2xl mt-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text
                className="text-xs text-gray-400 uppercase tracking-wider"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                participants
              </Text>
              <Text
                className="text-xs text-gray-400 ml-2"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {totalAttendees}
              </Text>
            </View>
          </View>

          {/* Host */}
          <View className="flex-row items-center py-3 border-b border-gray-50">
            <Image
              source={{ uri: activity.host.avatar }}
              className="w-12 h-12 rounded-full"
              resizeMode="cover"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text
                  className="text-black text-base"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {activity.host.name}
                </Text>
                <View className="bg-orange-100 rounded-full px-2 py-0.5 ml-2">
                  <Text
                    className="text-orange-600 text-xs"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    host
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Attendees list */}
          {attendees.map((attendee, index) => (
            <View
              key={index}
              className={`flex-row items-center py-3 ${index < attendees.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <Image
                source={{ uri: attendee.photo }}
                className="w-12 h-12 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-3 flex-1">
                <Text
                  className="text-black text-base"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {attendee.name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
        style={{
          paddingBottom: 34,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between px-6 pt-3">
          {/* Left actions */}
          <View className="flex-row items-center gap-2">
<TouchableOpacity
              onPress={() => Share.share({ message: `Check out "${activity.title}" on Detour!` })}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Join / Joined button */}
          <TouchableOpacity
            className="flex-row items-center px-6 py-3 rounded-full"
            style={{ backgroundColor: joined ? '#F3F4F6' : '#fd6b03' }}
            activeOpacity={0.8}
            onPress={() => eventId && toggleJoin(eventId)}
          >
            <Ionicons
              name={joined ? 'checkmark' : 'add'}
              size={20}
              color={joined ? '#374151' : '#fff'}
            />
            <Text
              className={`text-base ml-1 ${joined ? 'text-gray-700' : 'text-white'}`}
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {joined ? 'joined' : 'join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-dot dropdown menu */}
      {menuOpen && (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            className="absolute bg-white rounded-xl py-2"
            style={{
              bottom: 90,
              left: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              minWidth: 200,
            }}
          >
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => { if (eventId) toggleSave(eventId); setMenuOpen(false); }}
              activeOpacity={0.7}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color="#374151" />
              <Text
                className="text-gray-800 ml-3"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {saved ? 'unsave event' : 'save event'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => setMenuOpen(false)}
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
              onPress={() => setMenuOpen(false)}
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
        </>
      )}
    </View>
  );
}
