import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const statusTabs = [
  { id: 'open', label: 'open' },
  { id: 'in_progress', label: 'in progress' },
  { id: 'completed', label: 'completed' },
];

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default function MyRequestsScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('open');

  const requests = useQuery(api.helpRequests.getMyRequests, {
    status: selectedStatus,
  });

  const handleRequestPress = (request: any) => {
    // If in_progress, go to chat room
    if (request.status === 'in_progress' && request.conversationId) {
      router.push(`/help/chat/${request.conversationId}` as any);
    } else {
      // Otherwise go to request detail
      router.push(`/help/${request._id}` as any);
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
          my requests
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
      {requests === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fd6b03" />
        </View>
      ) : requests.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
          </View>
          <Text
            className="text-xl text-black text-center mb-2"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            no requests
          </Text>
          <Text
            className="text-gray-500 text-center"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {`no ${selectedStatus.replace('_', ' ')} requests`}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {requests.map((request) => {
            return (
              <TouchableOpacity
                key={request._id}
                onPress={() => handleRequestPress(request)}
                className="mx-6 mb-4 p-5 bg-gray-50 rounded-2xl"
                activeOpacity={0.7}
              >
                <Text
                  className="text-black text-lg mb-2"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {request.title}
                </Text>

                {/* Footer - varies by status */}
                {request.status === 'open' ? (
                  // Open: show category, urgent label, and offer count
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="bg-gray-200 px-3 py-1 rounded-full mr-2">
                        <Text
                          className="text-gray-700 text-sm"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.category}
                        </Text>
                      </View>
                      {request.isUrgent && (
                        <View className="bg-red-100 px-3 py-1 rounded-full mr-2">
                          <Text
                            className="text-red-600"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            urgent
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {request.offerCount} {request.offerCount === 1 ? 'offer' : 'offers'}
                    </Text>
                  </View>
                ) : request.status === 'in_progress' ? (
                  // In Progress: show helper info
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      {(request as any).helper && (
                        <>
                          <Image
                            source={{ uri: (request as any).helper.photos?.[0] || 'https://via.placeholder.com/24' }}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <Text
                            className="text-gray-700 text-sm"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            {(request as any).helper.name}
                          </Text>
                        </>
                      )}
                      {(request as any).acceptedPrice && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full ml-2">
                          <Text
                            className="text-green-700 text-xs"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          >
                            {formatPrice((request as any).acceptedPrice)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {formatTime(request.createdAt)}
                    </Text>
                  </View>
                ) : (
                  // Completed: show helper info and paid status
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      {(request as any).helper && (
                        <>
                          <Image
                            source={{ uri: (request as any).helper.photos?.[0] || 'https://via.placeholder.com/24' }}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <Text
                            className="text-gray-700 text-sm"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                          >
                            {(request as any).helper.name}
                          </Text>
                        </>
                      )}
                      {(request as any).isPaidOut && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full ml-2">
                          <Text
                            className="text-green-700 text-xs"
                            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                          >
                            paid out
                          </Text>
                        </View>
                      )}
                    </View>
                    {(request as any).acceptedPrice && (
                      <Text
                        className="text-gray-500 text-sm"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        {formatPrice((request as any).acceptedPrice)}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
