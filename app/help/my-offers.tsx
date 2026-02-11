import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const statusTabs = [
  { id: 'pending', label: 'pending' },
  { id: 'accepted', label: 'accepted' },
  { id: 'rejected', label: 'rejected' },
];

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

const stepLabel = (step?: string) => {
  switch (step) {
    case 'negotiation': return 'negotiation';
    case 'working': return 'in progress';
    case 'payment': return 'payment';
    case 'completed': return 'completed';
    default: return '';
  }
};

export default function MyOffersScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('pending');

  const offers = useQuery(api.helpOffers.getMyOffers, {
    status: selectedStatus,
  });

  const handleOfferPress = (offer: any) => {
    // If accepted, go directly to chat
    if (offer.status === 'accepted' && offer.conversationId) {
      router.push(`/help/chat/${offer.conversationId}` as any);
    } else if (offer.request) {
      router.push(`/help/${offer.request._id}` as any);
    }
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
          offers
        </Text>
      </View>

      {/* Status Tabs */}
      <View className="py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedStatus(tab.id)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: selectedStatus === tab.id ? '#000' : '#F3F4F6' }}
            >
              <Text
                className={`text-sm ${selectedStatus === tab.id ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {offers === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
        </View>
      ) : offers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="hand-right-outline" size={48} color="#9CA3AF" />
          </View>
          <Text
            className="text-xl text-black text-center mb-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            no offers
          </Text>
          <Text
            className="text-gray-500 text-center"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {`no ${selectedStatus} offers`}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {offers.map((offer) => {
            const requester = (offer as any).requester;
            const progressStep = offer.request?.progressStep;

            return (
              <TouchableOpacity
                key={offer._id}
                onPress={() => handleOfferPress(offer)}
                className="mx-6 mb-4 p-5 bg-gray-50 rounded-2xl"
                activeOpacity={0.7}
              >
                {offer.request && (
                  <>
                    {/* Title row */}
                    <View className="flex-row items-center mb-2">
                      <Text
                        className="text-black text-lg flex-1"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        numberOfLines={1}
                      >
                        {offer.request.title}
                      </Text>
                      {offer.request.isUrgent && (
                        <Ionicons name="warning" size={18} color="#DC2626" style={{ marginLeft: 6 }} />
                      )}
                      <Text
                        className="text-gray-400 text-xs ml-2"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {formatTime(offer.createdAt)}
                      </Text>
                    </View>

                    {/* Requester row */}
                    {requester && (
                      <View className="flex-row items-center mb-2">
                        {requester.photos?.[0] ? (
                          <Image source={{ uri: requester.photos[0] }} className="w-7 h-7 rounded-full" />
                        ) : (
                          <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                            <Ionicons name="person" size={14} color="#9CA3AF" />
                          </View>
                        )}
                        <Text
                          className="text-gray-700 text-sm ml-2 flex-1"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {requester.name}
                        </Text>
                        {offer.request.location && (
                          <Text
                            className="text-gray-400 text-xs"
                            style={{ fontFamily: 'InstrumentSans_400Regular' }}
                          >
                            {offer.request.location}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}

                {/* Your offer message */}
                <Text
                  className="text-gray-500 text-sm mb-2"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  numberOfLines={2}
                >
                  {offer.message}
                </Text>

                {/* Footer: badges + price */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {/* Progress step badge for accepted offers */}
                    {offer.status === 'accepted' && progressStep && (
                      <View
                        className="px-2.5 py-1 rounded-full mr-2"
                        style={{
                          backgroundColor: progressStep === 'completed' ? '#DCFCE7' : '#FEF3C7',
                        }}
                      >
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: 'InstrumentSans_500Medium',
                            color: progressStep === 'completed' ? '#166534' : '#92400E',
                          }}
                        >
                          {stepLabel(progressStep)}
                        </Text>
                      </View>
                    )}
                    {offer.request && (
                      <View className="bg-gray-200 px-2 py-1 rounded-full">
                        <Text
                          className="text-gray-600 text-xs"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {offer.request.category}
                        </Text>
                      </View>
                    )}
                  </View>
                  {offer.price ? (
                    <View className="bg-green-100 px-2.5 py-1 rounded-full">
                      <Text
                        className="text-green-700 text-sm"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {formatPrice(offer.price)}
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-gray-100 px-2.5 py-1 rounded-full">
                      <Text
                        className="text-gray-500 text-xs"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        free
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
