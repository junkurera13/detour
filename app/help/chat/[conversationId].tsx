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
  Alert,
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

const PROGRESS_STEPS = [
  { key: 'negotiation', label: 'negotiation' },
  { key: 'working', label: 'in progress' },
  { key: 'payment', label: 'payment' },
  { key: 'completed', label: 'closed' },
] as const;

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
  const advanceProgress = useMutation(api.helpRequests.advanceProgress);
  const updateOffer = useMutation(api.helpOffers.update);

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId: conversationId as Id<"helpConversations"> }).catch((e) => console.warn('Failed to mark messages as read:', e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages?.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.length) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages?.length]);

  const handleContentSizeChange = () => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

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

  const handleAdvanceProgress = (confirmTitle: string, confirmMessage: string) => {
    if (!conversation?.request?._id || isAdvancing) return;
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'confirm',
        onPress: async () => {
          setIsAdvancing(true);
          try {
            await advanceProgress({ requestId: conversation.request!._id });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to advance progress.');
          } finally {
            setIsAdvancing(false);
          }
        },
      },
    ]);
  };

  const handleUpdatePrice = async () => {
    if (!conversation?.offer?._id) return;
    const cents = Math.round(parseFloat(priceInput) * 100);
    if (isNaN(cents) || cents <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }
    try {
      await updateOffer({ id: conversation.offer._id, price: cents });
      setEditingPrice(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update price.');
    }
  };

  const currentStep = conversation?.request?.progressStep || 'negotiation';
  const stepIndex = PROGRESS_STEPS.findIndex((s) => s.key === currentStep);
  const isRequester = conversation?.isRequester ?? false;
  const isOfferer = !isRequester;

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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          {conversation.otherUser?.photos?.[0] ? (
            <Image source={{ uri: conversation.otherUser.photos[0] }} className="w-10 h-10 rounded-full ml-2" resizeMode="cover" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center ml-2">
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}

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

          {conversation.offer?.price ? (
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text
                className="text-green-700"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {formatPrice(conversation.offer.price)}
              </Text>
            </View>
          ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Progress Tracker */}
        <View className="px-4 py-4 bg-gray-50 border-b border-gray-100">
          {/* Step Indicators */}
          <View className="flex-row items-center justify-between mb-3">
            {PROGRESS_STEPS.map((step, i) => {
              const isCompleted = i < stepIndex;
              const isCurrent = i === stepIndex;

              return (
                <View key={step.key} className="flex-row items-center" style={{ flex: i < PROGRESS_STEPS.length - 1 ? 1 : 0 }}>
                  {/* Circle */}
                  <View className="items-center">
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isCompleted || isCurrent ? '#fd6b03' : '#E5E7EB',
                      }}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : isCurrent ? (
                        <View className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : null}
                    </View>
                    <Text
                      className="text-center mt-1"
                      style={{
                        fontFamily: isCurrent ? 'InstrumentSans_600SemiBold' : 'InstrumentSans_400Regular',
                        fontSize: 10,
                        color: isCompleted || isCurrent ? '#fd6b03' : '#9CA3AF',
                      }}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {/* Line */}
                  {i < PROGRESS_STEPS.length - 1 && (
                    <View
                      className="h-0.5 mx-1"
                      style={{
                        flex: 1,
                        backgroundColor: i < stepIndex ? '#fd6b03' : '#E5E7EB',
                        marginBottom: 16,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Step Action Area */}
          {currentStep === 'negotiation' && (
            <View>
              <Text
                className="text-gray-500 text-xs text-center mb-2"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                discuss details and agree on terms
              </Text>
              {/* Price display/edit */}
              {isOfferer && (
                <View className="flex-row items-center justify-center mb-2">
                  {editingPrice ? (
                    <View className="flex-row items-center bg-white rounded-xl px-3 py-2">
                      <Text className="text-gray-400 mr-1">$</Text>
                      <TextInput
                        value={priceInput}
                        onChangeText={setPriceInput}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        className="text-black text-base w-20"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleUpdatePrice} className="ml-2 bg-orange-500 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#fd6b03' }}>
                        <Text className="text-white text-xs" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingPrice(false)} className="ml-1 px-2 py-1.5">
                        <Ionicons name="close" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setPriceInput(conversation.offer?.price ? (conversation.offer.price / 100).toString() : '');
                        setEditingPrice(true);
                      }}
                      className="flex-row items-center"
                    >
                      <Text
                        className="text-gray-600 text-sm"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        {conversation.offer?.price ? formatPrice(conversation.offer.price) : 'no price set'}
                      </Text>
                      <Ionicons name="pencil" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {isRequester && conversation.offer?.price && (
                <Text
                  className="text-gray-600 text-sm text-center mb-2"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  agreed price: {formatPrice(conversation.offer.price)}
                </Text>
              )}
              {isOfferer && (
                <TouchableOpacity
                  onPress={() => handleAdvanceProgress('Start work', 'Ready to start working on this request?')}
                  disabled={isAdvancing}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: '#fd6b03' }}
                >
                  <Text className="text-white" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                    {isAdvancing ? 'starting...' : 'start work'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {currentStep === 'working' && (
            <View>
              <Text
                className="text-gray-500 text-xs text-center mb-2"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                work is being done
              </Text>
              {isRequester && (
                <TouchableOpacity
                  onPress={() => handleAdvanceProgress('Confirm work done', 'Has the work been completed to your satisfaction?')}
                  disabled={isAdvancing}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: '#fd6b03' }}
                >
                  <Text className="text-white" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                    {isAdvancing ? 'confirming...' : 'confirm work done'}
                  </Text>
                </TouchableOpacity>
              )}
              {isOfferer && (
                <Text
                  className="text-gray-400 text-xs text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  waiting for requester to confirm
                </Text>
              )}
            </View>
          )}

          {currentStep === 'payment' && (
            <View>
              <Text
                className="text-gray-500 text-xs text-center mb-2"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {isRequester ? 'send payment to helper' : 'waiting for payment'}
              </Text>
              {conversation.offer?.price && (
                <Text
                  className="text-black text-lg text-center mb-2"
                  style={{ fontFamily: 'InstrumentSans_700Bold' }}
                >
                  {formatPrice(conversation.offer.price)}
                </Text>
              )}
              {isOfferer && (
                <TouchableOpacity
                  onPress={() => handleAdvanceProgress('Payment received', 'Confirm you have received payment?')}
                  disabled={isAdvancing}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: '#fd6b03' }}
                >
                  <Text className="text-white" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                    {isAdvancing ? 'confirming...' : 'payment received'}
                  </Text>
                </TouchableOpacity>
              )}
              {isRequester && (
                <Text
                  className="text-gray-400 text-xs text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  waiting for helper to confirm payment
                </Text>
              )}
            </View>
          )}

          {currentStep === 'completed' && (
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
              <Text
                className="text-green-700 text-sm mt-1"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                help completed
              </Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={handleContentSizeChange}
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
