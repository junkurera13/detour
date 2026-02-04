import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { mockHelpRequests } from '@/data/mockData';

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Mock offers for demo purposes
const mockOffers = [
  {
    _id: 'offer_1',
    price: 7500,
    message: 'I have 5 years experience with solar setups on vans. I can diagnose the issue and fix it same day. Have all the tools needed.',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    offerer: {
      name: 'Mike',
      photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face'],
      currentLocation: 'canggu, bali',
    },
  },
  {
    _id: 'offer_2',
    price: 5000,
    message: 'Electrician by trade, been working on van conversions for 2 years. Can come check it out tomorrow morning.',
    status: 'pending',
    createdAt: Date.now() - 7200000,
    offerer: {
      name: 'Sarah',
      photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face'],
      currentLocation: 'seminyak, bali',
    },
  },
];

export default function HelpRequestDetailScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  // Check if this is a mock request
  const isMockRequest = requestId?.startsWith('help_');

  // Find mock request if applicable
  const mockRequest = useMemo(() => {
    if (!isMockRequest) return null;
    return mockHelpRequests.find(r => r._id === requestId) || null;
  }, [requestId, isMockRequest]);

  // Only query Convex if it's not a mock request
  const convexRequest = useQuery(
    api.helpRequests.getById,
    !isMockRequest ? { id: requestId as Id<"helpRequests"> } : "skip"
  );
  const convexOffers = useQuery(
    api.helpOffers.getByRequest,
    !isMockRequest ? { requestId: requestId as Id<"helpRequests"> } : "skip"
  );
  const userOffer = useQuery(
    api.helpOffers.getUserOfferForRequest,
    !isMockRequest ? { requestId: requestId as Id<"helpRequests"> } : "skip"
  );
  const currentUser = useQuery(api.users.getCurrentUser);

  // Use mock or real data
  const request = isMockRequest ? mockRequest : convexRequest;
  const offers = isMockRequest ? mockOffers : convexOffers;

  const createOffer = useMutation(api.helpOffers.create);
  const acceptOffer = useMutation(api.helpRequests.acceptOffer);
  const withdrawOffer = useMutation(api.helpOffers.withdraw);
  const cancelRequest = useMutation(api.helpRequests.cancel);
  const completeRequest = useMutation(api.helpRequests.complete);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For mock data, user is never the author (so they can see the "make offer" flow)
  const isAuthor = isMockRequest ? false : currentUser?._id === (request as any)?.authorId;
  const hasExistingOffer = isMockRequest ? false : !!userOffer;

  const handleSubmitOffer = async () => {
    if (!offerPrice || !offerMessage.trim() || isSubmitting) return;

    const priceInCents = Math.round(parseFloat(offerPrice) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isMockRequest) {
        // Simulate success for mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        Alert.alert('Offer submitted!', 'Your offer has been sent to the requester.');
      } else {
        await createOffer({
          requestId: requestId as Id<"helpRequests">,
          price: priceInCents,
          message: offerMessage.trim(),
        });
      }
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offerId: Id<"helpOffers">) => {
    Alert.alert(
      'Accept offer',
      'Are you sure you want to accept this offer? Other offers will be declined.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptOffer({
                requestId: requestId as Id<"helpRequests">,
                offerId,
              });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept offer.');
            }
          },
        },
      ]
    );
  };

  const handleWithdrawOffer = async () => {
    if (!userOffer) return;

    Alert.alert(
      'Withdraw offer',
      'Are you sure you want to withdraw your offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawOffer({ id: userOffer._id });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to withdraw offer.');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest({ id: requestId as Id<"helpRequests"> });
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel request.');
            }
          },
        },
      ]
    );
  };

  const handleCompleteRequest = async () => {
    Alert.alert(
      'Mark as complete',
      'Mark this request as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeRequest({ id: requestId as Id<"helpRequests"> });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete request.');
            }
          },
        },
      ]
    );
  };

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fd6b03" />
      </SafeAreaView>
    );
  }

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
          numberOfLines={1}
        >
          {request.title}
        </Text>
        {request.isUrgent && (
          <View className="bg-red-100 px-2 py-1 rounded-full ml-2">
            <Text className="text-red-600 text-xs" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
              urgent
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Author Info */}
        <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
          <Image
            source={{ uri: request.author?.photos?.[0] || 'https://via.placeholder.com/40' }}
            className="w-10 h-10 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {request.author?.name || 'Unknown'}
            </Text>
            <Text
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {request.location ? `${request.location} · ` : ''}{formatTime(request.createdAt)}
            </Text>
          </View>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text
              className="text-gray-600 text-sm"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              {request.category}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="px-6 py-4">
          <Text
            className="text-black leading-6"
            style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
          >
            {request.description}
          </Text>
        </View>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <View className="px-6 pb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {request.photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-48 h-36 rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Status Banner */}
        {request.status !== 'open' && (
          <View className="mx-6 mb-4 p-4 rounded-2xl" style={{
            backgroundColor: request.status === 'completed' ? '#dcfce7' :
                            request.status === 'in_progress' ? '#fef3c7' : '#fee2e2'
          }}>
            <Text style={{
              fontFamily: 'InstrumentSans_600SemiBold',
              color: request.status === 'completed' ? '#166534' :
                     request.status === 'in_progress' ? '#92400e' : '#991b1b'
            }}>
              {request.status === 'completed' ? '✓ Completed' :
               request.status === 'in_progress' ? '⏳ In Progress' : '✕ Cancelled'}
            </Text>
          </View>
        )}

        {/* Offers Section (Author View) */}
        {isAuthor && request.status === 'open' && (
          <View className="px-6 py-4 border-t border-gray-100">
            <Text
              className="text-lg text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              offers ({offers?.length || 0})
            </Text>

            {offers && offers.length > 0 ? (
              offers.map((offer) => (
                <View
                  key={offer._id}
                  className="bg-gray-50 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: offer.offerer?.photos?.[0] || 'https://via.placeholder.com/32' }}
                      className="w-8 h-8 rounded-full"
                    />
                    <View className="ml-3 flex-1">
                      <Text style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                        {offer.offerer?.name || 'Unknown'}
                      </Text>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'InstrumentSans_400Regular' }}>
                        {offer.offerer?.currentLocation} · {formatTime(offer.createdAt)}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-green-700" style={{ fontFamily: 'InstrumentSans_700Bold' }}>
                        {formatPrice(offer.price)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 mb-3" style={{ fontFamily: 'InstrumentSans_400Regular' }}>
                    {offer.message}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleAcceptOffer(offer._id as Id<"helpOffers">)}
                    className="bg-orange-500 py-3 rounded-xl items-center"
                    style={{ backgroundColor: '#fd6b03' }}
                  >
                    <Text className="text-white" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                      accept offer
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Ionicons name="hand-left-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-3" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                  no offers yet
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Author Actions */}
        {isAuthor && request.status === 'open' && (
          <View className="px-6 pb-6">
            <TouchableOpacity onPress={handleCancelRequest}>
              <Text className="text-center text-red-500" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                cancel request
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isAuthor && request.status === 'in_progress' && (
          <View className="px-6 pb-6">
            <Button
              title="mark as complete"
              onPress={handleCompleteRequest}
              variant="accent"
            />
          </View>
        )}

        {/* User's Existing Offer */}
        {!isAuthor && hasExistingOffer && userOffer && (
          <View className="px-6 py-4 border-t border-gray-100">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              your offer
            </Text>
            <View className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                  price
                </Text>
                <Text className="text-orange-600" style={{ fontFamily: 'InstrumentSans_700Bold', fontSize: 18 }}>
                  {formatPrice(userOffer.price)}
                </Text>
              </View>
              <Text className="text-gray-600" style={{ fontFamily: 'InstrumentSans_400Regular' }}>
                {userOffer.message}
              </Text>
              <View className="flex-row items-center mt-3">
                <View className={`px-2 py-1 rounded-full ${
                  userOffer.status === 'pending' ? 'bg-yellow-100' :
                  userOffer.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Text className={`text-xs ${
                    userOffer.status === 'pending' ? 'text-yellow-700' :
                    userOffer.status === 'accepted' ? 'text-green-700' : 'text-red-700'
                  }`} style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                    {userOffer.status}
                  </Text>
                </View>
                {userOffer.status === 'pending' && (
                  <TouchableOpacity onPress={handleWithdrawOffer} className="ml-auto">
                    <Text className="text-red-500 text-sm" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                      withdraw
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Make Offer Button (Non-author, open request, no existing offer) */}
      {!isAuthor && request.status === 'open' && !hasExistingOffer && (
        <View className="px-6 pb-6 pt-4 border-t border-gray-100">
          <Button
            title="make an offer"
            onPress={() => setShowOfferModal(true)}
            variant="accent"
          />
        </View>
      )}

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl px-6 pb-8 pt-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold' }}
              >
                make an offer
              </Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Price Input */}
            <Text
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              your price
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 mb-4">
              <Text className="text-lg text-gray-400 mr-2">$</Text>
              <TextInput
                value={offerPrice}
                onChangeText={setOfferPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="flex-1 py-4 text-lg text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              />
            </View>

            {/* Message Input */}
            <Text
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              message
            </Text>
            <TextInput
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="describe your experience and why you can help..."
              multiline
              numberOfLines={4}
              maxLength={500}
              className="bg-gray-50 rounded-2xl px-4 py-4 text-black mb-6"
              style={{ fontFamily: 'InstrumentSans_400Regular', minHeight: 100, textAlignVertical: 'top' }}
            />

            <Button
              title={isSubmitting ? 'submitting...' : 'submit offer'}
              onPress={handleSubmitOffer}
              disabled={!offerPrice || !offerMessage.trim() || isSubmitting}
              loading={isSubmitting}
              variant="accent"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
