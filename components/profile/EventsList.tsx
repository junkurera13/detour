import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

type Activity = {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  host: {
    _id: string;
    name: string;
    photo: string;
  };
};

interface EventsListProps {
  events: Activity[] | undefined;
  profileName: string;
  router: Router;
}

export function EventsList({ events, profileName, router }: EventsListProps) {
  return (
    <View className="px-6 mb-6">
      {events && events.length > 0 ? (
        events.map((activity) => {
          const isHost = activity.host.name.toLowerCase() === profileName.toLowerCase();
          return (
            <TouchableOpacity
              key={activity._id}
              className="flex-row items-center py-3 border-b border-gray-50"
              activeOpacity={0.7}
              onPress={() => router.push(`/event/${activity._id}`)}
            >
              <Image
                source={{ uri: activity.image || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&h=400&fit=crop' }}
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
                    {activity.title.toLowerCase()}
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
  );
}
