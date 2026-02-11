import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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


export default function MyRequestsScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('open');

  const requests = useQuery(api.helpRequests.getMyRequests, {
    status: selectedStatus,
  });

  const handleRequestPress = (request: any) => {
    router.push(`/help/${request._id}` as any);
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
          requests
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
            const helper = (request as any).helper;
            const progressStep = (request as any).progressStep || 'negotiation';

            return (
              <TouchableOpacity
                key={request._id}
                onPress={() => handleRequestPress(request)}
                className="mx-6 mb-4 p-5 bg-gray-50 rounded-2xl"
                activeOpacity={0.7}
              >
                {/* Title row */}
                <View className="flex-row items-start mb-2">
                  <Text
                    className="text-black text-lg flex-1"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {request.title}
                  </Text>
                  {request.isUrgent && (
                    <View style={{ height: 26, justifyContent: 'center', marginLeft: 6 }}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                    </View>
                  )}
                  <Text
                    className="text-gray-400 text-xs ml-2"
                    style={{ fontFamily: 'InstrumentSans_400Regular', lineHeight: 26 }}
                  >
                    {formatTime(request.createdAt)}
                  </Text>
                </View>

                {request.status === 'open' ? (
                  // Open: category + offer count
                  <View>
                    <View className="flex-row items-center justify-between">
                      <View className="bg-gray-200 px-3 py-1 rounded-full">
                        <Text
                          className="text-gray-700 text-sm"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.category}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="hand-wave-outline" size={16} color="#9CA3AF" />
                        <Text
                          className="text-gray-500 text-sm ml-1"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.offerCount} {request.offerCount === 1 ? 'offer' : 'offers'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  // In Progress / Completed: show helper + step + price
                  <View>
                    {/* Helper row */}
                    {helper && (
                      <View className="flex-row items-center mb-2">
                        {helper.photos?.[0] ? (
                          <Image source={{ uri: helper.photos[0] }} className="w-7 h-7 rounded-full" />
                        ) : (
                          <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                            <Ionicons name="person" size={14} color="#9CA3AF" />
                          </View>
                        )}
                        <Text
                          className="text-gray-700 text-sm ml-2"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {helper.name}
                        </Text>
                      </View>
                    )}
                    {/* Step + category */}
                    <View className="flex-row items-center">
                      <View
                        className="px-2.5 py-1 rounded-full mr-2"
                        style={{
                          backgroundColor: request.status === 'completed' ? '#DCFCE7' : '#FEF3C7',
                        }}
                      >
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: 'InstrumentSans_500Medium',
                            color: request.status === 'completed' ? '#166534' : '#92400E',
                          }}
                        >
                          {request.status === 'completed' ? 'completed' : progressStep.replace('_', ' ')}
                        </Text>
                      </View>
                      <View className="bg-gray-200 px-2 py-1 rounded-full">
                        <Text
                          className="text-gray-600 text-xs"
                          style={{ fontFamily: 'InstrumentSans_500Medium' }}
                        >
                          {request.category}
                        </Text>
                      </View>
                    </View>
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
