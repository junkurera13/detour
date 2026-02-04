import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const filterTabs = [
  { id: 'all', label: 'all' },
  { id: 'requests', label: 'my requests' },
  { id: 'offers', label: 'my offers' },
];

const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const formatPrice = (cents: number | undefined) => {
  if (cents == null) return '';
  return `$${(cents / 100).toFixed(0)}`;
};

export default function HelpChatsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Query conversations - will be undefined while loading, [] if empty or not authenticated
  const queryResult = useQuery(api.helpMessages.getMyConversations);

  const isLoading = queryResult === undefined;
  const allConversations = Array.isArray(queryResult) ? queryResult : [];

  // Filter conversations based on selected tab
  const conversations = selectedFilter === 'requests'
    ? allConversations.filter(c => c?.isRequester)
    : selectedFilter === 'offers'
    ? allConversations.filter(c => !c?.isRequester)
    : allConversations;

  const handleConversationPress = (conversationId: string) => {
    router.push(`/help/chat/${conversationId}` as any);
  };

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
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
        </View>
      ) : conversations.length === 0 ? (
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
            {selectedFilter === 'requests'
              ? "accept an offer on your request to start chatting"
              : selectedFilter === 'offers'
              ? "get your offer accepted to start chatting"
              : "chats will appear here when you have active help requests"}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          {conversations.map((conv) => {
            if (!conv) return null;
            return (
              <TouchableOpacity
                key={conv._id}
                onPress={() => handleConversationPress(conv._id)}
                className="flex-row items-center px-6 py-4 border-b border-gray-50"
                activeOpacity={0.7}
              >
                {/* Avatar */}
                <Image
                  source={{ uri: conv.otherUser?.photos?.[0] || 'https://via.placeholder.com/48' }}
                  className="w-14 h-14 rounded-full"
                  resizeMode="cover"
                />

                {/* Content */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className="text-black flex-1"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      numberOfLines={1}
                    >
                      {conv.otherUser?.name || 'Unknown'}
                    </Text>
                    {conv.lastMessage?.createdAt && (
                      <Text
                        className="text-gray-400 text-sm"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {formatTime(conv.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>

                  <Text
                    className="text-gray-500 text-sm mb-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    numberOfLines={1}
                  >
                    {conv.request?.title || 'Help request'}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-sm flex-1 ${(conv.unreadCount ?? 0) > 0 ? 'text-black' : 'text-gray-400'}`}
                      style={{ fontFamily: (conv.unreadCount ?? 0) > 0 ? 'InstrumentSans_600SemiBold' : 'InstrumentSans_400Regular' }}
                      numberOfLines={1}
                    >
                      {conv.lastMessage?.content || 'Start chatting...'}
                    </Text>
                    <View className="flex-row items-center ml-2">
                      {(conv.unreadCount ?? 0) > 0 && (
                        <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center mr-2">
                          <Text className="text-white text-xs" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                            {conv.unreadCount}
                          </Text>
                        </View>
                      )}
                      {conv.offer?.price != null && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                          <Text
                            className="text-green-700 text-xs"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          >
                            {formatPrice(conv.offer.price)}
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
      )}
    </SafeAreaView>
  );
}
