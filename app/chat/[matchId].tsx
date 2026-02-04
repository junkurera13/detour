import { useState, useRef, useEffect, useCallback } from 'react';
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
  Alert,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import * as ImagePicker from 'expo-image-picker';

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
  const [showMenu, setShowMenu] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { uploadPhotos, isUploading } = usePhotoUpload();

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

  // Fetch typing status
  const typingStatus = useQuery(
    api.typing.getTypingStatus,
    matchId && userId
      ? { matchId: matchId as Id<'matches'>, currentUserId: userId }
      : 'skip'
  );

  // Check if blocked
  const blockStatus = useQuery(
    api.blocks.isBlocked,
    userId && match
      ? {
          userId1: userId,
          userId2: match.user1Id === userId ? match.user2Id : match.user1Id,
        }
      : 'skip'
  );

  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const markAsRead = useMutation(api.messages.markAsRead);
  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  const blockUser = useMutation(api.blocks.blockUser);

  // Determine the other user
  const otherUser = match
    ? userId === match.user1Id
      ? match.user2
      : match.user1
    : null;

  const otherUserId = match
    ? userId === match.user1Id
      ? match.user2Id
      : match.user1Id
    : null;

  // Mark messages as read when viewing
  useEffect(() => {
    if (matchId && userId && messages && messages.length > 0) {
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
  }, [matchId, userId, messages, markAsRead]);

  // Clear typing status when leaving screen
  useEffect(() => {
    return () => {
      if (userId) {
        clearTyping({ userId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, clearTyping]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);

      if (!matchId || !userId) return;

      // Set typing to true
      if (text.length > 0) {
        setTyping({
          matchId: matchId as Id<'matches'>,
          userId,
          isTyping: true,
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to clear typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTyping({
            matchId: matchId as Id<'matches'>,
            userId,
            isTyping: false,
          });
        }, 3000);
      } else {
        // Clear typing immediately when text is empty
        setTyping({
          matchId: matchId as Id<'matches'>,
          userId,
          isTyping: false,
        });
      }
    },
    [matchId, userId, setTyping]
  );

  const handleSend = async () => {
    if (!messageText.trim() || !matchId || !userId || isSending) return;
    if (blockStatus?.blocked) {
      Alert.alert('Cannot send message', 'This conversation has been blocked.');
      return;
    }

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    // Clear typing status
    setTyping({
      matchId: matchId as Id<'matches'>,
      userId,
      isTyping: false,
    });

    try {
      await sendMessage({
        matchId: matchId as Id<'matches'>,
        senderId: userId,
        content: text,
        messageType: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickImage = async () => {
    if (blockStatus?.blocked) {
      Alert.alert('Cannot send image', 'This conversation has been blocked.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImagePreview(result.assets[0].uri);
    }
  };

  const handleSendImage = async () => {
    if (!imagePreview || !matchId || !userId || isSending) return;

    setIsSending(true);
    try {
      const [uploadedUrl] = await uploadPhotos([imagePreview]);
      await sendMessage({
        matchId: matchId as Id<'matches'>,
        senderId: userId,
        content: uploadedUrl,
        messageType: 'image',
      });
      setImagePreview(null);
    } catch (error) {
      console.error('Failed to send image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBlock = () => {
    if (!userId || !otherUserId) return;

    Alert.alert(
      `Block ${otherUser?.name?.toLowerCase() || 'this user'}?`,
      'They won\'t be able to message you, and you won\'t see each other in the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser({ blockerId: userId, blockedId: otherUserId });
              setShowMenu(false);
              router.back();
            } catch (error) {
              console.error('Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === userId;
    const showTimestamp =
      index === 0 ||
      (messages &&
        messages[index - 1] &&
        item.createdAt - messages[index - 1].createdAt > 5 * 60 * 1000);

    const isImage = item.messageType === 'image';

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
          {isImage ? (
            <TouchableOpacity
              className={`max-w-[75%] rounded-2xl overflow-hidden ${
                isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
            >
              <Image
                source={{ uri: item.content }}
                style={{ width: 200, height: 200 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
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
          )}
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

  // Show blocked state
  if (blockStatus?.blocked) {
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
          <View className="flex-1 ml-2">
            <Text
              className="text-black text-lg"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {otherUser?.name?.toLowerCase() || 'unknown'}
            </Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="ban-outline" size={40} color="#9CA3AF" />
          </View>
          <Text
            className="text-gray-500 text-center"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {blockStatus.blockedBy === userId
              ? 'You have blocked this user'
              : 'This conversation is no longer available'}
          </Text>
        </View>
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
            {/* Typing indicator in header */}
            {typingStatus?.isTyping && (
              <Text
                className="text-orange-500 text-xs"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                typing...
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          className="w-10 h-10 items-center justify-center"
        >
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
          ListFooterComponent={
            typingStatus?.isTyping ? (
              <View className="flex-row justify-start mb-2 px-4">
                <View className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <View className="flex-row items-center gap-1">
                    <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                    <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </View>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() => {
            if (messages && messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Message Input */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
          {/* Image picker button */}
          <TouchableOpacity
            onPress={handlePickImage}
            className="w-12 h-12 items-center justify-center"
            disabled={isUploading || isSending}
          >
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-end bg-gray-100 rounded-3xl px-4 py-2 mr-3">
            <TextInput
              value={messageText}
              onChangeText={handleTyping}
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

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowMenu(false)}
        >
          <View className="bg-white rounded-t-3xl pb-8">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-4" />

            <TouchableOpacity
              onPress={handleBlock}
              className="flex-row items-center px-6 py-4"
            >
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                <Ionicons name="ban-outline" size={20} color="#EF4444" />
              </View>
              <View className="ml-4">
                <Text
                  className="text-red-500 text-base"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  block {otherUser?.name?.toLowerCase() || 'user'}
                </Text>
                <Text
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {"they won't be able to message you"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              className="mx-6 mt-4 py-4 rounded-2xl bg-gray-100 items-center"
            >
              <Text
                className="text-black text-base"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!imagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <SafeAreaView className="flex-1 w-full">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <TouchableOpacity
                onPress={() => setImagePreview(null)}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text
                className="text-white text-lg"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                send photo
              </Text>
              <View className="w-10" />
            </View>

            {/* Image Preview */}
            <View className="flex-1 justify-center items-center px-4">
              {imagePreview && (
                <Image
                  source={{ uri: imagePreview }}
                  style={{
                    width: Dimensions.get('window').width - 32,
                    height: Dimensions.get('window').width - 32,
                    borderRadius: 16,
                  }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Send Button */}
            <View className="px-6 pb-6">
              <TouchableOpacity
                onPress={handleSendImage}
                disabled={isSending || isUploading}
                style={{
                  backgroundColor: isSending || isUploading ? '#fca560' : '#fd6b03',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {(isSending || isUploading) && <ActivityIndicator color="#fff" size="small" />}
                <Text
                  className="text-white text-lg"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {isSending || isUploading ? 'sending...' : 'send'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
