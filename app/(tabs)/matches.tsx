import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '@/convex/_generated/api';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { mockLikesYou, mockMatches, mockConversations } from '@/data/mockData';

// Helper to format relative time
function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return 'recently';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// Helper to calculate age from birthday
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

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'matches' | 'messages'>('matches');
  const { convexUser } = useAuthenticatedUser();
  const router = useRouter();
  const userId = convexUser?._id;

  const handleOpenChat = (matchId: string) => {
    // Only navigate to real chats (Convex IDs), not mock data
    if (!matchId.startsWith('match_') && !matchId.startsWith('conv_')) {
      router.push(`/chat/${matchId}`);
    }
  };

  // Fetch matches from Convex
  const matchesData = useQuery(
    api.matches.getByUser,
    userId ? { userId } : "skip"
  );

  // Fetch conversation previews for messages tab
  const conversationPreviews = useQuery(
    api.messages.getConversationPreviews,
    userId ? { userId } : "skip"
  );

  const isLoading = userId && matchesData === undefined;

  // Transform matches for display, fall back to mock data
  const matches = useMemo(() => {
    // If we have real matches from Convex, use them
    if (matchesData && matchesData.length > 0) {
      return matchesData.map((match) => {
        const otherUser = match.otherUser;
        const isNew = match.matchedAt && (Date.now() - match.matchedAt) < 24 * 60 * 60 * 1000;
        return {
          id: match._id,
          name: otherUser?.name ?? 'Unknown',
          age: otherUser?.birthday ? calculateAge(otherUser.birthday) : 0,
          matchedAt: formatRelativeTime(match.matchedAt),
          photo: otherUser?.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          isNew,
        };
      });
    }
    // Fall back to mock matches for testing
    return mockMatches.map((match) => ({
      id: match.id,
      name: match.user.name,
      age: match.user.age,
      matchedAt: match.matchedAt,
      photo: match.user.photos[0],
      isNew: match.hasNewMessage,
    }));
  }, [matchesData]);

  // For messages tab, use real conversation previews or fall back to mock
  const conversations = useMemo(() => {
    // If we have real conversation previews from Convex, use them
    if (conversationPreviews && conversationPreviews.length > 0) {
      return conversationPreviews.map((preview) => {
        const otherUser = preview.otherUser;
        return {
          id: preview.matchId,
          name: otherUser?.name ?? 'Unknown',
          lastMessage: preview.lastMessage?.content || 'Start a conversation!',
          time: formatRelativeTime(preview.lastMessage?.createdAt || preview.matchedAt),
          photo: otherUser?.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          unread: preview.unreadCount,
          online: false,
        };
      });
    }
    // Fall back to mock conversations for testing
    return mockConversations.map((convo) => ({
      id: convo.id,
      name: convo.user.name,
      lastMessage: convo.messages[convo.messages.length - 1]?.content || 'Start a conversation!',
      time: convo.lastMessageAt,
      photo: convo.user.photos[0],
      unread: convo.unreadCount,
      online: convo.user.isOnline || false,
    }));
  }, [conversationPreviews]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          connections
        </Text>
      </View>

      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('matches')}
          className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'matches' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'matches' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            matches
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          className={`flex-1 py-3 rounded-full ml-2 ${activeTab === 'messages' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'messages' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            messages
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'matches' ? (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#fd6b03" />
              <Text
                className="text-gray-500 mt-4"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                loading your connections...
              </Text>
            </View>
          ) : (
          <View className="pt-2">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg text-black"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                likes you
              </Text>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#fd6b03' }}>
                <Text
                  className="text-white text-sm"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {mockLikesYou.length}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
              contentContainerStyle={{ gap: 12 }}
            >
              {mockLikesYou.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  className="relative"
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: user.photos[0] }}
                    className="w-24 h-32 rounded-2xl"
                    resizeMode="cover"
                    blurRadius={20}
                  />
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                      <Ionicons name="lock-closed" size={20} color="#000" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="w-24 h-32 bg-gray-100 rounded-2xl items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="eye" size={24} color="#000" />
                <Text
                  className="text-black text-xs mt-2 text-center"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  see all
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <Text
              className="text-lg text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              your matches
            </Text>

            {matches.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="heart-outline" size={32} color="#9CA3AF" />
                </View>
                <Text
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  no matches yet. keep exploring!
                </Text>
              </View>
            ) : (
              matches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
                  activeOpacity={0.7}
                  onPress={() => handleOpenChat(match.id)}
                >
                  <View className="relative">
                    <Image
                      source={{ uri: match.photo }}
                      className="w-16 h-16 rounded-full"
                      resizeMode="cover"
                    />
                    {match.isNew && (
                      <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </View>
                  <View className="flex-1 ml-4">
                    <Text
                      className="text-black text-lg"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {match.name}, {match.age}
                    </Text>
                    <Text
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      matched {match.matchedAt}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="w-10 h-10 bg-white rounded-full items-center justify-center"
                    onPress={() => handleOpenChat(match.id)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#000" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {conversations.length === 0 ? (
            <View className="items-center py-20 px-6">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
              </View>
              <Text
                className="text-xl text-black text-center mb-2"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                no messages yet
              </Text>
              <Text
                className="text-gray-500 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                when you match with someone, you can start a conversation here.
              </Text>
            </View>
          ) : (
            conversations.map((convo) => (
              <TouchableOpacity
                key={convo.id}
                className="flex-row px-6 py-4 border-b border-gray-100"
                activeOpacity={0.7}
                onPress={() => handleOpenChat(convo.id)}
              >
                <View className="relative">
                  <Image
                    source={{ uri: convo.photo }}
                    className="w-14 h-14 rounded-full"
                    resizeMode="cover"
                  />
                  {convo.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                <View className="flex-1 ml-4">
                  <Text
                    className="text-black text-base"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {convo.name}
                  </Text>
                  <Text
                    className={`text-sm mt-0.5 ${convo.unread > 0 ? 'text-black' : 'text-gray-500'}`}
                    style={{ fontFamily: convo.unread > 0 ? 'InstrumentSans_500Medium' : 'InstrumentSans_400Regular', maxWidth: '92%' }}
                    numberOfLines={1}
                  >
                    {convo.lastMessage}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {convo.time}
                  </Text>
                  {convo.unread > 0 && (
                    <View className="w-6 h-6 rounded-full items-center justify-center mt-1" style={{ backgroundColor: '#fd6b03' }}>
                      <Text
                        className="text-white text-xs"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {convo.unread}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
