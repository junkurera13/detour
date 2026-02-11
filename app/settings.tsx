import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25];

export default function SettingsScreen() {
  const router = useRouter();
  const { convexUser } = useAuthenticatedUser();
  const unblockUser = useMutation(api.blocks.unblockUser);

  // Blocked users
  const [blockedVisible, setBlockedVisible] = useState(false);
  const blockedUsers = useQuery(
    api.blocks.getBlockedUsers,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const handleUnblock = (blockedId: Id<"users">, name: string) => {
    if (!convexUser) return;
    Alert.alert('unblock user?', `${name} will be able to see your profile and message you again.`, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'unblock',
        onPress: async () => {
          try {
            await unblockUser({ blockerId: convexUser._id, blockedId });
          } catch {
            Alert.alert('error', 'failed to unblock user');
          }
        },
      },
    ]);
  };

  // Activity Notifications state
  const [notifyNearbyActivities, setNotifyNearbyActivities] = useState(true);
  const [notifyHeatingUp, setNotifyHeatingUp] = useState(true);
  const [notificationDistance, setNotificationDistance] = useState(10);

  // Visibility state
  const [snoozeMode, setSnoozeMode] = useState(false);

  const handleDistanceChange = (direction: 'increase' | 'decrease') => {
    const currentIndex = DISTANCE_OPTIONS.indexOf(notificationDistance);
    if (direction === 'increase' && currentIndex < DISTANCE_OPTIONS.length - 1) {
      setNotificationDistance(DISTANCE_OPTIONS[currentIndex + 1]);
    } else if (direction === 'decrease' && currentIndex > 0) {
      setNotificationDistance(DISTANCE_OPTIONS[currentIndex - 1]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className="flex-1 text-lg text-black ml-2"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Activity Notifications Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            activity notifications
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            {/* Notify Nearby Activities */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  notify me about activities nearby
                </Text>
              </View>
              <Switch
                value={notifyNearbyActivities}
                onValueChange={setNotifyNearbyActivities}
                trackColor={{ false: '#E5E7EB', true: '#fdba74' }}
                thumbColor={notifyNearbyActivities ? '#fd6b03' : '#f4f3f4'}
              />
            </View>

            {/* Notify Heating Up */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  notify me when nearby activities are heating up
                </Text>
              </View>
              <Switch
                value={notifyHeatingUp}
                onValueChange={setNotifyHeatingUp}
                trackColor={{ false: '#E5E7EB', true: '#fdba74' }}
                thumbColor={notifyHeatingUp ? '#fd6b03' : '#f4f3f4'}
              />
            </View>

            {/* Notification Distance */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                notification distance
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleDistanceChange('decrease')}
                  className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                  disabled={notificationDistance === DISTANCE_OPTIONS[0]}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={notificationDistance === DISTANCE_OPTIONS[0] ? '#D1D5DB' : '#000'}
                  />
                </TouchableOpacity>
                <Text
                  className="mx-4 text-black min-w-[50px] text-center"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {notificationDistance} km
                </Text>
                <TouchableOpacity
                  onPress={() => handleDistanceChange('increase')}
                  className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                  disabled={notificationDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1]}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={notificationDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1] ? '#D1D5DB' : '#000'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Visibility Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            visibility
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            {/* Snooze Mode */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  snooze mode
                </Text>
                <Text
                  className="text-gray-500 text-sm mt-1"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  hide me from nearby list
                </Text>
              </View>
              <Switch
                value={snoozeMode}
                onValueChange={setSnoozeMode}
                trackColor={{ false: '#E5E7EB', true: '#fdba74' }}
                thumbColor={snoozeMode ? '#fd6b03' : '#f4f3f4'}
              />
            </View>

            {/* Blocked Users */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={() => setBlockedVisible(true)}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                blocked users
              </Text>
              <View className="flex-row items-center">
                {blockedUsers && blockedUsers.length > 0 && (
                  <Text
                    className="text-gray-400 text-sm mr-2"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {blockedUsers.length}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            support
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:support@detour.app?subject=Issue%20Report')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                report an issue
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            legal
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://junkurera13.github.io/detour/community-guidelines')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                community guidelines
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://junkurera13.github.io/detour/terms-and-conditions')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                terms and conditions
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://junkurera13.github.io/detour/privacy-policy.html')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                privacy policy
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://junkurera13.github.io/detour/safety-tips')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                safety tips & event etiquette
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Blocked Users Modal */}
      <Modal
        visible={blockedVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBlockedVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-gray-100">
            <TouchableOpacity
              onPress={() => setBlockedVisible(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              blocked users
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {!blockedUsers || blockedUsers.length === 0 ? (
              <View className="items-center py-20 px-6">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="ban-outline" size={32} color="#9CA3AF" />
                </View>
                <Text
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  no blocked users
                </Text>
              </View>
            ) : (
              blockedUsers.map((block) => {
                const user = block.blockedUser;
                if (!user) return null;
                return (
                  <View
                    key={block._id}
                    className="flex-row items-center px-6 py-4 border-b border-gray-50"
                  >
                    {user.photos?.[0] ? (
                      <Image
                        source={{ uri: user.photos[0] }}
                        className="w-12 h-12 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-black"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {user.name}
                      </Text>
                      {user.username && (
                        <Text
                          className="text-gray-400 text-sm"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          @{user.username}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(user._id, user.name)}
                      className="px-4 py-2 bg-gray-100 rounded-full"
                      activeOpacity={0.7}
                    >
                      <Text
                        className="text-black text-sm"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        unblock
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
