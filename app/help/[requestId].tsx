import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function HelpRequestDetailScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const request = useQuery(
    api.helpRequests.getById,
    requestId ? { id: requestId as Id<"helpRequests"> } : "skip"
  );
  const offers = useQuery(
    api.helpOffers.getByRequest,
    requestId ? { requestId: requestId as Id<"helpRequests"> } : "skip"
  );
  const userOffer = useQuery(
    api.helpOffers.getUserOfferForRequest,
    requestId ? { requestId: requestId as Id<"helpRequests"> } : "skip"
  );
  const currentUser = useQuery(api.users.getCurrentUser);

  const createOffer = useMutation(api.helpOffers.create);
  const acceptOffer = useMutation(api.helpRequests.acceptOffer);
  const withdrawOffer = useMutation(api.helpOffers.withdraw);
  const deleteRequest = useMutation(api.helpRequests.deleteRequest);
  const updateRequest = useMutation(api.helpRequests.update);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsUrgent, setEditIsUrgent] = useState(false);

  const isAuthor = currentUser?._id === request?.authorId;
  const hasExistingOffer = !!userOffer;

  const handleSubmitOffer = async () => {
    if (!offerMessage.trim() || isSubmitting) return;

    let priceInCents: number | undefined;
    if (offerPrice.trim()) {
      priceInCents = Math.round(parseFloat(offerPrice) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        Alert.alert('Invalid price', 'Please enter a valid price.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createOffer({
        requestId: requestId as Id<"helpRequests">,
        price: priceInCents,
        message: offerMessage.trim(),
      });
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

  const handleDeleteRequest = async () => {
    Alert.alert(
      'Delete request',
      'Are you sure you want to delete this request? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRequest({ id: requestId as Id<"helpRequests"> });
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete request.');
            }
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    if (!request) return;
    setEditTitle(request.title);
    setEditDescription(request.description);
    setEditIsUrgent(request.isUrgent);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateRequest({
        id: requestId as Id<"helpRequests">,
        title: editTitle.trim(),
        description: editDescription.trim(),
        isUrgent: editIsUrgent,
      });
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (request === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fd6b03" />
      </SafeAreaView>
    );
  }

  if (request === null) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text
            className="text-gray-500 text-center mt-3"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            request not found
          </Text>
        </View>
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
        <View className="flex-1" />
        {isAuthor && request.status === 'open' && (
          <View>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)} className="p-2 ml-1">
              <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
            </TouchableOpacity>
            {showMenu && (
              <View
                className="absolute right-0 bg-white rounded-xl py-2 z-50"
                style={{
                  top: 40,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 5,
                  minWidth: 160,
                }}
              >
                <TouchableOpacity
                  onPress={() => { setShowMenu(false); openEditModal(); }}
                  className="flex-row items-center px-4 py-3"
                >
                  <Ionicons name="create-outline" size={18} color="#374151" />
                  <Text
                    className="text-gray-800 ml-3"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    edit request
                  </Text>
                </TouchableOpacity>
                <View className="h-px bg-gray-100 mx-3" />
                <TouchableOpacity
                  onPress={() => { setShowMenu(false); handleDeleteRequest(); }}
                  className="flex-row items-center px-4 py-3"
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text
                    className="text-red-600 ml-3"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    delete request
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} onScrollBeginDrag={() => setShowMenu(false)}>
        {/* Author Info */}
        <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
          {request.author?.photos?.[0] ? (
            <Image source={{ uri: request.author.photos[0] }} className="w-10 h-10 rounded-full" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}
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

        {/* Title */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-start">
            <Text
              className="text-black text-xl flex-1"
              style={{ fontFamily: 'InstrumentSans_700Bold' }}
            >
              {request.title}
            </Text>
            {request.isUrgent && (
              <Ionicons name="warning" size={22} color="#DC2626" style={{ marginLeft: 8, marginTop: 3 }} />
            )}
          </View>
        </View>

        {/* Description */}
        {request.description ? (
          <View className="px-6 pb-4">
            <Text
              className="text-black leading-6"
              style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
            >
              {request.description}
            </Text>
          </View>
        ) : null}

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

        {/* Status Banner — cancelled only */}
        {request.status === 'cancelled' && (
          <View className="mx-6 mb-4 p-4 rounded-2xl" style={{ backgroundColor: '#fee2e2' }}>
            <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#991b1b' }}>
              ✕ Cancelled
            </Text>
          </View>
        )}

        {/* Vertical Progress Tracker — in_progress / completed */}
        {(request.status === 'in_progress' || request.status === 'completed') && (() => {
          const steps = [
            { key: 'negotiation', label: 'negotiation', desc: 'discuss details and agree on terms' },
            { key: 'working', label: 'in progress', desc: 'work is being done' },
            { key: 'payment', label: 'payment', desc: 'send payment to helper' },
            { key: 'completed', label: 'closed', desc: 'help completed' },
          ];
          const currentStep = request.status === 'completed' ? 'completed' : (request.progressStep || 'negotiation');
          const stepIndex = steps.findIndex((s) => s.key === currentStep);

          return (
            <View className="mx-6 mb-4 p-5 bg-gray-50 rounded-2xl">
              <Text
                className="text-black mb-4"
                style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16 }}
              >
                progress
              </Text>
              {steps.map((step, i) => {
                const isCompleted = i < stepIndex;
                const isCurrent = i === stepIndex;
                const isLast = i === steps.length - 1;

                return (
                  <View key={step.key} className="flex-row">
                    {/* Left column: circle + line */}
                    <View className="items-center" style={{ width: 28 }}>
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
                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            backgroundColor: i < stepIndex ? '#fd6b03' : '#E5E7EB',
                          }}
                        />
                      )}
                    </View>
                    {/* Right column: label + description */}
                    <View className="ml-3 flex-1" style={{ paddingBottom: isLast ? 0 : 16 }}>
                      <Text
                        style={{
                          fontFamily: isCompleted || isCurrent ? 'InstrumentSans_600SemiBold' : 'InstrumentSans_400Regular',
                          color: isCompleted || isCurrent ? '#000' : '#9CA3AF',
                          fontSize: 15,
                          lineHeight: 28,
                        }}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text
                          className="text-gray-500 text-sm mt-0.5"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          {step.desc}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Go to chat button */}
              {request.conversationId && (
                <TouchableOpacity
                  onPress={() => router.push(`/help/chat/${request.conversationId}` as any)}
                  className="mt-4 py-3 rounded-xl items-center border border-orange-200 bg-orange-50"
                >
                  <Text className="text-orange-600" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                    go to chat
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

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
                    {offer.offerer?.photos?.[0] ? (
                      <Image source={{ uri: offer.offerer.photos[0] }} className="w-8 h-8 rounded-full" />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                        <Ionicons name="person" size={16} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
                        {offer.offerer?.name || 'Unknown'}
                      </Text>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'InstrumentSans_400Regular' }}>
                        {offer.offerer?.currentLocation} · {formatTime(offer.createdAt)}
                      </Text>
                    </View>
                    {offer.price ? (
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700" style={{ fontFamily: 'InstrumentSans_700Bold' }}>
                          {formatPrice(offer.price)}
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-500" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                          free
                        </Text>
                      </View>
                    )}
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

        {/* Spacer for open requests */}
        {isAuthor && request.status === 'open' && (
          <View className="pb-4" />
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
              {userOffer.price ? (
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-600" style={{ fontFamily: 'InstrumentSans_500Medium' }}>
                    price
                  </Text>
                  <Text className="text-orange-600" style={{ fontFamily: 'InstrumentSans_700Bold', fontSize: 18 }}>
                    {formatPrice(userOffer.price)}
                  </Text>
                </View>
              ) : null}
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

      {/* Edit Request Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl px-6 pb-8 pt-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold' }}
              >
                edit request
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                title
              </Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="what do you need help with?"
                maxLength={100}
                className="bg-gray-50 rounded-2xl px-4 py-4 text-black mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 16 }}
              />

              {/* Description */}
              <Text
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                description
              </Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="describe the problem in detail..."
                multiline
                maxLength={1000}
                className="bg-gray-50 rounded-2xl px-4 py-4 text-black mb-4"
                style={{ fontFamily: 'InstrumentSans_400Regular', minHeight: 100, textAlignVertical: 'top' }}
              />

              {/* Urgent toggle */}
              <TouchableOpacity
                onPress={() => setEditIsUrgent(!editIsUrgent)}
                className="flex-row items-center mb-6"
              >
                <View
                  className="w-6 h-6 rounded-md border-2 items-center justify-center mr-3"
                  style={{
                    borderColor: editIsUrgent ? '#DC2626' : '#D1D5DB',
                    backgroundColor: editIsUrgent ? '#FEE2E2' : 'transparent',
                  }}
                >
                  {editIsUrgent && <Ionicons name="checkmark" size={16} color="#DC2626" />}
                </View>
                <Ionicons name="warning" size={18} color={editIsUrgent ? '#DC2626' : '#9CA3AF'} style={{ marginRight: 6 }} />
                <Text
                  className="text-sm"
                  style={{
                    fontFamily: 'InstrumentSans_500Medium',
                    color: editIsUrgent ? '#DC2626' : '#6B7280',
                  }}
                >
                  mark as urgent
                </Text>
              </TouchableOpacity>

              <Button
                title={isSubmitting ? 'saving...' : 'save changes'}
                onPress={handleSaveEdit}
                disabled={!editTitle.trim() || !editDescription.trim() || isSubmitting}
                loading={isSubmitting}
                variant="accent"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              disabled={!offerMessage.trim() || isSubmitting}
              loading={isSubmitting}
              variant="accent"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
