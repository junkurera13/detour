import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { resetData } = useOnboarding();
  const deleteAccountMutation = useMutation(api.users.deleteAccount);

  // Activity Notifications state
  const [notifyNearbyActivities, setNotifyNearbyActivities] = useState(true);
  const [notifyHeatingUp, setNotifyHeatingUp] = useState(true);
  const [notificationDistance, setNotificationDistance] = useState(10);

  // Visibility state
  const [snoozeMode, setSnoozeMode] = useState(false);

  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDistanceChange = (direction: 'increase' | 'decrease') => {
    const currentIndex = DISTANCE_OPTIONS.indexOf(notificationDistance);
    if (direction === 'increase' && currentIndex < DISTANCE_OPTIONS.length - 1) {
      setNotificationDistance(DISTANCE_OPTIONS[currentIndex + 1]);
    } else if (direction === 'decrease' && currentIndex > 0) {
      setNotificationDistance(DISTANCE_OPTIONS[currentIndex - 1]);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              resetData();
              router.replace('/onboarding');
            } catch (error) {
              console.error('Logout error:', error);
              resetData();
              router.replace('/onboarding');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data, matches, messages, and help requests will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccountMutation();
              await signOut();
              resetData();
              router.replace('/onboarding');
            } catch (error) {
              console.error('Delete account error:', error);
              setIsDeleting(false);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show loading screen while deleting account
  if (isDeleting) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fd6b03" />
        <Text
          className="mt-4 text-gray-500"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          deleting account...
        </Text>
      </View>
    );
  }

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
              onPress={() => Alert.alert('Coming Soon', 'Blocked users management will be available soon.')}
            >
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                blocked users
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            account
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Text
                className="text-red-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                log out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={handleDeleteAccount}
            >
              <Text
                className="text-red-500"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                delete account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
