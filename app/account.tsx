import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';

export default function AccountScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { resetData } = useOnboarding();
  const deleteAccountMutation = useMutation(api.users.deleteAccount);

  const [isDeleting, setIsDeleting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const hasPassword = clerkUser?.passwordEnabled ?? false;

  const handleLogout = () => {
    Alert.alert(
      'log out',
      'are you sure you want to log out?',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'log out',
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
      'delete account?',
      'are you sure? this will permanently delete all your data, matches, messages, and help requests. this cannot be undone.',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'yes, delete my account',
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
              Alert.alert('error', 'failed to delete account. please try again.');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('error', 'please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('error', 'password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('error', 'passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (hasPassword) {
        await clerkUser?.updatePassword({
          currentPassword,
          newPassword,
        });
      } else {
        await clerkUser?.updatePassword({
          newPassword,
        });
      }
      Alert.alert('success', 'your password has been updated.');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || error?.message || 'failed to update password.';
      Alert.alert('error', msg);
    } finally {
      setSavingPassword(false);
    }
  };

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
          account
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Email Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            email
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden px-4 py-4">
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              {email || 'no email on file'}
            </Text>
          </View>
        </View>

        {/* Password Section */}
        <View className="px-6 pt-6">
          <Text
            className="text-sm text-gray-500 uppercase mb-3"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            password
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            {changingPassword ? (
              <View className="px-4 py-4">
                {hasPassword && (
                  <View className="mb-3">
                    <Text
                      className="text-gray-500 text-sm mb-1"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      current password
                    </Text>
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      placeholder="enter current password"
                      placeholderTextColor="#9CA3AF"
                      className="bg-white rounded-xl px-4 py-3 text-black"
                      style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 15 }}
                    />
                  </View>
                )}
                <View className="mb-3">
                  <Text
                    className="text-gray-500 text-sm mb-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    new password
                  </Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="at least 8 characters"
                    placeholderTextColor="#9CA3AF"
                    className="bg-white rounded-xl px-4 py-3 text-black"
                    style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 15 }}
                  />
                </View>
                <View className="mb-4">
                  <Text
                    className="text-gray-500 text-sm mb-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    confirm new password
                  </Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="re-enter new password"
                    placeholderTextColor="#9CA3AF"
                    className="bg-white rounded-xl px-4 py-3 text-black"
                    style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 15 }}
                  />
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 py-3 rounded-full bg-gray-200 items-center"
                  >
                    <Text
                      className="text-black"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={savingPassword}
                    className="flex-1 py-3 rounded-full items-center"
                    style={{ backgroundColor: '#fd6b03', opacity: savingPassword ? 0.5 : 1 }}
                  >
                    <Text
                      className="text-white"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {savingPassword ? 'saving...' : 'save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                activeOpacity={0.7}
                onPress={() => setChangingPassword(true)}
              >
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  change password
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-6 pt-6">
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
