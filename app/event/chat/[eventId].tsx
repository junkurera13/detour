import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

interface ActivityMessage {
  _id: Id<'activityMessages'>;
  activityId: Id<'activities'>;
  senderId: Id<'users'>;
  content: string;
  messageType: string;
  createdAt: number;
  sender?: {
    _id: Id<'users'>;
    name: string;
    photo: string;
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

export default function ActivityChatScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userId = convexUser?._id;

  const activity = useQuery(
    api.activities.getById,
    eventId ? { id: eventId as Id<'activities'> } : 'skip',
  );

  const messages = useQuery(
    api.activityMessages.getByActivity,
    eventId ? { activityId: eventId as Id<'activities'> } : 'skip',
  );

  const sendMessage = useMutation(api.activityMessages.send);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !eventId || !userId || isSending) return;

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage({
        activityId: eventId as Id<'activities'>,
        content: text,
      });
    } catch (error) {
      console.warn('Failed to send message:', error);
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ActivityMessage; index: number }) => {
    const isMe = item.senderId === userId;
    const showTimestamp =
      index === 0 ||
      (messages &&
        messages[index - 1] &&
        item.createdAt - messages[index - 1].createdAt > 5 * 60 * 1000);

    // Show sender info for group messages from others
    const prevMsg = messages && index > 0 ? messages[index - 1] : null;
    const showSender = !isMe && (!prevMsg || prevMsg.senderId !== item.senderId || showTimestamp);

    return (
      <View>
        {showTimestamp && (
          <Text
            style={{
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: 12,
              fontFamily: 'InstrumentSans_400Regular',
              marginVertical: 12,
            }}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        )}
        {showSender && item.sender && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4, marginTop: 8 }}>
            <Image
              source={{ uri: item.sender.photo }}
              style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E7EB' }}
            />
            <Text
              style={{
                marginLeft: 6,
                fontSize: 12,
                color: '#6B7280',
                fontFamily: 'InstrumentSans_500Medium',
              }}
            >
              {item.sender.name}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            marginBottom: 4,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              maxWidth: '75%',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 20,
              backgroundColor: isMe ? '#fd6b03' : '#F3F4F6',
              borderBottomRightRadius: isMe ? 4 : 20,
              borderBottomLeftRadius: isMe ? 20 : 4,
            }}
          >
            <Text
              style={{
                color: isMe ? '#fff' : '#000',
                fontSize: 15,
                fontFamily: 'InstrumentSans_400Regular',
                lineHeight: 21,
              }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const attendeeCount = activity ? activity.attendeeIds.length + 1 : 0; // +1 for host

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#000' }}
            numberOfLines={1}
          >
            {activity?.title || 'group chat'}
          </Text>
          <Text
            style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#9CA3AF' }}
          >
            {attendeeCount} participants
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="chatbubbles-outline" size={40} color="#E5E7EB" />
              <Text
                style={{
                  fontFamily: 'InstrumentSans_400Regular',
                  fontSize: 14,
                  color: '#9CA3AF',
                  marginTop: 12,
                  textAlign: 'center',
                  paddingHorizontal: 40,
                }}
              >
                no messages yet. say hi to the group!
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
          <View className="flex-1 flex-row items-end bg-gray-100 rounded-3xl px-4 mr-3" style={{ minHeight: 44 }}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={5000}
              className="flex-1 max-h-24 text-black"
              style={{
                fontFamily: 'InstrumentSans_400Regular',
                fontSize: 16,
                paddingTop: 10,
                paddingBottom: 10,
              }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            className="rounded-full items-center justify-center"
            style={{
              width: 44,
              height: 44,
              backgroundColor: messageText.trim() ? '#fd6b03' : '#E5E7EB',
            }}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? '#fff' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
