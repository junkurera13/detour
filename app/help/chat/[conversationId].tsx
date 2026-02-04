import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default function HelpChatScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const conversation = useQuery(
    api.helpMessages.getConversation,
    conversationId ? { id: conversationId as Id<"helpConversations"> } : "skip"
  );
  const messages = useQuery(
    api.helpMessages.getMessages,
    conversationId ? { conversationId: conversationId as Id<"helpConversations"> } : "skip"
  );
  const sendMessage = useMutation(api.helpMessages.sendMessage);
  const markAsRead = useMutation(api.helpMessages.markAsRead);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId: conversationId as Id<"helpConversations"> }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages?.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || isSending || !conversationId) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      await sendMessage({
        conversationId: conversationId as Id<"helpConversations">,
        content: messageText,
      });
    } catch {
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  if (conversation === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fd6b03" />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text
            className="flex-1 text-lg text-black ml-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            Chat
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500" style={{ fontFamily: 'InstrumentSans_400Regular' }}>
            Conversation not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Image
            source={{ uri: conversation.otherUser?.photos?.[0] || 'https://via.placeholder.com/40' }}
            className="w-10 h-10 rounded-full ml-2"
            resizeMode="cover"
          />

          <View className="flex-1 ml-3">
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {conversation.otherUser?.name || 'Unknown'}
            </Text>
            <Text
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
              numberOfLines={1}
            >
              {conversation.request?.title}
            </Text>
          </View>

          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text
              className="text-green-700"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {formatPrice(conversation.offer?.price || 0)}
            </Text>
          </View>
        </View>

        {/* Request Info Banner */}
        <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="bg-gray-200 px-2 py-1 rounded-full mr-2">
              <Text
                className="text-gray-600 text-xs"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {conversation.request?.category}
              </Text>
            </View>
            <View
              className={`px-2 py-1 rounded-full ${
                conversation.request?.status === 'in_progress'
                  ? 'bg-yellow-100'
                  : conversation.request?.status === 'completed'
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs ${
                  conversation.request?.status === 'in_progress'
                    ? 'text-yellow-700'
                    : conversation.request?.status === 'completed'
                    ? 'text-green-700'
                    : 'text-gray-700'
                }`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {conversation.request?.status?.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {/* Offer Message */}
          {conversation.offer?.message && (
            <View className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <Text
                className="text-orange-800 text-xs mb-1"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                original offer
              </Text>
              <Text
                className="text-gray-700"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {conversation.offer.message}
              </Text>
            </View>
          )}

          {/* Message List */}
          {messages?.map((msg, index) => {
            const showTimestamp =
              index === 0 ||
              msg.createdAt - messages[index - 1].createdAt > 3600000; // 1 hour

            return (
              <View key={msg._id}>
                {showTimestamp && (
                  <Text
                    className="text-gray-400 text-xs text-center my-3"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {formatTime(msg.createdAt)}
                  </Text>
                )}
                <View
                  className={`mb-2 max-w-[80%] ${
                    msg.isMine ? 'self-end' : 'self-start'
                  }`}
                >
                  <View
                    className={`px-4 py-3 rounded-2xl ${
                      msg.isMine
                        ? 'bg-orange-500 rounded-br-sm'
                        : 'bg-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <Text
                      className={msg.isMine ? 'text-white' : 'text-black'}
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-2 text-black max-h-24"
            style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || isSending}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              message.trim() && !isSending ? 'bg-orange-500' : 'bg-gray-200'
            }`}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !isSending ? '#fff' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
