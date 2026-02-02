import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';

// Interest ID to label mapping
const interestLabels: Record<string, string> = {
  'foodie': 'foodie',
  'cooking': 'cooking',
  'baking': 'baking',
  'coffee-cafes': 'coffee & cafes',
  'food-markets': 'food markets',
  'wine-tasting': 'wine tasting',
  'craft-beer': 'craft beer',
  'alcohol-free': 'alcohol-free',
  'vegan': 'vegan',
  'vegetarian': 'vegetarian',
  'hiking': 'hiking',
  'camping': 'camping',
  'rock-climbing': 'rock climbing',
  'surfing': 'surfing',
  'cycling': 'cycling',
  'mountaineering': 'mountaineering',
  'diving': 'diving',
  'beach': 'beach',
  'snowboarding': 'snowboarding',
  'skating': 'skating',
  'skiing': 'skiing',
  'pickleball': 'pickleball',
  'padel': 'padel',
  'soccer': 'soccer',
  'basketball': 'basketball',
  'tennis': 'tennis',
  'golf': 'golf',
  'park-days': 'park days',
  'urban-exploring': 'urban exploring',
  'nightlife': 'nightlife',
  'bars-drinks': 'bars & drinks',
  'clubbing': 'clubbing',
  'live-music': 'live music',
  'music': 'music',
  'karaoke': 'karaoke',
  'dancing': 'dancing',
  'comedy-shows': 'comedy shows',
  'shopping': 'shopping',
  'gaming': 'gaming',
  'anime': 'anime',
  'gym-lifting': 'gym / lifting',
  'yoga': 'yoga',
  'wellness': 'wellness',
  'running': 'running',
  'meditation': 'meditation',
  'cold-plunge': 'cold plunge',
  'spa': 'spa',
  'crossfit': 'crossfit',
  'museums-galleries': 'museums & galleries',
  'photography': 'photography',
  'street-art': 'street art',
  'local-history': 'local history',
  'film-cinema': 'film / cinema',
  'theatre': 'theatre',
  'local-markets': 'local markets',
  'history': 'history',
  'architecture': 'architecture',
  'language-exchange': 'language exchange',
  'entrepreneur': 'entrepreneur',
  'content-creator': 'content creator',
  'freelancer': 'freelancer',
  'cafe-working': 'cafe working',
  'productivity-nerd': 'productivity nerd',
  'festivals': 'festivals',
  'live-concerts': 'live concerts',
  'making-music': 'making music',
  'djing': 'DJing',
  'jam-sessions': 'jam sessions',
  'reading': 'reading',
  'journaling': 'journaling',
  'podcasts': 'podcasts',
  'sunsets': 'sunsets',
  'board-games': 'board games',
  'solo-exploring': 'solo exploring',
};

// Lifestyle ID to label mapping
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
  'workaway': 'workaway/volunteer',
};

interface MatchingRouteUser {
  id: string;
  name: string;
  age: number;
  photo: string;
  futureTrip: string;
  arrivalDate: string;
  lifestyle: string[];
  currentLocation: string;
}

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
}

// Mock data for matching routes
const mockMatchingUsers: MatchingRouteUser[] = [
  {
    id: '1',
    name: 'Maya',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    futureTrip: 'Bali',
    arrivalDate: 'Feb 15',
    lifestyle: ['digital-nomad', 'slow-travel'],
    currentLocation: 'Bangkok',
  },
  {
    id: '2',
    name: 'Alex',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    futureTrip: 'Bali',
    arrivalDate: 'Feb 18',
    lifestyle: ['backpacker', 'hostel-hopper'],
    currentLocation: 'Singapore',
  },
  {
    id: '3',
    name: 'Sophia',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    futureTrip: 'Bali',
    arrivalDate: 'Feb 20',
    lifestyle: ['van-life', 'perpetual-traveler'],
    currentLocation: 'Melbourne',
  },
  {
    id: '4',
    name: 'James',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    futureTrip: 'Bali',
    arrivalDate: 'Feb 22',
    lifestyle: ['digital-nomad', 'slow-travel'],
    currentLocation: 'Tokyo',
  },
  {
    id: '5',
    name: 'Luna',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    futureTrip: 'Bali',
    arrivalDate: 'Feb 25',
    lifestyle: ['content-creator', 'perpetual-traveler'],
    currentLocation: 'Seoul',
  },
];

// Mock data for activities
const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'sunrise surf session',
    category: 'surfing',
    photo: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
    host: { name: 'Kai', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
    date: 'Tomorrow',
    time: '6:00 AM',
    location: 'Echo Beach, Canggu',
    attendees: 4,
    maxAttendees: 8,
  },
  {
    id: '2',
    title: 'yoga & meditation retreat',
    category: 'yoga',
    photo: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
    host: { name: 'Priya', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
    date: 'Saturday',
    time: '7:30 AM',
    location: 'Ubud Yoga House',
    attendees: 12,
    maxAttendees: 15,
  },
  {
    id: '3',
    title: 'coffee tasting experience',
    category: 'coffee-cafes',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    host: { name: 'Marco', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
    date: 'Sunday',
    time: '10:00 AM',
    location: 'Seniman Coffee Studio',
    attendees: 6,
    maxAttendees: 10,
  },
  {
    id: '4',
    title: 'sunset hike to viewpoint',
    category: 'hiking',
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
    host: { name: 'Nina', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200' },
    date: 'Monday',
    time: '4:00 PM',
    location: 'Campuhan Ridge Walk',
    attendees: 8,
    maxAttendees: 12,
  },
  {
    id: '5',
    title: 'coworking & networking',
    category: 'cafe-working',
    photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600',
    host: { name: 'David', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200' },
    date: 'Tuesday',
    time: '9:00 AM',
    location: 'Dojo Bali',
    attendees: 15,
    maxAttendees: 25,
  },
  {
    id: '6',
    title: 'beach volleyball game',
    category: 'beach',
    photo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600',
    host: { name: 'Carlos', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200' },
    date: 'Wednesday',
    time: '5:00 PM',
    location: 'Seminyak Beach',
    attendees: 10,
    maxAttendees: 16,
  },
  {
    id: '7',
    title: 'live music & jam session',
    category: 'live-music',
    photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    host: { name: 'Zara', photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200' },
    date: 'Thursday',
    time: '7:00 PM',
    location: 'Old Man\'s Bar',
    attendees: 20,
    maxAttendees: 50,
  },
  {
    id: '8',
    title: 'photography walk',
    category: 'photography',
    photo: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600',
    host: { name: 'Liam', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
    date: 'Friday',
    time: '5:30 PM',
    location: 'Tanah Lot Temple',
    attendees: 5,
    maxAttendees: 8,
  },
];

export default function ExploreScreen() {
  const { data } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'people' | 'activity'>('people');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Get user's interests for filter pills
  const userInterests = data.interests || [];

  // Filter activities based on selected interest
  const filteredActivities = useMemo(() => {
    if (!selectedInterest) {
      // Show all activities that match any of user's interests
      return mockActivities.filter(activity =>
        userInterests.includes(activity.category)
      );
    }
    return mockActivities.filter(activity => activity.category === selectedInterest);
  }, [selectedInterest, userInterests]);

  // Check if user has a future trip set
  const hasFutureTrip = data.futureTrip && data.futureTrip.trim() !== '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          explore
        </Text>
      </View>

      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('people')}
          className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'people' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'people' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            people
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('activity')}
          className={`flex-1 py-3 rounded-full ml-2 ${activeTab === 'activity' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'activity' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            activity
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'people' ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Section: Matching Routes */}
          {hasFutureTrip && (
            <View className="mb-8">
              <View className="flex-row items-center px-6 mb-4">
                <Text
                  className="text-lg text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  heading your way
                </Text>
                <View className="ml-2 px-3 py-1 rounded-full bg-blue-100">
                  <Text
                    className="text-sm text-blue-600"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {data.futureTrip}
                  </Text>
                </View>
              </View>

              {mockMatchingUsers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24 }}
                >
                  {mockMatchingUsers.map((user, index) => (
                    <TouchableOpacity
                      key={user.id}
                      className="mr-3"
                      style={{ width: 120 }}
                      activeOpacity={0.8}
                    >
                      <View className="rounded-2xl overflow-hidden bg-gray-100">
                        <Image
                          source={{ uri: user.photo }}
                          style={{ width: 120, height: 112 }}
                          resizeMode="cover"
                        />
                        <View className="p-2">
                          <Text
                            className="text-sm text-black"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                            numberOfLines={1}
                          >
                            {user.name}, {user.age}
                          </Text>
                          <Text
                            className="text-xs text-gray-500 mt-0.5"
                            style={{ fontFamily: 'InstrumentSans_400Regular' }}
                          >
                            arrives {user.arrivalDate}
                          </Text>
                          {user.lifestyle[0] && (
                            <View className="mt-2 bg-orange-100 px-2 py-1 rounded-full self-start">
                              <Text
                                className="text-xs text-orange-600"
                                style={{ fontFamily: 'InstrumentSans_500Medium' }}
                                numberOfLines={1}
                              >
                                {lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="px-6">
                  <Text
                    className="text-gray-500 text-center py-8"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    no one else is heading to {data.futureTrip} yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Nearby people section */}
          <View className="px-6">
            <Text
              className="text-lg text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              nearby
            </Text>
            {mockMatchingUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: user.photo }}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4">
                  <Text
                    className="text-black text-lg"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {user.name}, {user.age}
                  </Text>
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {user.currentLocation}
                  </Text>
                  {user.lifestyle[0] && (
                    <View className="mt-1 bg-orange-100 px-2 py-0.5 rounded-full self-start">
                      <Text
                        className="text-xs text-orange-600"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        {lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Recommended Activities */}
          <View className="px-6 mb-4">
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              recommended for you
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
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  className="mb-4 rounded-2xl overflow-hidden bg-white"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  activeOpacity={0.9}
                >
                  {/* Activity photo with category badge */}
                  <View className="relative">
                    <Image
                      source={{ uri: activity.photo }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                    {/* Category badge overlay */}
                    <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
                      <Text
                        className="text-xs text-orange-600"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {interestLabels[activity.category] || activity.category}
                      </Text>
                    </View>
                  </View>

                  {/* Activity details */}
                  <View className="p-4">
                    <Text
                      className="text-lg text-black mb-2"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {activity.title}
                    </Text>

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
                          {activity.attendees}/{activity.maxAttendees}
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
                  no activities match your interests yet
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
