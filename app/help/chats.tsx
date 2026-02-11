import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const filterTabs = [
  { id: 'requests', label: 'requests' },
  { id: 'offers', label: 'offers' },
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

const stepLabel = (step?: string) => {
  switch (step) {
    case 'negotiation': return 'negotiation';
    case 'working': return 'in progress';
    case 'payment': return 'payment';
    case 'completed': return 'completed';
    default: return '';
  }
};

const stepColor = (step?: string) => {
  switch (step) {
    case 'negotiation': return { bg: '#FEF3C7', text: '#92400E' };
    case 'working': return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'payment': return { bg: '#FEE2E2', text: '#991B1B' };
    case 'completed': return { bg: '#DCFCE7', text: '#166534' };
    default: return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

export default function HelpChatsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('requests');

  const conversations = useQuery(api.helpMessages.getMyConversations);

  const filtered = conversations?.filter((conv) => {
    if (selectedFilter === 'requests') return conv.isRequester;
    if (selectedFilter === 'offers') return !conv.isRequester;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className="flex-1 text-lg text-black ml-2"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          help chats
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedFilter(tab.id)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: selectedFilter === tab.id ? '#000' : '#F3F4F6' }}
            >
              <Text
                className={`text-sm ${selectedFilter === tab.id ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {conversations === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
        </View>
      ) : filtered && filtered.length > 0 ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filtered.map((conv) => {
            const colors = stepColor(conv.request?.progressStep);
            return (
              <TouchableOpacity
                key={conv._id}
                onPress={() => router.push(`/help/chat/${conv._id}`)}
                className="flex-row items-center px-6 py-4 border-b border-gray-50"
                activeOpacity={0.7}
              >
                {/* Avatar */}
                {conv.otherUser?.photos?.[0] ? (
                  <Image source={{ uri: conv.otherUser.photos[0] }} className="w-12 h-12 rounded-full" resizeMode="cover" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  </View>
                )}

                {/* Content */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className="text-black flex-1 mr-2"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      numberOfLines={1}
                    >
                      {conv.otherUser?.name || 'Unknown'}
                    </Text>
                    {conv.lastMessage && (
                      <Text
                        className="text-gray-400 text-xs"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {formatTime(conv.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>

                  {/* Request title */}
                  <Text
                    className="text-gray-500 text-sm mb-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    numberOfLines={1}
                  >
                    {conv.request?.title}
                  </Text>

                  {/* Bottom row: last message + badges */}
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-gray-400 text-xs flex-1 mr-2"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      numberOfLines={1}
                    >
                      {conv.lastMessage
                        ? conv.lastMessage.senderId === conv.otherUser?._id
                          ? conv.lastMessage.content
                          : `you: ${conv.lastMessage.content}`
                        : 'no messages yet'}
                    </Text>
                    <View className="flex-row items-center">
                      {/* Progress step badge */}
                      {conv.request?.progressStep && (
                        <View
                          className="px-2 py-0.5 rounded-full mr-1"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <Text
                            className="text-xs"
                            style={{ fontFamily: 'InstrumentSans_500Medium', color: colors.text }}
                          >
                            {stepLabel(conv.request.progressStep)}
                          </Text>
                        </View>
                      )}
                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <View className="bg-orange-500 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: '#fd6b03' }}>
                          <Text className="text-white text-xs" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                            {conv.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
          </View>
          <Text
            className="text-xl text-black text-center mb-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            no chats yet
          </Text>
          <Text
            className="text-gray-500 text-center"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            chats will appear here when you have active help requests
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
