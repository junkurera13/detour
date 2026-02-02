import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

interface Message {
  _id: Id<'messages'>;
  matchId: Id<'matches'>;
  senderId: Id<'users'>;
  content: string;
  messageType: string;
  readAt?: number;
  createdAt: number;
  sender?: {
    _id: Id<'users'>;
    name: string;
    photos: string[];
  } | null;
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userId = convexUser?._id;

  // Fetch match details to get the other user's info
  const match = useQuery(
    api.matches.getById,
    matchId ? { id: matchId as Id<'matches'> } : 'skip'
  );

  // Fetch messages for this match - real-time updates!
  const messages = useQuery(
    api.messages.getByMatch,
    matchId ? { matchId: matchId as Id<'matches'> } : 'skip'
  );

  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Determine the other user
  const otherUser = match
    ? userId === match.user1Id
      ? match.user2
      : match.user1
    : null;

  // Mark messages as read when viewing
  useEffect(() => {
    if (matchId && userId && messages && messages.length > 0) {
      // Check if there are unread messages from the other user
      const hasUnread = messages.some(
        (msg) => msg.senderId !== userId && !msg.readAt
      );
      if (hasUnread) {
        markAsRead({
          matchId: matchId as Id<'matches'>,
          userId: userId,
        });
      }
    }
  }, [matchId, userId, messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !matchId || !userId || isSending) return;

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage({
        matchId: matchId as Id<'matches'>,
        senderId: userId,
        content: text,
        messageType: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(text); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === userId;
    const showTimestamp =
      index === 0 ||
      (messages &&
        messages[index - 1] &&
        item.createdAt - messages[index - 1].createdAt > 5 * 60 * 1000);

    return (
      <View>
        {showTimestamp && (
          <Text
            className="text-center text-gray-400 text-xs my-3"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        )}
        <View
          className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-2 px-4`}
        >
          <View
            className={`max-w-[75%] px-4 py-3 rounded-2xl ${
              isMe ? 'bg-orange-500 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'
            }`}
          >
            <Text
              className={isMe ? 'text-white' : 'text-black'}
              style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!match) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fd6b03" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 flex-row items-center ml-2">
          {otherUser?.photos?.[0] ? (
            <Image
              source={{ uri: otherUser.photos[0] }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}
          <View className="ml-3">
            <Text
              className="text-black text-lg"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {otherUser?.name?.toLowerCase() || 'unknown'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages || []}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
              </View>
              <Text
                className="text-gray-500 text-center px-10"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                no messages yet. say hi to {otherUser?.name?.toLowerCase() || 'your match'}!
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            if (messages && messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Message Input */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
          <View className="flex-1 flex-row items-end bg-gray-100 rounded-3xl px-4 py-2 mr-3">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              className="flex-1 max-h-24 text-black"
              style={{
                fontFamily: 'InstrumentSans_400Regular',
                fontSize: 16,
                paddingVertical: 8,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: messageText.trim() ? '#fd6b03' : '#E5E7EB',
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? '#fff' : '#9CA3AF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
